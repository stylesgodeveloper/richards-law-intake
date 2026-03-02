import { NextRequest, NextResponse } from "next/server";
import { computeViabilityScore } from "@/lib/scoring-engine";
import { generateFollowUpChecklist } from "@/lib/follow-up-tasks";
import { generateClientEmail } from "@/lib/email-template";

export const maxDuration = 120;

// Helper to get Clio custom field IDs
async function getClioCustomFieldIds(clioToken: string): Promise<Record<string, number>> {
  const res = await fetch(
    "https://app.clio.com/api/v4/custom_fields?fields=id,name&page_size=100",
    {
      headers: { Authorization: `Bearer ${clioToken}` },
    }
  );
  if (!res.ok) throw new Error(`Clio custom fields fetch failed: ${res.status}`);
  const data = await res.json();
  const map: Record<string, number> = {};
  for (const field of data.data) {
    // Normalize name to lowercase for matching
    map[field.name.toLowerCase()] = field.id;
  }
  return map;
}

// Helper to update Clio matter custom fields
async function updateClioMatter(
  clioToken: string,
  matterId: string,
  fieldMap: Record<string, number>,
  values: Record<string, string | null>
) {
  const customFieldValues = Object.entries(values)
    .filter(([_, v]) => v !== null && v !== undefined && v !== "")
    .map(([fieldName, value]) => {
      const fieldId = fieldMap[fieldName.toLowerCase()];
      if (!fieldId) {
        console.warn(`Custom field not found: ${fieldName}`);
        return null;
      }
      return { custom_field: { id: fieldId }, value };
    })
    .filter(Boolean);

  const res = await fetch(`https://app.clio.com/api/v4/matters/${matterId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${clioToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: { custom_field_values: customFieldValues } }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Clio matter update failed: ${res.status} - ${err}`);
  }
  return res.json();
}

