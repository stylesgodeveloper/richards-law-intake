/**
 * Generate the Richards & Law Retainer Agreement .docx template
 * with Clio Manage merge fields and conditional logic.
 *
 * Usage: node scripts/generate-retainer-template.js
 * Output: retainer-template.docx (upload this to Clio)
 *
 * Clio merge field syntax (from Settings > Documents > Merge Fields):
 *   << Matter.CustomField.Fieldname >>  for custom fields
 *   << Matter.ResponsibleAttorney.Name >>  for built-in fields
 *   << Matter.Client.Name >>  for client info
 */

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
} = require("docx");
const fs = require("fs");
const path = require("path");

async function generate() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          // Header - Firm Name
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "RICHARDS & LAW",
                bold: true,
                size: 36,
                font: "Georgia",
              }),
            ],
          }),

          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "CONTRACT FOR EMPLOYMENT OF ATTORNEYS",
                bold: true,
                size: 24,
                underline: { type: UnderlineType.SINGLE },
              }),
            ],
          }),

          // Opening paragraph
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'This Retainer Agreement ("Agreement") is entered into between ',
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Clientfullname >>",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ' ("Client") and Richards & Law ("Attorney"), for the purpose of providing legal representation related to the damages sustained in an incident that occurred on ',
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Accidentdate >>",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ". By executing this Agreement, Client employs Attorney to investigate, pursue, negotiate, and, if necessary, litigate claims for damages against ",
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Defendantname >>",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: " who may be responsible for such damages suffered by Client as a result of ",
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Clientgender >>",
                bold: true,
                size: 22,
              }),
              new TextRun({ text: " accident.", size: 22 }),
            ],
          }),

          // Limitation paragraph
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Representation under this Agreement is expressly limited to the matter described herein ("the Claim") and does not extend to any other legal issues unless separately agreed to in writing by both Client and Attorney. Attorney does not provide tax, accounting, or financial advisory services, and any such issues are outside the scope of this representation. Client is encouraged to consult separate professionals for such matters, as those responsibilities remain ',
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Clientgender >>",
                bold: true,
                size: 22,
              }),
              new TextRun({ text: " own.", size: 22 }),
            ],
          }),

          // Scope of Representation
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 200 },
            children: [
              new TextRun({
                text: "Scope of Representation",
                bold: true,
                underline: { type: UnderlineType.SINGLE },
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Attorney shall undertake all reasonable and necessary legal efforts to diligently protect and advance Client's interests in the Claim, extending to both settlement negotiations and litigation proceedings where appropriate. Client agrees to cooperate fully by providing truthful information, timely responses, and all relevant documents or records as requested. Client acknowledges that ",
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Clientgender >>",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: " cooperation is essential to the effective handling of the Claim.",
                size: 22,
              }),
            ],
          }),

          // Accident Details & Insurance
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 200 },
            children: [
              new TextRun({
                text: "Accident Details & Insurance",
                bold: true,
                underline: { type: UnderlineType.SINGLE },
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "The incident giving rise to this Claim occurred at ",
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Accidentlocation >>",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ". At the time of the accident, Client was operating or occupying a vehicle bearing registration plate number ",
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Clientplatenumber >>",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ". The circumstances surrounding the incident, including the actions of the involved parties and any contributing factors, will be further investigated by Attorney as part of the representation under this Agreement.",
                size: 22,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Attorney is authorized to investigate the liability aspects of the incident, including the collection of police reports, witness statements, and property damage appraisals to determine the full extent of recoverable damages. Client understands that preserving evidence and providing truthful disclosures regarding the events leading to the loss are material obligations under this Agreement. This investigation will serve as the basis for identifying all applicable insurance coverage and responsible parties.",
                size: 22,
              }),
            ],
          }),

          // NOTE: Clio's document automation may not support inline conditionals.
          // If conditionals don't work, the Make.com pipeline will handle this
          // by choosing which paragraph to include based on NumberInjured value.

          // Conditional: Injured > 0
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Additionally, since the motor vehicle accident involved an injured person, Attorney will also investigate potential bodily injury claims and review relevant medical records to substantiate non-economic damages.",
                size: 22,
              }),
            ],
          }),

          // Note about conditional logic
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "[NOTE: The above paragraph is included when << Matter.CustomField.Numberinjured >> > 0. When no injuries are reported, replace with: \"However, since the motor vehicle accident involved no reported injured people, the scope of this engagement is strictly limited to the recovery of property damage and loss of use.\"]",
                size: 18,
                color: "999999",
                italics: true,
              }),
            ],
          }),

          // Litigation Expenses
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 200 },
            children: [
              new TextRun({
                text: "Litigation Expenses",
                bold: true,
                underline: { type: UnderlineType.SINGLE },
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Attorney will advance all reasonable costs and expenses necessary for the proper handling of the Claim ("Litigation Expenses"). Such expenses may include, but are not limited to, court filing fees, deposition costs, expert witness fees, medical record retrieval, travel expenses, investigative services, and administrative charges associated with case management.',
                size: 22,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "These Litigation Expenses will be reimbursed to Attorney from Client's share of the recovery in addition to the contingency fee. Client understands that these expenses are separate from medical bills, liens, or other financial obligations for which ",
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Clientgender >>",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: " may remain personally responsible.",
                size: 22,
              }),
            ],
          }),

          // Liens
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 200 },
            children: [
              new TextRun({
                text: "Liens, Subrogation, and Other Obligations",
                bold: true,
                underline: { type: UnderlineType.SINGLE },
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Client understands that certain parties, such as healthcare providers, insurers, or government agencies (including Medicare or Medicaid), may have a legal right to reimbursement for payments made on Client's behalf. These are commonly referred to as liens or subrogation claims, and may affect the final amount received by Client from ",
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Clientgender >>",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: " settlement or judgment.",
                size: 22,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Client hereby authorizes Attorney to negotiate, settle, and satisfy such claims from the proceeds of any recovery. Attorney may engage specialized lien resolution services or other professionals to assist in this process, and the cost of such services shall be treated as a Litigation Expense.",
                size: 22,
              }),
            ],
          }),

          // Statute of Limitations
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 200 },
            children: [
              new TextRun({
                text: "Statute of Limitations",
                bold: true,
                underline: { type: UnderlineType.SINGLE },
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Attorney will monitor and calculate the deadline for filing the Claim in accordance with applicable law. Based on current information, the statute of limitations for this matter is ",
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Statuteoflimitationsdate >>",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ". Client acknowledges the importance of timely cooperation in providing documents, records, and information necessary for Attorney to meet all legal deadlines.",
                size: 22,
              }),
            ],
          }),

          // Termination
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 200 },
            children: [
              new TextRun({
                text: "Termination of Representation",
                bold: true,
                underline: { type: UnderlineType.SINGLE },
                size: 24,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Either party may terminate this Agreement upon reasonable written notice. If Client terminates this Agreement after substantial work has been performed, Attorney may assert a claim for attorney's fees based on the reasonable value of services rendered, payable from any eventual recovery. Client agrees that ",
                size: 22,
              }),
              new TextRun({
                text: "<< Matter.CustomField.Clientgender >>",
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: " obligation to compensate Attorney in such cases shall be limited to the reasonable value of the services rendered up to the point of termination.",
                size: 22,
              }),
            ],
          }),

          // Signature block
          new Paragraph({
            spacing: { before: 400, after: 100 },
            children: [
              new TextRun({
                text: "ACCEPTED BY:",
                bold: true,
                size: 22,
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 300, after: 50 },
            children: [
              new TextRun({
                text: "CLIENT ___________________________ Date: _____________________",
                size: 22,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "<< Matter.CustomField.Clientfullname >>",
                bold: true,
                size: 22,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: "Richards & Law Attorney _________________________ Date: _____________________",
                size: 22,
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "<< Matter.ResponsibleAttorney.Name >>",
                bold: true,
                size: 22,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, "..", "retainer-template.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Retainer template generated: ${outputPath}`);
  console.log("\nMerge fields used (matching Clio's exact syntax):");
  console.log("  - << Matter.CustomField.Clientfullname >>");
  console.log("  - << Matter.CustomField.Clientgender >> (his/her values)");
  console.log("  - << Matter.CustomField.Accidentdate >>");
  console.log("  - << Matter.CustomField.Defendantname >>");
  console.log("  - << Matter.CustomField.Accidentlocation >>");
  console.log("  - << Matter.CustomField.Clientplatenumber >>");
  console.log("  - << Matter.CustomField.Numberinjured >> (for conditional logic)");
  console.log("  - << Matter.CustomField.Statuteoflimitationsdate >>");
  console.log("  - << Matter.ResponsibleAttorney.Name >>");
}

generate().catch(console.error);
