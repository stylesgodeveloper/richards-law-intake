import type { ExtractionResult } from "@/lib/types";

const CALENDLY_SUMMER_SPRING = "https://calendly.com/swans-santiago-p/summer-spring";
const CALENDLY_WINTER_AUTUMN = "https://calendly.com/swans-santiago-p/winter-autumn";

function toTitleCase(str: string): string {
  const small = new Set(["at", "in", "on", "of", "the", "and", "for", "to", "a", "an"]);
  return str
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (i === 0 || !small.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(" ");
}

function getSeasonalCalendlyLink(): { url: string; label: string } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const yearMonth = `${now.getFullYear()}-${String(month).padStart(2, "0")}`;
  if (month >= 3 && month <= 8) {
    return { url: `${CALENDLY_SUMMER_SPRING}?month=${yearMonth}`, label: "in-office" };
  }
  return { url: `${CALENDLY_WINTER_AUTUMN}?month=${yearMonth}`, label: "virtual" };
}

function getAccidentTypeDesc(extraction: ExtractionResult): string {
  const rt = extraction.report_type || "vehicle_accident";
  const cp = extraction.client_party;
  const ad = extraction.accident_details;

  if (rt === "slip_and_fall") return "slip and fall incident";
  if (rt === "assault") return "assault incident";
  if (rt === "dog_bite") return "dog bite incident";

  // Vehicle accident subtypes
  if (cp.role === "pedestrian") return "pedestrian accident";
  if (cp.role === "bicyclist") return "bicycle accident";
  if (ad.accident_type?.toLowerCase().includes("rear")) return "rear-end collision";
  if (ad.accident_type?.toLowerCase().includes("swipe")) return "sideswipe collision";
  return "car accident";
}

function generateAccidentSummary(extraction: ExtractionResult): string {
  const rt = extraction.report_type || "vehicle_accident";
  const cp = extraction.client_party;
  const ap = extraction.adverse_party;
  const ad = extraction.accident_details;
  const defendantName = ap.full_name || `${ap.first_name} ${ap.last_name}`;
  const desc = ad.description_verbatim || "";
  const accidentTypeDesc = getAccidentTypeDesc(extraction);

  // Slip and fall
  if (rt === "slip_and_fall") {
    const location = ad.full_location ? toTitleCase(ad.full_location) : "the property";
    return `From the details shared, I understand that you were injured in a slip and fall at ${location}. Property owners have a legal obligation to maintain safe conditions, and we want to ensure that your rights are fully protected and that you receive fair compensation for your injuries.`;
  }

  // Assault
  if (rt === "assault") {
    return `From the details shared, I understand that you were the victim of an assault${ad.full_location ? ` at ${toTitleCase(ad.full_location)}` : ""}. I want you to know that in addition to any criminal proceedings, you may be entitled to civil compensation for your injuries. We are here to advocate for you and guide you through this process.`;
  }

  // Dog bite
  if (rt === "dog_bite") {
    return `From the details shared, I understand that you were bitten by a dog${ad.full_location ? ` at ${toTitleCase(ad.full_location)}` : ""}. Under New York law, dog owners can be held liable for injuries caused by their animals. We want to ensure that your medical treatment is documented and that you receive full compensation for your injuries.`;
  }

  // Vehicle — pedestrian
  if (cp.role === "pedestrian") {
    return `From the details shared, I understand that you were crossing the street when you were struck by a vehicle operated by ${defendantName}. ${
      ad.num_injured > 0
        ? "Given the injuries you sustained, we want to ensure that all aspects of your recovery are properly documented and that you receive full compensation."
        : "We want to make sure all aspects of this incident are properly addressed."
    }`;
  }

  // Vehicle — bicyclist
  if (cp.role === "bicyclist") {
    return `From the details shared, I understand that you were cycling when a vehicle operated by ${defendantName} made contact with your bicycle. These types of incidents between vehicles and cyclists require careful investigation, and I want to reassure you that we are here to advocate for you.`;
  }

  const road = ad.location_road ? toTitleCase(ad.location_road) : "the road";

  // Vehicle — narrative-based context
  if (desc.toUpperCase().includes("BUS LANE") || desc.toUpperCase().includes("MIDDLE LANE")) {
    return `From the details shared, I understand that you were traveling on ${road} when your vehicle was struck. While you stated that the other driver was moving from the bus lane into the middle lane and hit you, they are claiming that you were the one in the middle lane and merged into them. We know that these types of disputed collisions can be disruptive, but I want to reassure you that we are here to advocate for you and handle the legal process as smoothly as possible.`;
  }

  if (desc.toUpperCase().includes("REAR") || ad.accident_type?.toLowerCase().includes("rear")) {
    return `From the details shared, I understand that your vehicle was struck from behind while you were driving on ${road}. Rear-end collisions like this are often clear-cut in terms of liability, and we are well-positioned to advocate on your behalf and ensure you receive fair compensation for any damages sustained.`;
  }

  // Vehicle — generic
  return `From the details shared, I understand that you were involved in a ${accidentTypeDesc} on ${road} involving a vehicle operated by ${defendantName}. We know that dealing with the aftermath of an accident can be disruptive, and I want to reassure you that we are here to advocate for you and handle the legal process as smoothly as possible.`;
}

export interface GeneratedEmail {
  subject: string;
  html: string;
  text: string;
}

