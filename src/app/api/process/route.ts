import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

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

    const makeWebhook = process.env.MAKE_WEBHOOK_PROCESS;

    if (makeWebhook) {
      // Send verified data to Make.com Scenario 2 for Clio processing
      const response = await fetch(makeWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matter_id,
          // Map extraction to Clio custom field format
          client_full_name:
            extraction.client_party.full_name ||
            `${extraction.client_party.first_name} ${extraction.client_party.last_name}`,
          client_first_name: extraction.client_party.first_name,
          client_last_name: extraction.client_party.last_name,
          client_gender: extraction.client_party.sex === "F" ? "Female" : "Male",
          client_address: [
            extraction.client_party.address,
            extraction.client_party.city,
            extraction.client_party.state,
            extraction.client_party.zip,
          ]
            .filter(Boolean)
            .join(", "),
          client_dob: extraction.client_party.date_of_birth,
          client_drivers_license: extraction.client_party.drivers_license,
          client_plate_number: extraction.client_party.plate_number || "N/A",
          client_vehicle: extraction.client_party.vehicle_year_make_model,
          defendant_name:
            extraction.adverse_party.full_name ||
            `${extraction.adverse_party.first_name} ${extraction.adverse_party.last_name}`,
          defendant_address: [
            extraction.adverse_party.address,
            extraction.adverse_party.city,
            extraction.adverse_party.state,
            extraction.adverse_party.zip,
          ]
            .filter(Boolean)
            .join(", "),
          defendant_vehicle: extraction.adverse_party.vehicle_year_make_model,
          accident_date: extraction.accident_details.date,
          accident_location: extraction.accident_details.full_location,
          accident_description:
            extraction.accident_details.description_verbatim,
          accident_type: extraction.accident_details.accident_type,
          number_injured: String(extraction.accident_details.num_injured),
          injuries_description: extraction.client_party.injuries || "",
          police_report_number: extraction.report_metadata.report_number,
          officer_name: extraction.report_metadata.officer_name,
          precinct: extraction.report_metadata.precinct,
          statute_of_limitations_date:
            extraction.statute_of_limitations_date_8yr,
          // Additional computed fields
          has_injuries: extraction.accident_details.num_injured > 0,
          client_role: extraction.client_party.role,
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
        message: "Data sent to processing pipeline",
      });
    }

    // If no Make.com webhook, return success with the mapped data
    // (useful for testing/demo without Make.com connection)
    return NextResponse.json({
      success: true,
      message: "Data verified and ready for Clio processing",
      mapped_data: {
        matter_id,
        client_full_name:
          extraction.client_party.full_name ||
          `${extraction.client_party.first_name} ${extraction.client_party.last_name}`,
        client_gender: extraction.client_party.sex === "F" ? "Female" : "Male",
        defendant_name:
          extraction.adverse_party.full_name ||
          `${extraction.adverse_party.first_name} ${extraction.adverse_party.last_name}`,
        accident_date: extraction.accident_details.date,
        accident_location: extraction.accident_details.full_location,
        number_injured: extraction.accident_details.num_injured,
        sol_date: extraction.statute_of_limitations_date_8yr,
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
