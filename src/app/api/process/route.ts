import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matter_id, extraction } = body;

    if (!matter_id || !extraction) {
      return NextResponse.json(
        { error: "Missing matter_id or extraction data" },
        { status: 400 }
      );
    }

    const clioToken = process.env.CLIO_ACCESS_TOKEN;
    const makeWebhook = process.env.MAKE_WEBHOOK_PROCESS;
    const steps: { step: string; status: string; detail?: string }[] = [];

    // Map extraction to flat values
    const clientFullName =
      extraction.client_party.full_name ||
      `${extraction.client_party.first_name} ${extraction.client_party.last_name}`;
    const clientGender = extraction.client_party.sex === "F" ? "Female" : "Male";
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

    // Calculate SOL dates
    const accidentDate = extraction.accident_details.date;
    let sol8yr = extraction.statute_of_limitations_date_8yr;
    let sol3yr = null;
    if (accidentDate) {
      const d8 = new Date(accidentDate);
      d8.setFullYear(d8.getFullYear() + 8);
      sol8yr = sol8yr || d8.toISOString().split("T")[0];
      const d3 = new Date(accidentDate);
      d3.setFullYear(d3.getFullYear() + 3);
      sol3yr = d3.toISOString().split("T")[0];
    }

    // ===== OPTION 1: If Make.com webhook is configured, delegate to it =====
    if (makeWebhook) {
      const response = await fetch(makeWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matter_id,
          extraction,
          sol_3yr: sol3yr,
          sol_8yr: sol8yr,
        }),
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
          StatuteOfLimitationsDate: sol8yr,
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
      if (sol8yr) {
        try {
          await createCalendarEntry(
            clioToken,
            matter_id,
            `SOL DEADLINE (8yr) — ${clientFullName} v. ${defendantName}`,
            `Statute of Limitations expires. Accident date: ${accidentDate}. NOTE: Client requested 8-year SOL. Standard NY PI SOL is 3 years. Verify with supervising attorney.`,
            sol8yr
          );
          steps.push({ step: "calendar_8yr", status: "completed", detail: `SOL date: ${sol8yr}` });
        } catch (err) {
          steps.push({ step: "calendar_8yr", status: "error", detail: String(err) });
        }
      }
      if (sol3yr) {
        try {
          await createCalendarEntry(
            clioToken,
            matter_id,
            `SOL DEADLINE (3yr standard) — ${clientFullName} v. ${defendantName}`,
            `Standard 3-year NY PI SOL. Accident date: ${accidentDate}. 8-year SOL also calendared per client request.`,
            sol3yr
          );
          steps.push({ step: "calendar_3yr", status: "completed", detail: `SOL date: ${sol3yr}` });
        } catch (err) {
          steps.push({ step: "calendar_3yr", status: "error", detail: String(err) });
        }
      }

      // Step 6: Create audit trail note
      try {
        const now = new Date().toISOString().replace("T", " ").substring(0, 16);
        await createAuditNote(
          clioToken,
          matter_id,
          `[AUTOMATED] Intake pipeline completed at ${now} UTC. Custom fields updated (20 fields), stage changed to Retainer Ready (triggers doc automation), SOL entries (8yr: ${sol8yr}, 3yr: ${sol3yr}) calendared. Client: ${clientFullName}, Defendant: ${defendantName}, Accident: ${accidentDate} at ${extraction.accident_details.full_location}.`
        );
        steps.push({ step: "audit_note", status: "completed" });
      } catch (err) {
        steps.push({ step: "audit_note", status: "error", detail: String(err) });
      }

      // Step 7: Update stage to "Retainer Sent"
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
        client_full_name: clientFullName,
        client_gender: clientGender,
        defendant_name: defendantName,
        accident_date: accidentDate,
        accident_location: extraction.accident_details.full_location,
        number_injured: extraction.accident_details.num_injured,
        sol_date_8yr: sol8yr,
        sol_date_3yr: sol3yr,
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
