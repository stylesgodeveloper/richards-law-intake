import type { ExtractionResult } from "@/lib/types";

export interface FollowUpItem {
  id: string;
  text: string;
  category: "medical" | "evidence" | "legal" | "contact";
  priority: "high" | "medium" | "low";
}

export function generateFollowUpChecklist(extraction: ExtractionResult): FollowUpItem[] {
  const items: FollowUpItem[] = [];
  const rt = extraction.report_type || "vehicle_accident";

  if (extraction.client_party.injuries) {
    items.push({
      id: "med-records",
      text: `Obtain medical records for: ${extraction.client_party.injuries.substring(0, 80)}`,
      category: "medical",
      priority: "high",
    });
    items.push({
      id: "med-bills",
      text: `Request medical bills and treatment documentation`,
      category: "medical",
      priority: "high",
    });
  }

  if (extraction.accident_details.num_injured > 0) {
    items.push({
      id: "med-provider",
      text: `Confirm treating hospital/provider and get authorization signed`,
      category: "medical",
      priority: "high",
    });
  }

  if (extraction.other_involved_persons.length > 0) {
    extraction.other_involved_persons.forEach((p, i) => {
      items.push({
        id: `witness-${i}`,
        text: `Contact witness: ${p.name}${p.role ? ` (${p.role})` : ""}`,
        category: "contact",
        priority: "medium",
      });
    });
  }

  if (!extraction.accident_details.description_verbatim) {
    items.push({
      id: "get-report",
      text: "Obtain full police report — officer narrative is missing",
      category: "evidence",
      priority: "high",
    });
  }

  if (rt === "vehicle_accident") {
    if (!extraction.adverse_party.insurance_code) {
      items.push({
        id: "def-insurance",
        text: `Obtain defendant insurance information for ${extraction.adverse_party.full_name || "adverse party"}`,
        category: "legal",
        priority: "high",
      });
    }
    items.push({
      id: "photos",
      text: "Request accident scene and vehicle damage photos from client",
      category: "evidence",
      priority: "medium",
    });
    items.push({
      id: "no-fault",
      text: "File No-Fault application (NF-2) within 30 days",
      category: "legal",
      priority: "high",
    });
  }

  if (rt === "slip_and_fall") {
    items.push({
      id: "preserve-notice",
      text: "Send preservation of evidence notice to property owner/manager",
      category: "legal",
      priority: "high",
    });
    if (extraction.slip_and_fall_details?.surveillance_cameras_present) {
      items.push({
        id: "footage",
        text: "Request surveillance footage before overwrite (typically 30-90 days)",
        category: "evidence",
        priority: "high",
      });
    }
    items.push({
      id: "incident-report",
      text: "Obtain store/property incident report",
      category: "evidence",
      priority: "medium",
    });
    items.push({
      id: "prior-complaints",
      text: "Research prior complaints/violations at this property",
      category: "evidence",
      priority: "medium",
    });
  }

  if (rt === "assault") {
    if (extraction.assault_details?.arrest_made) {
      items.push({
        id: "criminal-case",
        text: "Monitor criminal case proceedings for civil claim leverage",
        category: "legal",
        priority: "medium",
      });
    }
    items.push({
      id: "order-protection",
      text: "Assess need for order of protection",
      category: "legal",
      priority: "high",
    });
    items.push({
      id: "da-office",
      text: "Contact DA's office for case updates and evidence access",
      category: "legal",
      priority: "medium",
    });
  }

  if (rt === "dog_bite") {
    items.push({
      id: "animal-control",
      text: "Contact animal control for incident report and quarantine status",
      category: "evidence",
      priority: "high",
    });
    items.push({
      id: "prior-bites",
      text: "Research prior bite complaints against this animal/owner",
      category: "evidence",
      priority: "high",
    });
    items.push({
      id: "homeowner-ins",
      text: "Identify animal owner's homeowner/renter's insurance",
      category: "legal",
      priority: "high",
    });
  }

  items.push({
    id: "retainer-signed",
    text: "Confirm signed retainer agreement received from client",
    category: "legal",
    priority: "high",
  });

  items.push({
    id: "client-contact",
    text: `Schedule initial client call with ${extraction.client_party.full_name || "client"}`,
    category: "contact",
    priority: "medium",
  });

  return items;
}

export const CATEGORY_CONFIG = {
  medical: { label: "Medical", color: "text-red-600 bg-red-50" },
  evidence: { label: "Evidence", color: "text-blue-600 bg-blue-50" },
  legal: { label: "Legal", color: "text-purple-600 bg-purple-50" },
  contact: { label: "Contact", color: "text-teal-600 bg-teal-50" },
};

export const PRIORITY_DOTS = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-gray-300",
};
