import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const maxDuration = 30;

function pronoun(gender: string | null, type: "possessive" | "subject"): string {
  const isFemale = gender?.toUpperCase() === "F" || gender?.toLowerCase() === "female";
  if (type === "possessive") return isFemale ? "her" : "his";
  return isFemale ? "she" : "he";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extraction } = body;

    if (!extraction) {
      return NextResponse.json({ error: "Missing extraction data" }, { status: 400 });
    }

    const cp = extraction.client_party;
    const ap = extraction.adverse_party;
    const ad = extraction.accident_details;

    const clientName = cp.full_name || `${cp.first_name} ${cp.last_name}`;
    const defendantName = ap.full_name || `${ap.first_name} ${ap.last_name}`;
    const his = pronoun(cp.sex, "possessive");
    const he = pronoun(cp.sex, "subject");

    const accidentDate = ad.date
      ? new Date(ad.date + "T12:00:00").toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "[Date of Accident]";

    const solDate = extraction.statute_of_limitations_date_8yr
      ? new Date(extraction.statute_of_limitations_date_8yr + "T12:00:00").toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "[Statute of Limitations Date]";

    const location = ad.full_location || "[Accident Location]";
    const plateNumber =
      cp.role === "pedestrian" || cp.role === "bicyclist"
        ? `N/A (client was a ${cp.role})`
        : cp.plate_number || "[Registration Plate Number]";

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    const fontSize = 11;
    const titleSize = 16;
    const sectionSize = 12;
    const margin = 72; // 1 inch
    const pageWidth = 612; // Letter
    const pageHeight = 792;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = fontSize * 1.5;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const addPage = () => {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    };

    const checkSpace = (needed: number) => {
      if (y - needed < margin) {
        addPage();
      }
    };

    const drawCentered = (text: string, size: number, f = fontBold) => {
      checkSpace(size * 2);
      const w = f.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: (pageWidth - w) / 2,
        y,
        size,
        font: f,
        color: rgb(0.06, 0.16, 0.26),
      });
      y -= size * 2;
    };

    const drawCenteredUnderline = (text: string, size: number) => {
      checkSpace(size * 2.5);
      const w = fontBold.widthOfTextAtSize(text, size);
      const x = (pageWidth - w) / 2;
      page.drawText(text, {
        x,
        y,
        size,
        font: fontBold,
        color: rgb(0.06, 0.16, 0.26),
      });
      page.drawLine({
        start: { x, y: y - 2 },
        end: { x: x + w, y: y - 2 },
        thickness: 0.5,
        color: rgb(0.06, 0.16, 0.26),
      });
      y -= size * 2.5;
    };

    const wrapText = (text: string, f = font, maxWidth = contentWidth): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = f.widthOfTextAtSize(testLine, fontSize);
        if (width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    const drawParagraph = (text: string, f = font) => {
      const lines = wrapText(text, f);
      checkSpace(lines.length * lineHeight + 8);
      for (const line of lines) {
        if (y < margin) addPage();
        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font: f,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
      }
      y -= 8;
    };

    // ===== DOCUMENT CONTENT =====

    // Title
    drawCentered("RICHARDS & LAW", titleSize + 4);
    y -= 4;
    drawCenteredUnderline("CONTRACT FOR EMPLOYMENT OF ATTORNEYS", sectionSize);
    y -= 12;

    // Opening paragraph
    drawParagraph(
      `This Retainer Agreement ("Agreement") is entered into between ${clientName} ("Client") and Richards & Law ("Attorney"), for the purpose of providing legal representation related to the damages sustained in an incident that occurred on ${accidentDate}. By executing this Agreement, Client employs Attorney to investigate, pursue, negotiate, and, if necessary, litigate claims for damages against ${defendantName} who may be responsible for such damages suffered by Client as a result of ${his} accident.`
    );

    drawParagraph(
      `Representation under this Agreement is expressly limited to the matter described herein ("the Claim") and does not extend to any other legal issues unless separately agreed to in writing by both Client and Attorney. Attorney does not provide tax, accounting, or financial advisory services, and any such issues are outside the scope of this representation. Client is encouraged to consult separate professionals for such matters, as those responsibilities remain ${his} own.`
    );

    // Scope of Representation
    y -= 8;
    drawCenteredUnderline("Scope of Representation", sectionSize);

    drawParagraph(
      `Attorney shall undertake all reasonable and necessary legal efforts to diligently protect and advance Client's interests in the Claim, extending to both settlement negotiations and litigation proceedings where appropriate. Client agrees to cooperate fully by providing truthful information, timely responses, and all relevant documents or records as requested. Client acknowledges that ${his} cooperation is essential to the effective handling of the Claim.`
    );

    // Accident Details & Insurance
    y -= 8;
    drawCenteredUnderline("Accident Details & Insurance", sectionSize);

    drawParagraph(
      `The incident giving rise to this Claim occurred at ${location}. At the time of the accident, Client was operating or occupying a vehicle bearing registration plate number ${plateNumber}. The circumstances surrounding the incident, including the actions of the involved parties and any contributing factors, will be further investigated by Attorney as part of the representation under this Agreement.`
    );

    drawParagraph(
      "Attorney is authorized to investigate the liability aspects of the incident, including the collection of police reports, witness statements, and property damage appraisals to determine the full extent of recoverable damages. Client understands that preserving evidence and providing truthful disclosures regarding the events leading to the loss are material obligations under this Agreement. This investigation will serve as the basis for identifying all applicable insurance coverage and responsible parties."
    );

    // Conditional paragraph based on injuries
    if (ad.num_injured > 0) {
      drawParagraph(
        "Additionally, since the motor vehicle accident involved an injured person, Attorney will also investigate potential bodily injury claims and review relevant medical records to substantiate non-economic damages.",
        fontItalic
      );
    } else {
      drawParagraph(
        "However, since the motor vehicle accident involved no reported injured people, the scope of this engagement is strictly limited to the recovery of property damage and loss of use.",
        fontItalic
      );
    }

    // Litigation Expenses
    y -= 8;
    drawCenteredUnderline("Litigation Expenses", sectionSize);

    drawParagraph(
      'Attorney will advance all reasonable costs and expenses necessary for the proper handling of the Claim ("Litigation Expenses"). Such expenses may include, but are not limited to, court filing fees, deposition costs, expert witness fees, medical record retrieval, travel expenses, investigative services, and administrative charges associated with case management.'
    );

    drawParagraph(
      `These Litigation Expenses will be reimbursed to Attorney from Client's share of the recovery in addition to the contingency fee. Client understands that these expenses are separate from medical bills, liens, or other financial obligations for which ${he} may remain personally responsible.`
    );

    // Liens
    y -= 8;
    drawCenteredUnderline("Liens, Subrogation, and Other Obligations", sectionSize);

    drawParagraph(
      `Client understands that certain parties, such as healthcare providers, insurers, or government agencies (including Medicare or Medicaid), may have a legal right to reimbursement for payments made on Client's behalf. These are commonly referred to as liens or subrogation claims, and may affect the final amount received by Client from ${his} settlement or judgment.`
    );

    drawParagraph(
      "Client hereby authorizes Attorney to negotiate, settle, and satisfy such claims from the proceeds of any recovery. Attorney may engage specialized lien resolution services or other professionals to assist in this process, and the cost of such services shall be treated as a Litigation Expense."
    );

    // Statute of Limitations
    y -= 8;
    drawCenteredUnderline("Statute of Limitations", sectionSize);

    drawParagraph(
      `Attorney will monitor and calculate the deadline for filing the Claim in accordance with applicable law. Based on current information, the statute of limitations for this matter is ${solDate}. Client acknowledges the importance of timely cooperation in providing documents, records, and information necessary for Attorney to meet all legal deadlines.`
    );

    // Termination
    y -= 8;
    drawCenteredUnderline("Termination of Representation", sectionSize);

    drawParagraph(
      `Either party may terminate this Agreement upon reasonable written notice. If Client terminates this Agreement after substantial work has been performed, Attorney may assert a claim for attorney's fees based on the reasonable value of services rendered, payable from any eventual recovery. Client agrees that ${his} obligation to compensate Attorney in such cases shall be limited to the reasonable value of the services rendered up to the point of termination.`
    );

    // Signature block
    y -= 20;
    checkSpace(120);
    page.drawText("ACCEPTED BY:", {
      x: margin,
      y,
      size: fontSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    page.drawText("CLIENT ___________________________", {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    page.drawText("Date: _______________", {
      x: pageWidth - margin - 150,
      y,
      size: fontSize,
      font,
    });
    y -= 18;
    page.drawText(clientName, {
      x: margin,
      y,
      size: fontSize,
      font: fontBold,
    });
    y -= 30;

    page.drawText("Richards & Law Attorney ___________________________", {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    page.drawText("Date: _______________", {
      x: pageWidth - margin - 150,
      y,
      size: fontSize,
      font,
    });
    y -= 18;
    page.drawText("Andrew Richards", {
      x: margin,
      y,
      size: fontSize,
      font: fontBold,
    });

    // Serialize
    const pdfBytes = await pdfDoc.save();
    const base64 = Buffer.from(pdfBytes).toString("base64");

    return NextResponse.json({
      success: true,
      pdf_base64: base64,
      filename: `${clientName} [Retainer Agreement].pdf`,
      size_bytes: pdfBytes.length,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
