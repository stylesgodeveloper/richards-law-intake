export const MAKE_WEBHOOK_EXTRACT =
  process.env.NEXT_PUBLIC_MAKE_WEBHOOK_EXTRACT || "";

export const MAKE_WEBHOOK_PROCESS =
  process.env.NEXT_PUBLIC_MAKE_WEBHOOK_PROCESS || "";

export const CALENDLY_SUMMER_SPRING =
  "https://calendly.com/swans-santiago-p/summer-spring?month=2026-03";

export const CALENDLY_WINTER_AUTUMN =
  "https://calendly.com/swans-santiago-p/winter-autumn?month=2026-02";

export function getSeasonalCalendlyLink(): string {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 8) {
    return CALENDLY_SUMMER_SPRING;
  }
  return CALENDLY_WINTER_AUTUMN;
}

export function calculateSOLDate(accidentDate: string): string {
  const date = new Date(accidentDate);
  date.setFullYear(date.getFullYear() + 8);
  return date.toISOString().split("T")[0];
}

export function getGenderPronoun(
  sex: "M" | "F" | null,
  type: "possessive" | "subject"
): string {
  if (type === "possessive") {
    return sex === "F" ? "her" : "his";
  }
  return sex === "F" ? "she" : "he";
}

export const PROCESSING_STEPS = [
  { id: "extract", label: "AI Extraction", icon: "brain" },
  { id: "verify", label: "Data Verified", icon: "check-circle" },
  { id: "clio_update", label: "Clio Updated", icon: "database" },
  { id: "retainer", label: "Retainer Generated", icon: "file-text" },
  { id: "calendar", label: "SOL Calendared", icon: "calendar" },
  { id: "email", label: "Email Sent", icon: "mail" },
] as const;

export const ROLE_LABELS: Record<string, string> = {
  vehicle_1_driver: "Vehicle 1 Driver",
  vehicle_2_driver: "Vehicle 2 Driver",
  pedestrian: "Pedestrian",
  bicyclist: "Bicyclist",
};
