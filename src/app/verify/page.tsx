"use client";

import { useState, useEffect, useCallback } from "react";
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
  Footprints,
  Gavel,
  Dog,
  ClipboardList,
  Square,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ExtractionResult, PartyInfo, ViabilityScore } from "@/lib/types";
import { ROLE_LABELS, REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, calculateSOLDate } from "@/lib/constants";
import { generateFollowUpChecklist, CATEGORY_CONFIG, PRIORITY_DOTS } from "@/lib/follow-up-tasks";
import type { FollowUpItem } from "@/lib/follow-up-tasks";
import { SkeletonVerifyPage } from "@/components/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { useToast } from "@/components/toast";

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

function ReportTypeBadge({ type }: { type: string }) {
  const label = REPORT_TYPE_LABELS[type] || type;
  const color = REPORT_TYPE_COLORS[type] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

interface FieldProps {
  label: string;
  value: string | number | boolean | null;
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
    fieldKey.includes("full_address") ||
    fieldKey.includes("location") ||
    fieldKey.includes("injuries") ||
    fieldKey.includes("hazard_description") ||
    fieldKey.includes("suspect_description");

  const displayValue = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  const isEmpty = displayValue === null || displayValue === "";

  return (
    <div
      className={`group relative rounded-lg p-2.5 transition-all ${
        uncertain
          ? "bg-amber-50/60 ring-1 ring-amber-200 hover:ring-amber-300"
          : isEmpty
          ? "bg-red-50/30 ring-1 ring-red-100 hover:ring-red-200"
          : "hover:bg-gray-50/80"
      }`}
    >
      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}
        {uncertain && (
          <span className="ml-1.5 normal-case text-amber-600 tracking-normal" title={uncertainReason || "Uncertain"}>
            (uncertain)
          </span>
        )}
      </label>
      {isLong ? (
        <textarea
          value={displayValue ?? ""}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          rows={3}
          className="w-full text-sm text-navy-900 bg-transparent border-0 border-b border-transparent focus:border-navy-300 focus:ring-0 focus:outline-none transition-colors p-0 pb-0.5 resize-y placeholder:text-gray-300"
          placeholder="Not extracted"
        />
      ) : (
        <input
          type="text"
          value={displayValue ?? ""}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="w-full text-sm text-navy-900 bg-transparent border-0 border-b border-transparent focus:border-navy-300 focus:ring-0 focus:outline-none transition-colors p-0 pb-0.5 placeholder:text-gray-300"
          placeholder="Not extracted"
        />
      )}
      {uncertain && (
        <div className="absolute -top-1 -right-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        </div>
      )}
    </div>
  );
}

function composeFullAddress(party: PartyInfo): string {
  return party.full_address ||
    [party.address, party.city, party.state && party.zip ? `${party.state} ${party.zip}` : party.state]
      .filter(Boolean)
      .join(", ");
}

function getCaseStrengthAnalysis(extraction: ExtractionResult): {
  level: "strong" | "moderate" | "weak";
  factors: string[];
  missing: string[];
} {
  const factors: string[] = [];
  const missing: string[] = [];
  const rt = extraction.report_type || "vehicle_accident";

  if (extraction.accident_details.description_verbatim) {
    factors.push("Officer narrative present");
  } else {
    missing.push("Officer narrative missing — critical for liability");
  }

  if (extraction.other_involved_persons.length > 0) {
    factors.push(`${extraction.other_involved_persons.length} witness(es) / involved person(s) identified`);
  } else {
    missing.push("No witnesses identified in report");
  }

  if (extraction.client_party.injuries && extraction.client_party.injuries !== "") {
    factors.push("Client injuries documented");
  }

  if (extraction.uncertain_fields.length === 0) {
    factors.push("All fields extracted with high confidence");
  } else {
    missing.push(`${extraction.uncertain_fields.length} uncertain field(s) need verification`);
  }

  if (rt === "vehicle_accident") {
    const desc = (extraction.accident_details.description_verbatim || "").toUpperCase();
    if (desc.includes("REAR") && desc.includes("END")) {
      factors.push("Rear-end collision — presumption of liability on following driver");
    }
    if (desc.includes("DID NOT WITNESS")) {
      missing.push("Officer did not witness the accident");
    }
    if (extraction.adverse_party.plate_number) {
      factors.push("Defendant vehicle plate number identified");
    }
    if (extraction.adverse_party.insurance_code) {
      factors.push("Defendant insurance information present");
    } else {
      missing.push("Defendant insurance information not found");
    }
  } else if (rt === "slip_and_fall" && extraction.slip_and_fall_details) {
    const sf = extraction.slip_and_fall_details;
    if (sf.warning_signage_present === false) {
      factors.push("No warning signage was present — supports negligence claim");
    }
    if (sf.surveillance_cameras_present) {
      factors.push("Surveillance footage available");
    }
    if (sf.hazard_description) {
      factors.push(`Hazard documented: ${sf.hazard_description.substring(0, 60)}`);
    }
    if (!sf.property_owner_company) {
      missing.push("Property owner/company not identified");
    }
  } else if (rt === "assault" && extraction.assault_details) {
    const ad = extraction.assault_details;
    if (ad.arrest_made) {
      factors.push("Arrest was made — strengthens civil claim");
    }
    if (ad.charges_filed) {
      factors.push(`Criminal charges filed: ${ad.charges_filed}`);
    }
    if (ad.suspect_description) {
      factors.push("Suspect identified and described");
    }
    if (!ad.arrest_made) {
      missing.push("No arrest made — suspect identification may be challenging");
    }
  }

  const score = factors.length - missing.length;
  const level = score >= 3 ? "strong" : score >= 1 ? "moderate" : "weak";

  return { level, factors, missing };
}

