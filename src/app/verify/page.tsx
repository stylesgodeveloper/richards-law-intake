"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowLeft,
  Send,
  User,
  Car,
  MapPin,
  FileText,
  Shield,
  Calendar,
  RefreshCw,
} from "lucide-react";
import type { ExtractionResult } from "@/lib/types";
import { ROLE_LABELS, calculateSOLDate } from "@/lib/constants";

type ConfidenceLevel = "high" | "medium" | "low";

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const config = {
    high: {
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      label: "High Confidence",
    },
    medium: {
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      label: "Medium — Review Needed",
    },
    low: {
      icon: XCircle,
      color: "text-red-600 bg-red-50 border-red-200",
      label: "Low — Manual Review Required",
    },
  };
  const { icon: Icon, color, label } = config[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

interface FieldProps {
  label: string;
  value: string | number | null;
  fieldKey: string;
  uncertain?: boolean;
  uncertainReason?: string;
  onChange: (key: string, value: string) => void;
}

function EditableField({
  label,
  value,
  fieldKey,
  uncertain,
  uncertainReason,
  onChange,
}: FieldProps) {
  const isLong =
    fieldKey.includes("description") ||
    fieldKey.includes("address") ||
    fieldKey.includes("location") ||
    fieldKey.includes("injuries");

  return (
    <div
      className={`space-y-1 ${
        uncertain
          ? "confidence-medium rounded-md px-3 py-2"
          : value === null || value === ""
          ? "confidence-low rounded-md px-3 py-2"
          : ""
      }`}
    >
      <label className="block text-xs font-medium text-gray-600">
        {label}
        {uncertain && (
          <span
            className="ml-1 text-amber-600"
            title={uncertainReason || "Uncertain"}
          >
            (uncertain)
          </span>
        )}
      </label>
      {isLong ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          rows={3}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none resize-y"
        />
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none"
        />
      )}
    </div>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [matterId, setMatterId] = useState("");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("extractionResult");
    const storedMatter = sessionStorage.getItem("matterId");
    const storedPdf = sessionStorage.getItem("uploadedPdf");
    const storedPdfName = sessionStorage.getItem("uploadedPdfName");

    if (!stored || !storedMatter) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      // Handle both { extraction: {...} } and direct extraction object
      setExtraction(parsed.extraction || parsed);
      setMatterId(storedMatter);
      if (storedPdf) setPdfBase64(storedPdf);
      if (storedPdfName) setPdfName(storedPdfName);
    } catch {
      router.push("/");
    }
  }, [router]);

  const updateField = (path: string, value: string) => {
    if (!extraction) return;
    const updated = JSON.parse(JSON.stringify(extraction)) as ExtractionResult;
    const parts = path.split(".");
    let obj: Record<string, unknown> = updated as unknown as Record<
      string,
      unknown
    >;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]] as Record<string, unknown>;
    }
    const lastKey = parts[parts.length - 1];
    // If the field should be a number, convert
    if (lastKey === "num_injured" || lastKey === "num_killed" || lastKey === "num_vehicles") {
      obj[lastKey] = parseInt(value) || 0;
    } else {
      obj[lastKey] = value;
    }
    setExtraction(updated);
  };

  const isFieldUncertain = (fieldPath: string): string | undefined => {
    if (!extraction) return undefined;
    const match = extraction.uncertain_fields.find(
      (u) => u.field === fieldPath || fieldPath.includes(u.field)
    );
    return match?.reason;
  };

  const handleApprove = async () => {
    if (!extraction) return;
    setProcessing(true);
    setError(null);

    try {
      // Calculate SOL date if not present
      const solDate =
        extraction.statute_of_limitations_date_8yr ||
        (extraction.accident_details.date
          ? calculateSOLDate(extraction.accident_details.date)
          : null);

      const payload = {
        matter_id: matterId,
        extraction: {
          ...extraction,
          statute_of_limitations_date_8yr: solDate,
        },
      };

      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `Processing failed (${response.status})`
        );
      }

      // Store data for status page
      sessionStorage.setItem("verifiedData", JSON.stringify(payload));
      router.push("/status");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setProcessing(false);
    }
  };

  if (!extraction) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-navy-600" />
      </div>
    );
  }

  const pdfDataUrl = pdfBase64
    ? `data:application/pdf;base64,${pdfBase64}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">
              Verify Extracted Data
            </h1>
            <p className="text-sm text-gray-500">
              Matter: {matterId} &middot; {pdfName}
            </p>
          </div>
        </div>
        <ConfidenceBadge level={extraction.extraction_confidence} />
      </div>

      {/* Uncertain fields warning */}
      {extraction.uncertain_fields.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800 text-sm">
                {extraction.uncertain_fields.length} field(s) need review
              </p>
              <ul className="mt-1 space-y-0.5">
                {extraction.uncertain_fields.map((u, i) => (
                  <li key={i} className="text-xs text-amber-700">
                    <span className="font-medium">{u.field}</span>: {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: PDF Viewer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-navy-800 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Original Police Report
          </div>
          {pdfDataUrl ? (
            <iframe
              src={pdfDataUrl}
              className="pdf-viewer"
              title="Police Report PDF"
            />
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400 text-sm">
              PDF preview not available
            </div>
          )}
        </div>

        {/* Right: Editable Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-navy-800 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Extracted Data — Edit as needed
          </div>
          <div className="p-4 space-y-6 max-h-[800px] overflow-y-auto custom-scrollbar">
            {/* Report Metadata */}
            <section>
              <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Report Metadata
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Report Number"
                  value={extraction.report_metadata.report_number}
                  fieldKey="report_metadata.report_number"
                  uncertain={!!isFieldUncertain("report_number")}
                  uncertainReason={isFieldUncertain("report_number")}
                  onChange={updateField}
                />
                <EditableField
                  label="Precinct"
                  value={extraction.report_metadata.precinct}
                  fieldKey="report_metadata.precinct"
                  onChange={updateField}
                />
                <EditableField
                  label="Officer Name"
                  value={extraction.report_metadata.officer_name}
                  fieldKey="report_metadata.officer_name"
                  uncertain={!!isFieldUncertain("officer_name")}
                  uncertainReason={isFieldUncertain("officer_name")}
                  onChange={updateField}
                />
                <EditableField
                  label="Officer Badge/Tax ID"
                  value={extraction.report_metadata.officer_badge_tax_id}
                  fieldKey="report_metadata.officer_badge_tax_id"
                  onChange={updateField}
                />
              </div>
            </section>

            {/* Accident Details */}
            <section>
              <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Accident Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Date (YYYY-MM-DD)"
                  value={extraction.accident_details.date}
                  fieldKey="accident_details.date"
                  onChange={updateField}
                />
                <EditableField
                  label="Time"
                  value={extraction.accident_details.time}
                  fieldKey="accident_details.time"
                  onChange={updateField}
                />
                <div className="col-span-2">
                  <EditableField
                    label="Full Location"
                    value={extraction.accident_details.full_location}
                    fieldKey="accident_details.full_location"
                    uncertain={!!isFieldUncertain("full_location")}
                    uncertainReason={isFieldUncertain("full_location")}
                    onChange={updateField}
                  />
                </div>
                <EditableField
                  label="Accident Type"
                  value={extraction.accident_details.accident_type}
                  fieldKey="accident_details.accident_type"
                  onChange={updateField}
                />
                <EditableField
                  label="No. Injured"
                  value={extraction.accident_details.num_injured}
                  fieldKey="accident_details.num_injured"
                  onChange={updateField}
                />
              </div>
              <div className="mt-3">
                <EditableField
                  label="Officer's Narrative (Verbatim)"
                  value={extraction.accident_details.description_verbatim}
                  fieldKey="accident_details.description_verbatim"
                  uncertain={!!isFieldUncertain("description_verbatim")}
                  uncertainReason={isFieldUncertain("description_verbatim")}
                  onChange={updateField}
                />
              </div>
            </section>

            {/* Client Party */}
            <section>
              <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Client (Plaintiff) &mdash;{" "}
                <span className="text-gold-600 font-normal">
                  {ROLE_LABELS[extraction.client_party.role] ||
                    extraction.client_party.role}
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="First Name"
                  value={extraction.client_party.first_name}
                  fieldKey="client_party.first_name"
                  onChange={updateField}
                />
                <EditableField
                  label="Last Name"
                  value={extraction.client_party.last_name}
                  fieldKey="client_party.last_name"
                  onChange={updateField}
                />
                <EditableField
                  label="Sex (M/F)"
                  value={extraction.client_party.sex}
                  fieldKey="client_party.sex"
                  onChange={updateField}
                />
                <EditableField
                  label="Date of Birth"
                  value={extraction.client_party.date_of_birth}
                  fieldKey="client_party.date_of_birth"
                  onChange={updateField}
                />
                <div className="col-span-2">
                  <EditableField
                    label="Address"
                    value={extraction.client_party.address}
                    fieldKey="client_party.address"
                    onChange={updateField}
                  />
                </div>
                <EditableField
                  label="Driver's License"
                  value={extraction.client_party.drivers_license}
                  fieldKey="client_party.drivers_license"
                  onChange={updateField}
                />
                <EditableField
                  label="Plate Number"
                  value={extraction.client_party.plate_number}
                  fieldKey="client_party.plate_number"
                  onChange={updateField}
                />
                <div className="col-span-2">
                  <EditableField
                    label="Vehicle (Year/Make/Model)"
                    value={extraction.client_party.vehicle_year_make_model}
                    fieldKey="client_party.vehicle_year_make_model"
                    onChange={updateField}
                  />
                </div>
                {extraction.client_party.injuries && (
                  <div className="col-span-2">
                    <EditableField
                      label="Injuries"
                      value={extraction.client_party.injuries}
                      fieldKey="client_party.injuries"
                      onChange={updateField}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Adverse Party */}
            <section>
              <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Adverse Party (Defendant) &mdash;{" "}
                <span className="text-red-600 font-normal">
                  {ROLE_LABELS[extraction.adverse_party.role] ||
                    extraction.adverse_party.role}
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="First Name"
                  value={extraction.adverse_party.first_name}
                  fieldKey="adverse_party.first_name"
                  onChange={updateField}
                />
                <EditableField
                  label="Last Name"
                  value={extraction.adverse_party.last_name}
                  fieldKey="adverse_party.last_name"
                  onChange={updateField}
                />
                <EditableField
                  label="Sex (M/F)"
                  value={extraction.adverse_party.sex}
                  fieldKey="adverse_party.sex"
                  onChange={updateField}
                />
                <EditableField
                  label="Date of Birth"
                  value={extraction.adverse_party.date_of_birth}
                  fieldKey="adverse_party.date_of_birth"
                  onChange={updateField}
                />
                <div className="col-span-2">
                  <EditableField
                    label="Address"
                    value={extraction.adverse_party.address}
                    fieldKey="adverse_party.address"
                    onChange={updateField}
                  />
                </div>
                <EditableField
                  label="Plate Number"
                  value={extraction.adverse_party.plate_number}
                  fieldKey="adverse_party.plate_number"
                  onChange={updateField}
                />
                <div className="col-span-2">
                  <EditableField
                    label="Vehicle (Year/Make/Model)"
                    value={extraction.adverse_party.vehicle_year_make_model}
                    fieldKey="adverse_party.vehicle_year_make_model"
                    onChange={updateField}
                  />
                </div>
              </div>
            </section>

            {/* SOL */}
            <section>
              <h3 className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Statute of Limitations
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="SOL Date (8-year)"
                  value={
                    extraction.statute_of_limitations_date_8yr ||
                    (extraction.accident_details.date
                      ? calculateSOLDate(extraction.accident_details.date)
                      : null)
                  }
                  fieldKey="statute_of_limitations_date_8yr"
                  onChange={updateField}
                />
                <EditableField
                  label="SOL Date (3-year standard)"
                  value={
                    extraction.accident_details.date
                      ? (() => {
                          const d = new Date(
                            extraction.accident_details.date
                          );
                          d.setFullYear(d.getFullYear() + 3);
                          return d.toISOString().split("T")[0];
                        })()
                      : null
                  }
                  fieldKey="_sol_3yr_display"
                  onChange={() => {}} // Read-only display
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Note: Client requested 8-year SOL. Standard NY PI SOL is 3
                years. Both will be calendared.
              </p>
            </section>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Re-extract
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className={`flex-[2] py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  processing
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Approve & Process in Clio
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
