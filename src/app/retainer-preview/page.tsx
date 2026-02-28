"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Download,
} from "lucide-react";
import type { ExtractionResult } from "@/lib/types";
import { calculateSOLDate } from "@/lib/constants";

function pronoun(sex: string | null, type: "possessive" | "subject") {
  if (type === "possessive") return sex === "F" ? "her" : "his";
  return sex === "F" ? "she" : "he";
}

export default function RetainerPreviewPage() {
  const router = useRouter();
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [matterId, setMatterId] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("extractionResult");
    const storedMatter = sessionStorage.getItem("matterId");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setExtraction(parsed.extraction || parsed);
      setMatterId(storedMatter || "");
    } catch {
      router.push("/");
    }
  }, [router]);

  const handleDownloadPdf = async () => {
    if (!extraction) return;
    setDownloading(true);
    try {
      const solDate = extraction.statute_of_limitations_date_8yr ||
        (extraction.accident_details.date ? calculateSOLDate(extraction.accident_details.date) : null);
      const res = await fetch("/api/generate-retainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraction: { ...extraction, statute_of_limitations_date_8yr: solDate },
        }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const data = await res.json();
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${data.pdf_base64}`;
      link.download = data.filename;
      link.click();
    } catch (err) {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (!extraction) return null;

  const cp = extraction.client_party;
  const ap = extraction.adverse_party;
  const ad = extraction.accident_details;
  const clientName = cp.full_name || `${cp.first_name} ${cp.last_name}`;
  const defendantName = ap.full_name || `${ap.first_name} ${ap.last_name}`;
  const accidentDate = ad.date
    ? new Date(ad.date + "T12:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "[Date of Accident]";
  const solDate = ad.date
    ? new Date(calculateSOLDate(ad.date) + "T12:00:00").toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      )
    : "[Statute of Limitations Date]";
  const his = pronoun(cp.sex, "possessive");
  const he = pronoun(cp.sex, "subject");
  const plateText =
    cp.role === "pedestrian" || cp.role === "bicyclist"
      ? "N/A (client was a " + cp.role + ")"
      : cp.plate_number || "[Registration Plate Number]";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy-900">
              Retainer Agreement Preview
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Merge fields filled from extraction &middot; Matter: {matterId}
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-12 sm:ml-0">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${downloading ? "animate-pulse" : ""}`} aria-hidden="true" />
            <span className="hidden sm:inline">{downloading ? "Generating..." : "Download PDF"}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={() => router.push("/email-preview")}
            className="px-3 sm:px-4 py-2 text-sm font-medium bg-navy-900 text-white rounded-lg hover:bg-navy-800 flex items-center gap-2"
          >
            Email Preview
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Conditional Logic Indicator */}
      <div
        className={`rounded-xl p-4 border ${
          ad.num_injured > 0
            ? "bg-red-50 border-red-200"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <div className="flex items-center gap-2">
          {ad.num_injured > 0 ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          )}
          <span
            className={`text-sm font-medium ${
              ad.num_injured > 0 ? "text-red-700" : "text-blue-700"
            }`}
          >
            {ad.num_injured > 0
              ? `${ad.num_injured} person(s) injured — Bodily injury paragraph INCLUDED`
              : "No injuries reported — Property damage only paragraph INCLUDED"}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Gender pronouns: using &quot;{his}/{he}&quot; based on client sex ({cp.sex})
        </p>
      </div>

      {/* Retainer Document */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-navy-800 text-white px-6 py-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">
            Generated Retainer Agreement — {clientName}
          </span>
        </div>

        <div className="px-5 sm:px-10 py-6 sm:py-8 space-y-5 sm:space-y-6 text-sm sm:text-[15px] leading-relaxed text-gray-800 font-serif">
          {/* Firm Header */}
          <div className="text-center space-y-1 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold tracking-wider text-navy-900" style={{ fontFamily: "Georgia, serif" }}>
              RICHARDS & LAW
            </h2>
            <p className="text-sm font-bold underline text-gray-700">
              CONTRACT FOR EMPLOYMENT OF ATTORNEYS
            </p>
          </div>

          {/* Opening */}
          <p>
            This Retainer Agreement (&quot;Agreement&quot;) is entered into between{" "}
            <span className="bg-gold-100 px-1 rounded font-semibold">
              {clientName}
            </span>{" "}
            (&quot;Client&quot;) and Richards &amp; Law (&quot;Attorney&quot;), for the purpose of
            providing legal representation related to the damages sustained in
            an incident that occurred on{" "}
            <span className="bg-gold-100 px-1 rounded font-semibold">
              {accidentDate}
            </span>
            . By executing this Agreement, Client employs Attorney to
            investigate, pursue, negotiate, and, if necessary, litigate claims
            for damages against{" "}
            <span className="bg-gold-100 px-1 rounded font-semibold">
              {defendantName}
            </span>{" "}
            who may be responsible for such damages suffered by Client as a
            result of{" "}
            <span className="bg-purple-100 px-1 rounded font-semibold">
              {his}
            </span>{" "}
            accident.
          </p>

          <p>
            Representation under this Agreement is expressly limited to the
            matter described herein (&quot;the Claim&quot;) and does not extend to any
            other legal issues unless separately agreed to in writing by both
            Client and Attorney. Attorney does not provide tax, accounting, or
            financial advisory services, and any such issues are outside the
            scope of this representation. Client is encouraged to consult
            separate professionals for such matters, as those responsibilities
            remain{" "}
            <span className="bg-purple-100 px-1 rounded font-semibold">
              {his}
            </span>{" "}
            own.
          </p>

          {/* Scope */}
          <h3 className="text-center font-bold underline text-gray-700">
            Scope of Representation
          </h3>
          <p>
            Attorney shall undertake all reasonable and necessary legal efforts
            to diligently protect and advance Client&apos;s interests in the Claim,
            extending to both settlement negotiations and litigation proceedings
            where appropriate. Client agrees to cooperate fully by providing
            truthful information, timely responses, and all relevant documents
            or records as requested. Client acknowledges that{" "}
            <span className="bg-purple-100 px-1 rounded font-semibold">
              {his}
            </span>{" "}
            cooperation is essential to the effective handling of the Claim.
          </p>

          {/* Accident Details */}
          <h3 className="text-center font-bold underline text-gray-700">
            Accident Details &amp; Insurance
          </h3>
          <p>
            The incident giving rise to this Claim occurred at{" "}
            <span className="bg-gold-100 px-1 rounded font-semibold">
              {ad.full_location || "[Accident Location]"}
            </span>
            . At the time of the accident, Client was operating or occupying a
            vehicle bearing registration plate number{" "}
            <span className="bg-gold-100 px-1 rounded font-semibold">
              {plateText}
            </span>
            . The circumstances surrounding the incident, including the actions
            of the involved parties and any contributing factors, will be
            further investigated by Attorney as part of the representation
            under this Agreement.
          </p>

          <p>
            Attorney is authorized to investigate the liability aspects of the
            incident, including the collection of police reports, witness
            statements, and property damage appraisals to determine the full
            extent of recoverable damages. Client understands that preserving
            evidence and providing truthful disclosures regarding the events
            leading to the loss are material obligations under this Agreement.
            This investigation will serve as the basis for identifying all
            applicable insurance coverage and responsible parties.
          </p>

          {/* Conditional Paragraph */}
          {ad.num_injured > 0 ? (
            <p className="border-l-4 border-red-400 pl-4 bg-red-50 py-2 rounded-r">
              Additionally, since the motor vehicle accident involved an injured
              person, Attorney will also investigate potential bodily injury
              claims and review relevant medical records to substantiate
              non-economic damages.
            </p>
          ) : (
            <p className="border-l-4 border-blue-400 pl-4 bg-blue-50 py-2 rounded-r">
              However, since the motor vehicle accident involved no reported
              injured people, the scope of this engagement is strictly limited
              to the recovery of property damage and loss of use.
            </p>
          )}

          {/* Litigation Expenses */}
          <h3 className="text-center font-bold underline text-gray-700">
            Litigation Expenses
          </h3>
          <p>
            Attorney will advance all reasonable costs and expenses necessary
            for the proper handling of the Claim (&quot;Litigation Expenses&quot;). Such
            expenses may include, but are not limited to, court filing fees,
            deposition costs, expert witness fees, medical record retrieval,
            travel expenses, investigative services, and administrative charges
            associated with case management.
          </p>
          <p>
            These Litigation Expenses will be reimbursed to Attorney from
            Client&apos;s share of the recovery in addition to the contingency fee.
            Client understands that these expenses are separate from medical
            bills, liens, or other financial obligations for which{" "}
            <span className="bg-purple-100 px-1 rounded font-semibold">
              {he}
            </span>{" "}
            may remain personally responsible.
          </p>

          {/* Liens */}
          <h3 className="text-center font-bold underline text-gray-700">
            Liens, Subrogation, and Other Obligations
          </h3>
          <p>
            Client understands that certain parties, such as healthcare
            providers, insurers, or government agencies (including Medicare or
            Medicaid), may have a legal right to reimbursement for payments
            made on Client&apos;s behalf. These are commonly referred to as liens
            or subrogation claims, and may affect the final amount received by
            Client from{" "}
            <span className="bg-purple-100 px-1 rounded font-semibold">
              {his}
            </span>{" "}
            settlement or judgment.
          </p>
          <p>
            Client hereby authorizes Attorney to negotiate, settle, and
            satisfy such claims from the proceeds of any recovery. Attorney
            may engage specialized lien resolution services or other
            professionals to assist in this process, and the cost of such
            services shall be treated as a Litigation Expense.
          </p>

          {/* SOL */}
          <h3 className="text-center font-bold underline text-gray-700">
            Statute of Limitations
          </h3>
          <p>
            Attorney will monitor and calculate the deadline for filing the
            Claim in accordance with applicable law. Based on current
            information, the statute of limitations for this matter is{" "}
            <span className="bg-gold-100 px-1 rounded font-semibold">
              {solDate}
            </span>
            . Client acknowledges the importance of timely cooperation in
            providing documents, records, and information necessary for
            Attorney to meet all legal deadlines.
          </p>

          {/* Termination */}
          <h3 className="text-center font-bold underline text-gray-700">
            Termination of Representation
          </h3>
          <p>
            Either party may terminate this Agreement upon reasonable written
            notice. If Client terminates this Agreement after substantial work
            has been performed, Attorney may assert a claim for attorney&apos;s fees
            based on the reasonable value of services rendered, payable from
            any eventual recovery. Client agrees that{" "}
            <span className="bg-purple-100 px-1 rounded font-semibold">
              {his}
            </span>{" "}
            obligation to compensate Attorney in such cases shall be limited
            to the reasonable value of the services rendered up to the point
            of termination.
          </p>

          {/* Signature */}
          <div className="pt-6 space-y-6 border-t border-gray-200">
            <p className="font-bold">ACCEPTED BY:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <p className="border-b border-gray-400 pb-1 mb-1 text-xs sm:text-sm">
                  CLIENT ___________________________
                </p>
                <p className="font-semibold">
                  <span className="bg-gold-100 px-1 rounded">
                    {clientName}
                  </span>
                </p>
              </div>
              <div className="sm:text-right">
                <p>Date: _______________</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <p className="border-b border-gray-400 pb-1 mb-1 text-xs sm:text-sm">
                  Richards &amp; Law Attorney ___________________________
                </p>
                <p className="font-semibold">
                  <span className="bg-emerald-100 px-1 rounded">
                    Andrew Richards
                  </span>
                </p>
              </div>
              <div className="sm:text-right">
                <p>Date: _______________</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3 bg-gray-50 flex flex-wrap items-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-gray-500 no-print">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-gold-100 rounded flex-shrink-0" aria-hidden="true" /> Extracted field
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-purple-100 rounded flex-shrink-0" aria-hidden="true" /> Gender pronoun
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-100 rounded flex-shrink-0" aria-hidden="true" /> Clio built-in
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-red-50 border border-red-300 rounded flex-shrink-0" aria-hidden="true" /> Conditional
          </div>
        </div>
      </div>
    </div>
  );
}