function CaseStrengthCard({ extraction }: { extraction: ExtractionResult }) {
  const { level, factors, missing } = getCaseStrengthAnalysis(extraction);

  const config = {
    strong: { color: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-800", label: "Strong Indicators", icon: CheckCircle2 },
    moderate: { color: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-800", label: "Moderate — Needs More Evidence", icon: AlertTriangle },
    weak: { color: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-800", label: "Weak — Significant Gaps", icon: XCircle },
  };
  const c = config[level];
  const Icon = c.icon;

  return (
    <div className={`rounded-xl border p-4 ${c.color}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" />
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
          Case Strength: {c.label}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {factors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-emerald-800 mb-1">Liability Indicators</p>
            <ul className="space-y-0.5">
              {factors.map((f, i) => (
                <li key={i} className="text-xs text-emerald-700 flex items-start gap-1">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {missing.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-800 mb-1">Evidence Gaps</p>
            <ul className="space-y-0.5">
              {missing.map((m, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SVG Arc Score Gauge ─────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, { stroke: string; bg: string; text: string; badge: string }> = {
  emerald: { stroke: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
  blue:    { stroke: "#3b82f6", bg: "bg-blue-50",    text: "text-blue-700",    badge: "bg-blue-100 text-blue-800" },
  amber:   { stroke: "#f59e0b", bg: "bg-amber-50",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-800" },
  orange:  { stroke: "#f97316", bg: "bg-orange-50",   text: "text-orange-700",  badge: "bg-orange-100 text-orange-800" },
  red:     { stroke: "#ef4444", bg: "bg-red-50",     text: "text-red-700",     badge: "bg-red-100 text-red-800" },
};

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const radius = 70;
  const circumference = Math.PI * radius; // half-circle
  const offset = circumference - (score / 100) * circumference;
  const colors = CATEGORY_STYLES[color] || CATEGORY_STYLES.blue;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Background arc */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke="#e5e7eb" strokeWidth="10"
          strokeDasharray={`${circumference} 999`}
          strokeDashoffset={-circumference}
          strokeLinecap="round"
          transform="rotate(180 90 90)"
        />
        {/* Score arc */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke={colors.stroke} strokeWidth="10"
          strokeDasharray={`${circumference} 999`}
          strokeDashoffset={-circumference + offset}
          strokeLinecap="round"
          transform="rotate(180 90 90)"
          className="score-arc"
          style={{
            "--initial-offset": `-${0}`,
            "--final-offset": `-${circumference - offset}`,
          } as React.CSSProperties}
        />
      </svg>
      {/* Score number */}
      <div className="absolute top-4 flex flex-col items-center">
        <span className="text-4xl font-bold text-white tabular-nums">{score}</span>
        <span className="text-xs text-navy-300 font-medium">/100</span>
      </div>
    </div>
  );
}

function ViabilityScoreCard({ score, loading }: { score: ViabilityScore | null; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-layered overflow-hidden">
        <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-6">
          <div className="flex items-center gap-4">
            <div className="w-[180px] h-[100px] rounded-xl bg-navy-700/50 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-32 bg-navy-700/50 animate-pulse rounded-full" />
              <div className="h-3 w-64 bg-navy-700/30 animate-pulse rounded" />
              <div className="h-3 w-40 bg-navy-700/30 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!score) return null;

  const colors = CATEGORY_STYLES[score.category_color] || CATEGORY_STYLES.blue;
  const breakdownEntries = Object.entries(score.breakdown) as [string, { score: number; max: number; factors: string[] }][];
  const labels: Record<string, string> = {
    liability: "Liability",
    injury_severity: "Injury Severity",
    defendant_profile: "Defendant Profile",
    evidence_quality: "Evidence Quality",
    sol_status: "SOL Status",
    completeness: "Completeness",
  };

  return (
    <div className="rounded-2xl border border-gray-200 shadow-layered overflow-hidden">
      {/* Dark gradient header with gauge */}
      <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ScoreGauge score={score.total_score} color={score.category_color} />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors.badge}`}>
                {score.category}
              </span>
              <span className="text-xs text-navy-400">AI Case Viability Score</span>
            </div>
            <p className="text-sm text-navy-200 mb-3">{score.recommendation}</p>

            {/* Factor bars */}
            <div className="space-y-1.5">
              {breakdownEntries.map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-navy-400 w-20 truncate">{labels[key] || key}</span>
                  <div className="flex-1 h-1.5 bg-navy-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(val.score / val.max) * 100}%`,
                        backgroundColor: val.score / val.max > 0.7 ? "#10b981" : val.score / val.max > 0.4 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-navy-400 w-8 text-right tabular-nums">{val.score}/{val.max}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settlement & SOL */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
            <span className="text-navy-400">Settlement:</span>
            <span className="font-semibold text-white">{score.settlement_range}</span>
          </div>
          {score.sol_deadline && (
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
              <Calendar className="w-3 h-3 text-navy-400" />
              <span className="text-navy-400">SOL:</span>
              <span className="font-semibold text-white">{score.sol_deadline}</span>
            </div>
          )}
        </div>
      </div>

      {/* Strengths & Risks */}
      {(score.key_strengths.length > 0 || score.key_risks.length > 0) && (
        <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
          <div className="p-4 border-r border-gray-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Strengths</p>
            {score.key_strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">{s}</span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">Risks</p>
            {score.key_risks.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1.5">
                <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-700">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Narrative */}
      {score.ai_narrative && (
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Assessment</p>
          <p className="text-xs text-gray-700 italic leading-relaxed">{score.ai_narrative}</p>
        </div>
      )}

      {/* Expandable detailed breakdown */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
      >
        {expanded ? "Hide" : "Show"} detailed scoring breakdown
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {breakdownEntries.map(([key, val]) => (
            <div key={key} className="pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-800">{labels[key] || key}</span>
                <span className="text-xs font-bold text-navy-700">{val.score}/{val.max}</span>
              </div>
              <ul className="space-y-0.5">
                {val.factors.map((f, i) => (
                  <li key={i} className="text-[11px] text-gray-600 pl-2 border-l-2 border-gray-200">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {score.sol_statute && (
            <p className="text-[11px] text-gray-500 italic mt-2">
              Applicable statute: {score.sol_statute}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FollowUpChecklist({ extraction }: { extraction: ExtractionResult }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);

  const items = generateFollowUpChecklist(extraction);
  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-layered-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-navy-50 to-transparent border-b border-gray-200 hover:from-navy-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-navy-100 text-navy-600 flex items-center justify-center">
            <ClipboardList className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold text-navy-800">
            Follow-Up Checklist
          </span>
          <span className="text-xs text-navy-500 bg-navy-100 px-2 py-0.5 rounded-full">
            {checked.size}/{items.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-navy-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-navy-500" />
        )}
      </button>
      {expanded && (
        <div className="p-3 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
          {items.map((item) => {
            const done = checked.has(item.id);
            const cat = CATEGORY_CONFIG[item.category];
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                  done ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"
                }`}
              >
                {done ? (
                  <CheckSquare className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {item.text}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[item.priority]}`} title={`${item.priority} priority`} />
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cat.color}`}>
                    {cat.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  status,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  status: "complete" | "warning" | "error";
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-navy-100 text-navy-600 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-navy-800">
          {title}
          {subtitle && <span className="font-normal text-gold-600 ml-1">&mdash; {subtitle}</span>}
        </h3>
      </div>
      {status === "complete" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
      {status === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
      {status === "error" && <XCircle className="w-4 h-4 text-red-500" />}
    </div>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [matterId, setMatterId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viabilityScore, setViabilityScore] = useState<ViabilityScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  const fetchViabilityScore = useCallback(async (ext: ExtractionResult) => {
    setScoreLoading(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction: ext }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.score) setViabilityScore(data.score);
      }
    } catch (err) {
      console.warn("Viability score fetch failed:", err);
    } finally {
      setScoreLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("extractionResult");
    const storedMatter = sessionStorage.getItem("matterId");
    const storedEmail = sessionStorage.getItem("clientEmail");
    const storedPdf = sessionStorage.getItem("uploadedPdf");
    const storedPdfName = sessionStorage.getItem("uploadedPdfName");

    if (!stored || !storedMatter) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const ext = parsed.extraction || parsed;
      if (!ext.report_type) ext.report_type = "vehicle_accident";
      setExtraction(ext);
      setMatterId(storedMatter);
      if (storedEmail) setClientEmail(storedEmail);
      if (storedPdf) setPdfBase64(storedPdf);
      if (storedPdfName) setPdfName(storedPdfName);
      fetchViabilityScore(ext);
    } catch {
      router.push("/");
    }
  }, [router, fetchViabilityScore]);

  const updateField = (path: string, value: string) => {
    if (!extraction) return;
    const updated = JSON.parse(JSON.stringify(extraction)) as ExtractionResult;
    const parts = path.split(".");
    let obj: Record<string, unknown> = updated as unknown as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]] as Record<string, unknown>;
    }
    const lastKey = parts[parts.length - 1];
    if (lastKey === "num_injured" || lastKey === "num_killed" || lastKey === "num_vehicles") {
      obj[lastKey] = parseInt(value) || 0;
    } else if (
      lastKey === "warning_signage_present" ||
      lastKey === "surveillance_cameras_present" ||
      lastKey === "arrest_made" ||
      lastKey === "weapon_recovered" ||
      lastKey === "protective_order" ||
      lastKey === "vaccination_current" ||
      lastKey === "quarantine_ordered" ||
      lastKey === "leash_law_violation" ||
      lastKey === "prior_bite_history"
    ) {
      const lower = value.toLowerCase().trim();
      obj[lastKey] = lower === "yes" || lower === "true" ? true : lower === "no" || lower === "false" ? false : null;
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

  const countFields = useCallback((): { filled: number; total: number } => {
    if (!extraction) return { filled: 0, total: 20 };
    const baseFields: (string | number | null | undefined)[] = [
      extraction.report_metadata.report_number,
      extraction.report_metadata.precinct,
      extraction.report_metadata.officer_name,
      extraction.report_metadata.officer_badge_tax_id,
      extraction.accident_details.date,
      extraction.accident_details.time,
      extraction.accident_details.full_location,
      extraction.accident_details.accident_type,
      extraction.accident_details.description_verbatim,
      extraction.client_party.first_name,
      extraction.client_party.last_name,
      extraction.client_party.date_of_birth,
      extraction.client_party.address,
      extraction.adverse_party.first_name,
      extraction.adverse_party.last_name,
      extraction.adverse_party.address,
    ];

    if (extraction.report_type === "vehicle_accident") {
      baseFields.push(
        extraction.client_party.drivers_license,
        extraction.client_party.plate_number,
        extraction.adverse_party.date_of_birth,
        extraction.adverse_party.plate_number,
      );
    } else if (extraction.report_type === "slip_and_fall" && extraction.slip_and_fall_details) {
      baseFields.push(
        extraction.slip_and_fall_details.property_owner_company,
        extraction.slip_and_fall_details.hazard_description,
        extraction.slip_and_fall_details.property_type,
        extraction.client_party.injuries,
      );
    } else if (extraction.report_type === "assault" && extraction.assault_details) {
      baseFields.push(
        extraction.assault_details.crime_classification,
        extraction.assault_details.charges_filed,
        extraction.assault_details.suspect_description,
        extraction.client_party.injuries,
      );
    }

    const total = baseFields.length;
    const filled = baseFields.filter((f) => f !== null && f !== undefined && f !== "").length;
    return { filled, total };
  }, [extraction]);

  const getSectionStatus = useCallback(
    (section: "metadata" | "accident" | "client" | "adverse" | "type_specific"): "complete" | "warning" | "error" => {
      if (!extraction) return "error";
      const uncertainFields = extraction.uncertain_fields.map((u) => u.field);

      let fields: (string | number | boolean | null | undefined)[];
      let fieldPaths: string[];

      switch (section) {
        case "metadata":
          fields = [
            extraction.report_metadata.report_number,
            extraction.report_metadata.precinct,
            extraction.report_metadata.officer_name,
            extraction.report_metadata.officer_badge_tax_id,
          ];
          fieldPaths = ["report_number", "precinct", "officer_name", "officer_badge_tax_id"];
          break;
        case "accident":
          fields = [
            extraction.accident_details.date,
            extraction.accident_details.time,
            extraction.accident_details.full_location,
            extraction.accident_details.accident_type,
          ];
          fieldPaths = ["accident_details.date", "accident_details.time", "full_location", "accident_type"];
          break;
        case "client":
          fields = [
            extraction.client_party.first_name,
            extraction.client_party.last_name,
            extraction.client_party.date_of_birth,
            extraction.client_party.address,
          ];
          fieldPaths = ["client_party.first_name", "client_party.last_name", "client_party.date_of_birth", "client_party.address"];
          break;
        case "adverse":
          fields = [
            extraction.adverse_party.first_name,
            extraction.adverse_party.last_name,
            extraction.adverse_party.address,
          ];
          fieldPaths = ["adverse_party.first_name", "adverse_party.last_name", "adverse_party.address"];
          break;
        case "type_specific":
          if (extraction.report_type === "slip_and_fall" && extraction.slip_and_fall_details) {
            fields = [
              extraction.slip_and_fall_details.hazard_description,
              extraction.slip_and_fall_details.property_type,
            ];
            fieldPaths = ["slip_and_fall_details.hazard_description", "slip_and_fall_details.property_type"];
          } else if (extraction.report_type === "assault" && extraction.assault_details) {
            fields = [
              extraction.assault_details.crime_classification,
              extraction.assault_details.charges_filed,
            ];
            fieldPaths = ["assault_details.crime_classification", "assault_details.charges_filed"];
          } else {
            return "complete";
          }
          break;
      }

      const hasUncertain = fieldPaths.some((fp) =>
        uncertainFields.some((uf) => uf.includes(fp) || fp.includes(uf))
      );
      const allFilled = fields.every((f) => f !== null && f !== undefined && f !== "");

      if (allFilled && !hasUncertain) return "complete";
      if (hasUncertain || !allFilled) return "warning";
      return "error";
    },
    [extraction]
  );

  const handleApprove = useCallback(async () => {
    if (!extraction) return;
    setProcessing(true);
    setError(null);

    try {
      const solDate =
        extraction.statute_of_limitations_date_8yr ||
        (extraction.accident_details.date
          ? calculateSOLDate(extraction.accident_details.date, extraction.report_type)
          : null);

      const followUpTasks = generateFollowUpChecklist(extraction);
      const payload = {
        matter_id: matterId,
        client_email: clientEmail,
        extraction: {
          ...extraction,
          statute_of_limitations_date_8yr: solDate,
        },
        follow_up_tasks: followUpTasks,
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

      sessionStorage.setItem("verifiedData", JSON.stringify(payload));
      toast("Data approved — starting pipeline", "success");
      router.push("/status");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
      toast(msg, "error");
      setProcessing(false);
    }
  }, [extraction, matterId, router, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !processing) {
        e.preventDefault();
        handleApprove();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleApprove, processing]);

  if (!extraction) {
    return <SkeletonVerifyPage />;
  }

  const pdfDataUrl = pdfBase64
    ? `data:application/pdf;base64,${pdfBase64}`
    : null;

  const { filled, total } = countFields();
  const progressPct = Math.round((filled / total) * 100);
  const progressColor =
    progressPct === 100
      ? "bg-emerald-500"
      : progressPct >= 75
      ? "bg-gold-500"
      : "bg-amber-500";

  const reportType = extraction.report_type || "vehicle_accident";
  const isVehicle = reportType === "vehicle_accident";
  const isSlipAndFall = reportType === "slip_and_fall";
  const isAssault = reportType === "assault";
  const isDogBite = reportType === "dog_bite";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to upload"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy-900">
              Verify Extracted Data
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {matterId === "auto" ? "New Matter (auto-create)" : `Matter: ${matterId}`} &middot; {pdfName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReportTypeBadge type={reportType} />
          <ConfidenceBadge level={extraction.extraction_confidence} />
        </div>
      </div>

      {/* Uncertain fields warning */}
      {extraction.uncertain_fields.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-slide-up">
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

      {/* Quick-Scan Summary Card */}
      <div className="bg-gradient-to-r from-navy-50 to-transparent border border-navy-200 rounded-xl px-4 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-navy-500 font-medium uppercase tracking-wider text-[10px]">Client</span>
            <p className="text-navy-900 font-semibold truncate">
              {extraction.client_party.full_name || "—"}
            </p>
          </div>
          <div>
            <span className="text-navy-500 font-medium uppercase tracking-wider text-[10px]">
              {isAssault ? "Suspect" : isSlipAndFall ? "Property Owner" : "Defendant"}
            </span>
            <p className="text-navy-900 font-semibold truncate">
              {extraction.adverse_party.full_name || "—"}
            </p>
          </div>
          <div>
            <span className="text-navy-500 font-medium uppercase tracking-wider text-[10px]">Incident Date</span>
            <p className="text-navy-900 font-semibold">
              {extraction.accident_details.date || "—"}
            </p>
          </div>
          <div>
            <span className="text-navy-500 font-medium uppercase tracking-wider text-[10px]">Location</span>
            <p className="text-navy-900 font-semibold truncate">
              {extraction.accident_details.location_borough || extraction.accident_details.full_location || "—"}
            </p>
          </div>
          <div>
            <span className="text-navy-500 font-medium uppercase tracking-wider text-[10px]">Report #</span>
            <p className="text-navy-900 font-semibold truncate">
              {extraction.report_metadata.report_number || "—"}
            </p>
          </div>
          <div>
            <span className="text-navy-500 font-medium uppercase tracking-wider text-[10px]">Injured</span>
            <p className="text-navy-900 font-semibold">
              {extraction.accident_details.num_injured}
            </p>
          </div>
        </div>
      </div>

      {/* AI Case Viability Score */}
      <ErrorBoundary fallbackTitle="Score card failed to render">
        <ViabilityScoreCard score={viabilityScore} loading={scoreLoading} />
      </ErrorBoundary>

      {/* Case Strength Indicator */}
      <CaseStrengthCard extraction={extraction} />

      {/* Follow-Up Checklist */}
      <FollowUpChecklist extraction={extraction} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: PDF Viewer */}
        <div className="bg-white rounded-2xl shadow-layered border border-gray-200/80 overflow-hidden">
          <div className="sticky top-0 z-10 glass-dark text-white px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Original Police Report
          </div>
          <ErrorBoundary fallbackTitle="PDF viewer failed to load">
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
          </ErrorBoundary>
        </div>

        {/* Right: Editable Form */}
        <div className="bg-white rounded-2xl shadow-layered border border-gray-200/80 overflow-hidden">
          <div className="sticky top-0 z-10 glass-dark text-white px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Extracted Data — Edit as needed
          </div>

          {/* Field Completion Progress Bar */}
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span className="font-medium">{filled}/{total} fields populated</span>
              <span className="tabular-nums">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="p-4 space-y-5 max-h-[800px] overflow-y-auto custom-scrollbar">
            {/* Report Metadata */}
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-layered-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-navy-50 to-transparent border-b border-gray-100">
                <SectionHeader icon={FileText} title="Report Metadata" status={getSectionStatus("metadata")} />
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <EditableField label="Report Number" value={extraction.report_metadata.report_number} fieldKey="report_metadata.report_number" uncertain={!!isFieldUncertain("report_number")} uncertainReason={isFieldUncertain("report_number")} onChange={updateField} />
                <EditableField label="Precinct" value={extraction.report_metadata.precinct} fieldKey="report_metadata.precinct" onChange={updateField} />
                <EditableField label="Officer Name" value={extraction.report_metadata.officer_name} fieldKey="report_metadata.officer_name" uncertain={!!isFieldUncertain("officer_name")} uncertainReason={isFieldUncertain("officer_name")} onChange={updateField} />
                <EditableField label="Officer Badge/Tax ID" value={extraction.report_metadata.officer_badge_tax_id} fieldKey="report_metadata.officer_badge_tax_id" onChange={updateField} />
              </div>
            </section>

            {/* Incident Details */}
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-layered-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-navy-50 to-transparent border-b border-gray-100">
                <SectionHeader icon={MapPin} title={isVehicle ? "Accident Details" : "Incident Details"} status={getSectionStatus("accident")} />
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <EditableField label="Date (YYYY-MM-DD)" value={extraction.accident_details.date} fieldKey="accident_details.date" onChange={updateField} />
                <EditableField label="Time" value={extraction.accident_details.time} fieldKey="accident_details.time" onChange={updateField} />
                <div className="col-span-2">
                  <EditableField label="Full Location" value={extraction.accident_details.full_location} fieldKey="accident_details.full_location" uncertain={!!isFieldUncertain("full_location")} uncertainReason={isFieldUncertain("full_location")} onChange={updateField} />
                </div>
                <EditableField label={isVehicle ? "Accident Type" : "Incident Type"} value={extraction.accident_details.accident_type} fieldKey="accident_details.accident_type" onChange={updateField} />
                <EditableField label="No. Injured" value={extraction.accident_details.num_injured} fieldKey="accident_details.num_injured" onChange={updateField} />
                <div className="col-span-2">
                  <EditableField label="Officer's Narrative (Verbatim)" value={extraction.accident_details.description_verbatim} fieldKey="accident_details.description_verbatim" uncertain={!!isFieldUncertain("description_verbatim")} uncertainReason={isFieldUncertain("description_verbatim")} onChange={updateField} />
                </div>
              </div>
            </section>

            {/* Client Party */}
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-layered-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-navy-50 to-transparent border-b border-gray-100">
                <SectionHeader icon={User} title="Client (Plaintiff)" subtitle={ROLE_LABELS[extraction.client_party.role] || extraction.client_party.role} status={getSectionStatus("client")} />
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <EditableField label="First Name" value={extraction.client_party.first_name} fieldKey="client_party.first_name" onChange={updateField} />
                <EditableField label="Last Name" value={extraction.client_party.last_name} fieldKey="client_party.last_name" onChange={updateField} />
                <EditableField label="Sex (M/F)" value={extraction.client_party.sex} fieldKey="client_party.sex" onChange={updateField} />
                <EditableField label="Date of Birth" value={extraction.client_party.date_of_birth} fieldKey="client_party.date_of_birth" onChange={updateField} />
                <div className="col-span-2">
                  <EditableField label="Full Address" value={composeFullAddress(extraction.client_party)} fieldKey="client_party.full_address" onChange={updateField} />
                </div>
                {isVehicle && (
                  <>
                    <EditableField label="Driver's License" value={extraction.client_party.drivers_license} fieldKey="client_party.drivers_license" onChange={updateField} />
                    <EditableField label="Plate Number" value={extraction.client_party.plate_number} fieldKey="client_party.plate_number" onChange={updateField} />
                    <div className="col-span-2">
                      <EditableField label="Vehicle (Year/Make/Model)" value={extraction.client_party.vehicle_year_make_model} fieldKey="client_party.vehicle_year_make_model" onChange={updateField} />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <EditableField label="Injuries" value={extraction.client_party.injuries || ""} fieldKey="client_party.injuries" onChange={updateField} />
                </div>
              </div>
            </section>

            {/* Adverse Party */}
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-layered-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-navy-50 to-transparent border-b border-gray-100">
                <SectionHeader icon={isAssault ? Gavel : Car} title={isAssault ? "Suspect" : isSlipAndFall ? "Property Owner (Defendant)" : isDogBite ? "Animal Owner (Defendant)" : "Adverse Party (Defendant)"} subtitle={ROLE_LABELS[extraction.adverse_party.role] || extraction.adverse_party.role} status={getSectionStatus("adverse")} />
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <EditableField label="First Name" value={extraction.adverse_party.first_name} fieldKey="adverse_party.first_name" onChange={updateField} />
                <EditableField label="Last Name" value={extraction.adverse_party.last_name} fieldKey="adverse_party.last_name" onChange={updateField} />
                <EditableField label="Sex (M/F)" value={extraction.adverse_party.sex} fieldKey="adverse_party.sex" onChange={updateField} />
                <EditableField label="Date of Birth" value={extraction.adverse_party.date_of_birth} fieldKey="adverse_party.date_of_birth" onChange={updateField} />
                <div className="col-span-2">
                  <EditableField label="Full Address" value={composeFullAddress(extraction.adverse_party)} fieldKey="adverse_party.full_address" onChange={updateField} />
                </div>
                {isVehicle && (
                  <>
                    <EditableField label="Plate Number" value={extraction.adverse_party.plate_number} fieldKey="adverse_party.plate_number" onChange={updateField} />
                    <div className="col-span-2">
                      <EditableField label="Vehicle (Year/Make/Model)" value={extraction.adverse_party.vehicle_year_make_model} fieldKey="adverse_party.vehicle_year_make_model" onChange={updateField} />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Type-Specific: Slip and Fall */}
            {isSlipAndFall && extraction.slip_and_fall_details && (
              <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-layered-sm">
                <div className="px-4 py-3 bg-gradient-to-r from-navy-50 to-transparent border-b border-gray-100">
                  <SectionHeader icon={Footprints} title="Premises / Hazard Details" status={getSectionStatus("type_specific")} />
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <EditableField label="Property Owner Company" value={extraction.slip_and_fall_details.property_owner_company} fieldKey="slip_and_fall_details.property_owner_company" onChange={updateField} />
                  <EditableField label="Property Type" value={extraction.slip_and_fall_details.property_type} fieldKey="slip_and_fall_details.property_type" onChange={updateField} />
                  <div className="col-span-2">
                    <EditableField label="Hazard Description" value={extraction.slip_and_fall_details.hazard_description} fieldKey="slip_and_fall_details.hazard_description" onChange={updateField} />
                  </div>
                  <EditableField label="Warning Signage Present?" value={extraction.slip_and_fall_details.warning_signage_present} fieldKey="slip_and_fall_details.warning_signage_present" onChange={updateField} />
                  <EditableField label="Surveillance Cameras?" value={extraction.slip_and_fall_details.surveillance_cameras_present} fieldKey="slip_and_fall_details.surveillance_cameras_present" onChange={updateField} />
                  <EditableField label="Weather Conditions" value={extraction.slip_and_fall_details.weather_conditions} fieldKey="slip_and_fall_details.weather_conditions" onChange={updateField} />
                  <EditableField label="Footwear Description" value={extraction.slip_and_fall_details.footwear_description} fieldKey="slip_and_fall_details.footwear_description" onChange={updateField} />
                </div>
              </section>
            )}

            {/* Type-Specific: Assault */}
            {isAssault && extraction.assault_details && (
              <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-layered-sm">
                <div className="px-4 py-3 bg-gradient-to-r from-navy-50 to-transparent border-b border-gray-100">
                  <SectionHeader icon={Gavel} title="Assault / Criminal Details" status={getSectionStatus("type_specific")} />
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <EditableField label="Crime Classification" value={extraction.assault_details.crime_classification} fieldKey="assault_details.crime_classification" onChange={updateField} />
                  </div>
                  <div className="col-span-2">
                    <EditableField label="Suspect Description" value={extraction.assault_details.suspect_description} fieldKey="assault_details.suspect_description" onChange={updateField} />
                  </div>
                  <EditableField label="Suspect Relationship" value={extraction.assault_details.suspect_relationship} fieldKey="assault_details.suspect_relationship" onChange={updateField} />
                  <EditableField label="Weapon Used" value={extraction.assault_details.weapon_used} fieldKey="assault_details.weapon_used" onChange={updateField} />
                  <EditableField label="Arrest Made?" value={extraction.assault_details.arrest_made} fieldKey="assault_details.arrest_made" onChange={updateField} />
                  <EditableField label="Arrest Number" value={extraction.assault_details.arrest_number} fieldKey="assault_details.arrest_number" onChange={updateField} />
                  <div className="col-span-2">
                    <EditableField label="Charges Filed" value={extraction.assault_details.charges_filed} fieldKey="assault_details.charges_filed" onChange={updateField} />
                  </div>
                  <EditableField label="Protective Order?" value={extraction.assault_details.protective_order} fieldKey="assault_details.protective_order" onChange={updateField} />
                </div>
              </section>
            )}

            {/* Type-Specific: Dog Bite */}
            {isDogBite && extraction.dog_bite_details && (
              <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-layered-sm">
                <div className="px-4 py-3 bg-gradient-to-r from-navy-50 to-transparent border-b border-gray-100">
                  <SectionHeader icon={Dog} title="Animal / Bite Details" status={getSectionStatus("type_specific")} />
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <EditableField label="Animal Species" value={extraction.dog_bite_details.animal_species} fieldKey="dog_bite_details.animal_species" onChange={updateField} />
                  <EditableField label="Animal Breed" value={extraction.dog_bite_details.animal_breed} fieldKey="dog_bite_details.animal_breed" onChange={updateField} />
                  <div className="col-span-2">
                    <EditableField label="Animal Description" value={extraction.dog_bite_details.animal_description} fieldKey="dog_bite_details.animal_description" onChange={updateField} />
                  </div>
                  <EditableField label="Vaccination Current?" value={extraction.dog_bite_details.vaccination_current} fieldKey="dog_bite_details.vaccination_current" onChange={updateField} />
                  <EditableField label="Quarantine Ordered?" value={extraction.dog_bite_details.quarantine_ordered} fieldKey="dog_bite_details.quarantine_ordered" onChange={updateField} />
                  <EditableField label="Leash Law Violation?" value={extraction.dog_bite_details.leash_law_violation} fieldKey="dog_bite_details.leash_law_violation" onChange={updateField} />
                  <EditableField label="Prior Bite History?" value={extraction.dog_bite_details.prior_bite_history} fieldKey="dog_bite_details.prior_bite_history" onChange={updateField} />
                  <div className="col-span-2">
                    <EditableField label="Bite Location on Body" value={extraction.dog_bite_details.bite_location_on_body} fieldKey="dog_bite_details.bite_location_on_body" onChange={updateField} />
                  </div>
                </div>
              </section>
            )}

            {/* SOL */}
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-layered-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-navy-50 to-transparent border-b border-gray-100">
                <SectionHeader icon={Calendar} title="Statute of Limitations" status="complete" />
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
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
                          const d = new Date(extraction.accident_details.date);
                          d.setFullYear(d.getFullYear() + 3);
                          return d.toISOString().split("T")[0];
                        })()
                      : null
                  }
                  fieldKey="_sol_3yr_display"
                  onChange={() => {}}
                />
              </div>
              <p className="text-xs text-gray-500 px-4 pb-3">
                Note: Client requested 8-year SOL. Standard NY PI SOL is 3 years. Both will be calendared.
              </p>
            </section>
          </div>

          {/* Preview Links */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gradient-to-r from-navy-50 to-transparent flex items-center gap-3">
            <span className="text-xs text-navy-600 font-medium">Preview:</span>
            <button
              onClick={() => {
                sessionStorage.setItem("extractionResult", JSON.stringify({ extraction }));
                router.push("/retainer-preview");
              }}
              className="text-xs text-navy-700 hover:text-navy-900 font-medium underline underline-offset-2"
            >
              Retainer Agreement
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => {
                sessionStorage.setItem("extractionResult", JSON.stringify({ extraction }));
                router.push("/email-preview");
              }}
              className="text-xs text-navy-700 hover:text-navy-900 font-medium underline underline-offset-2"
            >
              Client Email
            </button>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50 space-y-3">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => router.push("/")}
                className="sm:flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Re-extract
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                aria-busy={processing}
                className={`sm:flex-[2] py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  processing
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5"
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" />
                    Approve & Process in Clio
                    <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-normal bg-emerald-700/50 rounded">
                      {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent) ? "\u2318" : "Ctrl"}{"\u23CE"}
                    </kbd>
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