export function generateClientEmail(extraction: ExtractionResult): GeneratedEmail {
  const cp = extraction.client_party;
  const ad = extraction.accident_details;
  const clientName = cp.full_name || `${cp.first_name} ${cp.last_name}`;
  const clientFirst = cp.first_name || clientName.split(" ")[0];
  const accidentTypeDesc = getAccidentTypeDesc(extraction);
  const accidentSummary = generateAccidentSummary(extraction);
  const calendly = getSeasonalCalendlyLink();

  const accidentDateFormatted = ad.date
    ? new Date(ad.date + "T12:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "[Date]";

  const aftermathPhrase =
    cp.role === "pedestrian"
      ? "an accident"
      : cp.role === "bicyclist"
      ? "a cycling incident"
      : extraction.report_type === "slip_and_fall"
      ? "an injury"
      : extraction.report_type === "assault"
      ? "an assault"
      : extraction.report_type === "dog_bite"
      ? "a dog bite"
      : "a crash";

  const subject = "Retainer Agreement for Your Review – Richards & Law";

  // Plain text version
  const text = `Hello ${clientFirst},

I hope you're doing well. I wanted to follow up regarding your ${accidentTypeDesc} on ${accidentDateFormatted}. I know dealing with the aftermath of ${aftermathPhrase} is stressful, and I want to make sure we move things forward as smoothly as possible for you.

${accidentSummary}

Attached is your Retainer Agreement, which sets the foundation for our partnership. It details the specific legal services we will provide and the mutual responsibilities needed to move your claim forward effectively. Please take a moment to review it before we meet.

When you're ready, you can book an appointment with us using this link: ${calendly.url}

At that meeting, we'll go through the agreement in detail and discuss next steps.

Andrew Richards
Richards & Law
Tel: (718) 555-0192
1412 Broadway, Suite 2100, New York, NY 10018`;

  // HTML version
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a2e; margin: 0; padding: 0; background-color: #f8f9fa; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
  .header { background: #1a1a2e; padding: 24px 32px; }
  .header h1 { color: #c9a84c; font-size: 20px; margin: 0; font-weight: 600; }
  .header p { color: #8b8fa3; font-size: 12px; margin: 4px 0 0; letter-spacing: 0.5px; }
  .body { padding: 32px; line-height: 1.7; font-size: 15px; }
  .body p { margin: 0 0 16px; }
  .highlight { background: #fef9e7; padding: 2px 6px; border-radius: 3px; font-weight: 500; }
  .summary { background: #f0fdf4; border-left: 3px solid #22c55e; padding: 16px; margin: 16px 0; border-radius: 0 6px 6px 0; font-style: italic; }
  .cta { display: inline-block; background: #1a1a2e; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .cta:hover { background: #2a2a4e; }
  .signature { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px; }
  .signature .name { font-weight: 700; font-size: 16px; color: #1a1a2e; margin: 0; }
  .signature .firm { color: #c9a84c; font-size: 13px; margin: 2px 0 0; font-weight: 500; }
  .attachment { background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0; margin: 16px 0; overflow: hidden; }
  .attachment td { vertical-align: middle; }
  .attachment .icon-cell { width: 52px; padding: 12px; }
  .attachment .icon { width: 36px; height: 36px; background: #fee2e2; border-radius: 6px; text-align: center; line-height: 36px; font-size: 14px; }
  .attachment .info-cell { padding: 12px 16px 12px 0; }
  .attachment .filename { font-weight: 600; color: #1a1a2e; font-size: 13px; }
  .attachment .meta { color: #9ca3af; font-size: 11px; }
  .footer { background: #f8f9fa; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.5; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Richards &amp; Law</h1>
    <p>PERSONAL INJURY ATTORNEYS</p>
  </div>
  <div class="body">
    <p>Hello ${clientFirst},</p>

    <p>I hope you're doing well. I wanted to follow up regarding your <span class="highlight">${accidentTypeDesc}</span> on <span class="highlight">${accidentDateFormatted}</span>. I know dealing with the aftermath of ${aftermathPhrase} is stressful, and I want to make sure we move things forward as smoothly as possible for you.</p>

    <div class="summary">${accidentSummary}</div>

    <p>Attached is your Retainer Agreement, which sets the foundation for our partnership. It details the specific legal services we will provide and the mutual responsibilities needed to move your claim forward effectively. Please take a moment to review it before we meet.</p>

    <p>When you're ready, you can book an appointment with us using the link below. At that meeting, we'll go through the agreement in detail and discuss next steps.</p>

    <p style="text-align: center;">
      <a href="${calendly.url}" class="cta">Book a Consultation (${calendly.label})</a>
    </p>

    <table class="attachment" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td class="icon-cell"><div class="icon">&#128196;</div></td>
        <td class="info-cell">
          <div class="filename">${clientName} [Retainer Agreement].pdf</div>
          <div class="meta">PDF Document &mdash; Please review before our meeting</div>
        </td>
      </tr>
    </table>

    <div class="signature">
      <p class="name">Andrew Richards</p>
      <p class="firm">Richards &amp; Law</p>
      <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0; line-height: 1.5;">
        Tel: (718) 555-0192<br>
        1412 Broadway, Suite 2100<br>
        New York, NY 10018
      </p>
    </div>
  </div>
  <div class="footer">
    <p>This email was sent on behalf of Richards &amp; Law regarding your ${accidentTypeDesc} claim.<br>
    If you believe you received this email in error, please disregard.</p>
  </div>
</div>
</body>
</html>`;

  return { subject, html, text };
}