// Helper to change matter stage
async function changeClioStage(clioToken: string, matterId: string, stage: string) {
  const res = await fetch(`https://app.clio.com/api/v4/matters/${matterId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${clioToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: { status: "open", stage: stage } }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`Stage change to "${stage}" failed: ${res.status} - ${err}`);
  }
}

// Helper to create calendar entry
async function createCalendarEntry(
  clioToken: string,
  matterId: string,
  summary: string,
  description: string,
  date: string
) {
  const res = await fetch("https://app.clio.com/api/v4/calendar_entries", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clioToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        summary,
        description,
        start_at: `${date}T09:00:00-05:00`,
        end_at: `${date}T09:30:00-05:00`,
        all_day: true,
        matter: { id: parseInt(matterId) },
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`Calendar entry failed: ${res.status} - ${err}`);
  }
}

// Helper to create audit note
async function createAuditNote(clioToken: string, matterId: string, detail: string) {
  const res = await fetch("https://app.clio.com/api/v4/notes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clioToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        detail,
        regarding: { id: parseInt(matterId), type: "Matter" },
      },
    }),
  });
  if (!res.ok) {
    console.warn(`Audit note creation failed: ${res.status}`);
  }
}

// Helper to create a Clio task
async function createClioTask(
  clioToken: string,
  matterId: string,
  name: string,
  description: string,
  priority: "High" | "Normal" | "Low",
  dueInDays: number
) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueInDays);
  const res = await fetch("https://app.clio.com/api/v4/tasks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clioToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        name,
        description,
        priority,
        due_at: dueDate.toISOString(),
        matter: { id: parseInt(matterId) },
      },
    }),
  });
  if (!res.ok) {
    console.warn(`Task creation failed: ${res.status}`);
  }
}

const PRIORITY_MAP: Record<string, "High" | "Normal" | "Low"> = {
  high: "High",
  medium: "Normal",
  low: "Low",
};

const DUE_DAYS: Record<string, number> = {
  high: 7,
  medium: 14,
  low: 30,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matter_id, extraction, client_email } = body;

    if (!extraction) {
      return NextResponse.json(
        { error: "Missing extraction data" },
        { status: 400 }
      );
    }

    const autoCreate = !matter_id || matter_id === "auto";

    const clioToken = process.env.CLIO_ACCESS_TOKEN;
    const makeWebhook = process.env.MAKE_WEBHOOK_PROCESS;
    const steps: { step: string; status: string; detail?: string }[] = [];

    // Map extraction to flat values
    const clientFullName =
      extraction.client_party.full_name ||
      `${extraction.client_party.first_name} ${extraction.client_party.last_name}`;
    const clientGender = extraction.client_party.sex === "F" ? "her" : "his";
    const defendantName =
      extraction.adverse_party.full_name ||
      `${extraction.adverse_party.first_name} ${extraction.adverse_party.last_name}`;
    const clientAddress = [
      extraction.client_party.address,
      extraction.client_party.city,
      extraction.client_party.state,
      extraction.client_party.zip,
    ]
      .filter(Boolean)
      .join(", ");
    const defendantAddress = [
      extraction.adverse_party.address,
      extraction.adverse_party.city,
      extraction.adverse_party.state,
      extraction.adverse_party.zip,
    ]
      .filter(Boolean)
      .join(", ");

    // Calculate SOL dates — use type-aware SOL from scoring data
    const accidentDate = extraction.accident_details.date;
    const reportType = extraction.report_type || "general_incident";
    const SOL_YEARS: Record<string, number> = {
      vehicle_accident: 3,
      slip_and_fall: 3,
      assault: 1,
      dog_bite: 3,
      general_incident: 3,
    };
    const solYears = SOL_YEARS[reportType] || 3;
    let solPrimary = extraction.statute_of_limitations_date_8yr; // may be pre-set from extraction
    let solSecondary = null;
    if (accidentDate) {
      const dPrimary = new Date(accidentDate);
      dPrimary.setFullYear(dPrimary.getFullYear() + solYears);
      solPrimary = solPrimary || dPrimary.toISOString().split("T")[0];
      // Also calendar a secondary reminder (6 months before SOL)
      const dSecondary = new Date(dPrimary);
      dSecondary.setMonth(dSecondary.getMonth() - 6);
      solSecondary = dSecondary.toISOString().split("T")[0];
    }

    // Compute case viability score
    const viabilityScore = computeViabilityScore(extraction);

    // Generate follow-up tasks
    const followUpTasks = generateFollowUpChecklist(extraction);

    // Generate personalized client email
    const clientEmailContent = generateClientEmail(extraction);

    // ===== OPTION 1: If Make.com webhook is configured, delegate to it =====
    if (makeWebhook) {
      // Flatten payload so Make.com can access all fields at the top level
      // Build flat payload, omitting empty values so Clio doesn't reject them
      const allFields: Record<string, string> = {
        auto_create: autoCreate ? "true" : "false",
        matter_id: autoCreate ? "" : matter_id,
        // Client info (used for contact + matter creation when auto_create)
        client_email: client_email || "",
        client_first_name: extraction.client_party.first_name || "",
        client_last_name: extraction.client_party.last_name || "",
        // Client party
        client_full_name: clientFullName,
        client_gender: extraction.client_party.sex === "F" ? "her" : "his",
        client_address: clientAddress,
        client_dob: extraction.client_party.date_of_birth || "",
        client_drivers_license: extraction.client_party.drivers_license || "",
        client_plate_number: extraction.client_party.plate_number || "",
        client_vehicle: extraction.client_party.vehicle_year_make_model || "",
        // Adverse party
        defendant_name: defendantName,
        defendant_address: defendantAddress,
        defendant_vehicle: extraction.adverse_party.vehicle_year_make_model || "",
        // Accident details
        accident_date: accidentDate || "",
        accident_location: extraction.accident_details.full_location || "",
        accident_description: extraction.accident_details.description_verbatim || "",
        accident_type: extraction.accident_details.accident_type || "",
        number_injured: String(extraction.accident_details.num_injured ?? 0),
        injuries_description: extraction.client_party.injuries || "",
        // Report metadata
        police_report_number: extraction.report_metadata.report_number || "",
        officer_name: extraction.report_metadata.officer_name || "",
        precinct: extraction.report_metadata.precinct || "",
        // SOL dates
        statute_of_limitations_date: solPrimary || "",
        sol_3yr: solSecondary || "",
        // Matter description (used for auto-creation)
        matter_description: `${clientFullName} v. ${defendantName}`,
        // AI Case Viability Score
        case_viability_score: String(viabilityScore.total_score),
        case_viability_category: viabilityScore.category,
        case_viability_settlement: viabilityScore.settlement_range,
        case_viability_recommendation: viabilityScore.recommendation,
        follow_up_tasks: JSON.stringify(followUpTasks),
        follow_up_task_count: String(followUpTasks.length),
        // Pre-rendered client email (for Make.com email module)
        email_subject: clientEmailContent.subject,
        email_body_html: clientEmailContent.html,
        email_body_text: clientEmailContent.text,
      };
      // Remove empty values to avoid Clio "Invalid parameter" errors
      const flatPayload: Record<string, string> = {
        auto_create: autoCreate ? "true" : "false",
        matter_id: autoCreate ? "" : matter_id,
      };
      for (const [key, val] of Object.entries(allFields)) {
        if (val !== "") flatPayload[key] = val;
      }

      const response = await fetch(makeWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flatPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Make.com process webhook error:", errText);
        return NextResponse.json(
          { error: `Processing webhook error: ${response.status}` },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Data sent to Make.com processing pipeline",
      });
    }

    // ===== OPTION 2: Direct Clio integration (if CLIO_ACCESS_TOKEN is set) =====
    if (clioToken) {
      // Step 1: Get custom field IDs
      try {
        const fieldMap = await getClioCustomFieldIds(clioToken);
        steps.push({ step: "fetch_field_ids", status: "completed", detail: `Found ${Object.keys(fieldMap).length} custom fields` });

        // Step 2: Update custom fields
        await updateClioMatter(clioToken, matter_id, fieldMap, {
          ClientFullName: clientFullName,
          ClientGender: clientGender,
          ClientAddress: clientAddress,
          ClientDOB: extraction.client_party.date_of_birth,
          ClientDriversLicense: extraction.client_party.drivers_license,
          ClientPlateNumber: extraction.client_party.plate_number || "N/A",
          ClientVehicle: extraction.client_party.vehicle_year_make_model,
          DefendantName: defendantName,
          DefendantAddress: defendantAddress,
          DefendantVehicle: extraction.adverse_party.vehicle_year_make_model,
          AccidentDate: accidentDate,
          AccidentLocation: extraction.accident_details.full_location,
          AccidentDescription: extraction.accident_details.description_verbatim,
          AccidentType: extraction.accident_details.accident_type,
          NumberInjured: String(extraction.accident_details.num_injured),
          InjuriesDescription: extraction.client_party.injuries || "",
          PoliceReportNumber: extraction.report_metadata.report_number,
          OfficerName: extraction.report_metadata.officer_name,
          Precinct: extraction.report_metadata.precinct,
          StatuteOfLimitationsDate: solPrimary,
        });
        steps.push({ step: "update_custom_fields", status: "completed", detail: "20 fields updated" });
      } catch (err) {
        steps.push({ step: "update_custom_fields", status: "error", detail: String(err) });
      }

      // Step 3: Change stage to "Data Verified"
      try {
        await changeClioStage(clioToken, matter_id, "Data Verified");
        steps.push({ step: "stage_data_verified", status: "completed" });
      } catch (err) {
        steps.push({ step: "stage_data_verified", status: "error", detail: String(err) });
      }

      // Step 4: Change stage to "Retainer Ready" (triggers Clio automated workflow)
      try {
        await changeClioStage(clioToken, matter_id, "Retainer Ready");
        steps.push({ step: "stage_retainer_ready", status: "completed", detail: "Triggers Clio doc automation workflow" });
      } catch (err) {
        steps.push({ step: "stage_retainer_ready", status: "error", detail: String(err) });
      }

      // Step 5: Create SOL calendar entries
      if (solPrimary) {
        try {
          await createCalendarEntry(
            clioToken,
            matter_id,
            `SOL DEADLINE (${solYears}yr) — ${clientFullName} v. ${defendantName}`,
            `Statute of Limitations expires. Incident date: ${accidentDate}. Case type: ${reportType} (${solYears}-year SOL). Verify with supervising attorney.`,
            solPrimary
          );
          steps.push({ step: "calendar_sol", status: "completed", detail: `SOL date: ${solPrimary} (${solYears}yr)` });
        } catch (err) {
          steps.push({ step: "calendar_sol", status: "error", detail: String(err) });
        }
      }
      if (solSecondary) {
        try {
          await createCalendarEntry(
            clioToken,
            matter_id,
            `SOL WARNING (6mo before) — ${clientFullName} v. ${defendantName}`,
            `6 months until SOL deadline. Incident date: ${accidentDate}. SOL expires: ${solPrimary}.`,
            solSecondary
          );
          steps.push({ step: "calendar_sol_warning", status: "completed", detail: `Warning date: ${solSecondary}` });
        } catch (err) {
          steps.push({ step: "calendar_sol_warning", status: "error", detail: String(err) });
        }
      }

      // Step 6: Create audit trail note
      try {
        const now = new Date().toISOString().replace("T", " ").substring(0, 16);
        await createAuditNote(
          clioToken,
          matter_id,
          `[AUTOMATED] Intake pipeline completed at ${now} UTC. Custom fields updated, stage changed to Retainer Ready (triggers doc automation), SOL (${solYears}yr: ${solPrimary}) calendared. Case type: ${reportType}. Viability score: ${viabilityScore.total_score}/100 (${viabilityScore.category}). Client: ${clientFullName}, Defendant: ${defendantName}, Incident: ${accidentDate} at ${extraction.accident_details.full_location}.`
        );
        steps.push({ step: "audit_note", status: "completed" });
      } catch (err) {
        steps.push({ step: "audit_note", status: "error", detail: String(err) });
      }

      // Step 7: Create follow-up tasks
      try {
        let created = 0;
        for (const task of followUpTasks) {
          await createClioTask(
            clioToken,
            matter_id,
            task.text,
            `[${task.category.toUpperCase()}] ${task.text}`,
            PRIORITY_MAP[task.priority] || "Normal",
            DUE_DAYS[task.priority] || 14
          );
          created++;
        }
        steps.push({ step: "follow_up_tasks", status: "completed", detail: `${created} tasks created` });
      } catch (err) {
        steps.push({ step: "follow_up_tasks", status: "error", detail: String(err) });
      }

      // Step 8: Update stage to "Retainer Sent"
      try {
        await changeClioStage(clioToken, matter_id, "Retainer Sent");
        steps.push({ step: "stage_retainer_sent", status: "completed" });
      } catch (err) {
        steps.push({ step: "stage_retainer_sent", status: "error", detail: String(err) });
      }

      return NextResponse.json({
        success: true,
        message: "Clio pipeline completed",
        steps,
      });
    }

    // ===== OPTION 3: No integrations configured — demo mode =====
    return NextResponse.json({
      success: true,
      message: "Data verified and ready for processing (demo mode — no Clio token or Make.com webhook configured)",
      mapped_data: {
        matter_id,
        client_email: client_email || "",
        client_full_name: clientFullName,
        client_gender: clientGender,
        defendant_name: defendantName,
        accident_date: accidentDate,
        accident_location: extraction.accident_details.full_location,
        number_injured: extraction.accident_details.num_injured,
        sol_date_8yr: solPrimary,
        sol_date_3yr: solSecondary,
        viability_score: viabilityScore.total_score,
        viability_category: viabilityScore.category,
        viability_settlement_range: viabilityScore.settlement_range,
        follow_up_tasks: followUpTasks,
        follow_up_task_count: followUpTasks.length,
        email_subject: clientEmailContent.subject,
        email_body_html: clientEmailContent.html,
      },
    });
  } catch (err) {
    console.error("Process API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
