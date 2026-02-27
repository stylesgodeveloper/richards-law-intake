export interface ReportMetadata {
  accident_number: string | null;
  report_number: string | null;
  precinct: string | null;
  officer_name: string | null;
  officer_badge_tax_id: string | null;
  reviewing_officer: string | null;
  date_filed: string | null;
}

export interface AccidentDetails {
  date: string | null;
  day_of_week: string | null;
  time: string | null;
  location_road: string | null;
  location_cross_street: string | null;
  location_borough: string | null;
  full_location: string | null;
  num_vehicles: number;
  num_injured: number;
  num_killed: number;
  description_verbatim: string | null;
  accident_type: string | null;
}

export interface PartyInfo {
  role: "vehicle_1_driver" | "vehicle_2_driver" | "pedestrian" | "bicyclist";
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  sex: "M" | "F" | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  drivers_license: string | null;
  plate_number: string | null;
  vehicle_year_make_model: string | null;
  vehicle_type: string | null;
  registration_name: string | null;
  insurance_code: string | null;
  injuries?: string | null;
}

export interface UncertainField {
  field: string;
  reason: string;
}

export interface ExtractionResult {
  extraction_confidence: "high" | "medium" | "low";
  report_metadata: ReportMetadata;
  accident_details: AccidentDetails;
  client_party: PartyInfo;
  adverse_party: PartyInfo;
  other_involved_persons: Array<{
    name: string;
    age: number;
    sex: string;
    role: string;
  }>;
  uncertain_fields: UncertainField[];
  statute_of_limitations_date_8yr: string | null;
}

export interface ProcessingStatus {
  step: string;
  status: "pending" | "in_progress" | "completed" | "error";
  message?: string;
  timestamp?: string;
}

export interface MatterData {
  matter_id: string;
  extraction: ExtractionResult;
  pdf_url?: string;
  status: ProcessingStatus[];
}
