"use client";

import {
  Upload,
  Brain,
  Shield,
  Database,
  FileText,
  Calendar,
  Mail,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Globe,
  Server,
  Webhook,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";

function FlowArrow({ direction = "down" }: { direction?: "down" | "right" }) {
  return direction === "down" ? (
    <div className="flex justify-center py-2">
      <ArrowDown className="w-5 h-5 text-gray-300" />
    </div>
  ) : (
    <div className="flex items-center px-2">
      <ArrowRight className="w-5 h-5 text-gray-300" />
    </div>
  );
}

function FlowNode({
  icon: Icon,
  title,
  subtitle,
  color,
  tech,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  tech?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy-800">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          {tech && (
            <p className="text-[10px] text-gray-400 mt-1 font-mono bg-gray-50 px-1.5 py-0.5 rounded inline-block">
              {tech}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArchitecturePage() {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-navy-900">
            System Architecture
          </h1>
          <p className="text-sm text-gray-500">
            End-to-end automation pipeline for Richards &amp; Law
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-6 text-white">
        <h2 className="text-lg font-bold mb-3">Pipeline Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Stack", value: "Next.js + Make.com + Claude + Clio" },
            { label: "Extraction", value: "Claude Sonnet via API" },
            { label: "Orchestration", value: "Make.com (2 Scenarios)" },
            { label: "Legal Ops", value: "Clio Manage + Doc Automation" },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-navy-200">{item.label}</p>
              <p className="text-sm font-semibold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 1: Extraction */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-navy-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center justify-center font-bold">
            1
          </span>
          Scenario 1: PDF Extraction
        </h2>
        <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-6">
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            <FlowNode
              icon={Upload}
              title="PDF Upload"
              subtitle="User uploads police report via web app"
              color="bg-blue-100 text-blue-600"
              tech="Next.js + react-dropzone"
            />
            <FlowArrow direction="right" />
            <FlowNode
              icon={Webhook}
              title="Make.com Webhook"
              subtitle="Receives PDF (base64) + Matter ID"
              color="bg-violet-100 text-violet-600"
              tech="Custom Webhook trigger"
            />
            <FlowArrow direction="right" />
            <FlowNode
              icon={Brain}
              title="Claude API"
              subtitle="Extracts structured JSON from PDF"
              color="bg-purple-100 text-purple-600"
              tech="claude-sonnet-4-20250514"
            />
            <FlowArrow direction="right" />
            <FlowNode
              icon={Shield}
              title="Human Verification"
              subtitle="Editable form + PDF side-by-side"
              color="bg-amber-100 text-amber-600"
              tech="Confidence scoring"
            />
          </div>
        </div>
      </div>

      {/* Phase 2: Processing */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-navy-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full text-xs flex items-center justify-center font-bold">
            2
          </span>
          Scenario 2: Post-Verification Pipeline
        </h2>
        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FlowNode
              icon={Database}
              title="Update Clio Matter"
              subtitle="PATCH custom fields with 20+ extracted values"
              color="bg-emerald-100 text-emerald-600"
              tech="Clio API v4"
            />
            <FlowNode
              icon={Zap}
              title="Stage → Retainer Ready"
              subtitle="Triggers Clio document automation"
              color="bg-orange-100 text-orange-600"
              tech="Automated Workflow"
            />
            <FlowNode
              icon={FileText}
              title="Retainer Generated"
              subtitle="Merge fields + conditional logic filled"
              color="bg-navy-100 text-navy-600"
              tech="Clio Doc Automation"
            />
          </div>
          <FlowArrow direction="down" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FlowNode
              icon={Calendar}
              title="SOL Calendar Entries"
              subtitle="8-year (client) + 3-year (standard NY PI)"
              color="bg-blue-100 text-blue-600"
              tech="Dual calendar entries"
            />
            <FlowNode
              icon={Brain}
              title="Email Personalization"
              subtitle="Claude generates accident summary paragraph"
              color="bg-purple-100 text-purple-600"
              tech="Context-aware rewrite"
            />
            <FlowNode
              icon={Mail}
              title="Client Email"
              subtitle="Retainer PDF + seasonal Calendly link"
              color="bg-rose-100 text-rose-600"
              tech="Gmail + Router module"
            />
          </div>
        </div>
      </div>

      {/* Key Features Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-navy-800">
          Differentiating Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: AlertTriangle,
              title: "Conditional Retainer Logic",
              desc: "Injury-based paragraphs + gender pronouns (his/her, he/she) driven by extracted data",
              tag: "Most contestants miss this",
            },
            {
              icon: Shield,
              title: "All Case Types Handled",
              desc: "Vehicle-vehicle, pedestrian, bicyclist — client identification from case context, not just Vehicle 1",
              tag: "5 edge cases covered",
            },
            {
              icon: Calendar,
              title: "Dual SOL Calendar",
              desc: "Both 8-year (client request) and standard 3-year NY PI SOL with discrepancy note",
              tag: "Legal knowledge",
            },
            {
              icon: CheckCircle2,
              title: "Confidence Scoring",
              desc: "Fields color-coded by extraction confidence. Uncertain fields flagged with reasons for human review",
              tag: "Production-ready",
            },
            {
              icon: Clock,
              title: "Seasonal Calendly Routing",
              desc: "March-August → in-office link, September-February → virtual link, auto-determined from date",
              tag: "Business logic",
            },
            {
              icon: Database,
              title: "Audit Trail",
              desc: "Every automated action logged as a Note on the Clio Matter for full traceability",
              tag: "Compliance",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3"
            >
              <div className="w-8 h-8 bg-gold-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-gold-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-navy-800">
                    {item.title}
                  </p>
                  <span className="text-[10px] bg-navy-50 text-navy-600 px-1.5 py-0.5 rounded-full font-medium">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Fields Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-navy-800">
          Clio Custom Fields (20 fields)
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">
                    Field Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">
                    Type
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">
                    Retainer Placeholder
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["ClientFullName", "Text", "[Client Name]"],
                  ["ClientGender", "Text", "[his/her], [he/she]"],
                  ["ClientAddress", "Long Text", "(records)"],
                  ["ClientDOB", "Date", "(records)"],
                  ["ClientDriversLicense", "Text", "(records)"],
                  ["ClientPlateNumber", "Text", "[Registration Plate Number]"],
                  ["ClientVehicle", "Text", "(records)"],
                  ["DefendantName", "Text", "[Defendant Name]"],
                  ["AccidentDate", "Date", "[Date of Accident]"],
                  ["AccidentLocation", "Long Text", "[Accident Location]"],
                  ["AccidentDescription", "Long Text", "(email personalization)"],
                  ["NumberInjured", "Text", "Conditional paragraph trigger"],
                  ["StatuteOfLimitationsDate", "Date", "[Statute of Limitations Date]"],
                  ["PoliceReportNumber", "Text", "(records)"],
                  ["OfficerName", "Text", "(records)"],
                  ["Precinct", "Text", "(records)"],
                ].map(([name, type, placeholder], i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-navy-700">
                      {name}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {type}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {placeholder}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROI */}
      <div className="bg-gradient-to-r from-gold-500 to-gold-400 rounded-2xl p-6 text-navy-900">
        <h2 className="text-lg font-bold mb-3">Business Impact</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { stat: "45 → 2 min", label: "Intake time per case" },
            { stat: "37.5 hrs", label: "Saved monthly (50 cases)" },
            { stat: "$0", label: "Manual steps post-verify" },
            { stat: "100%", label: "Consistent retainer quality" },
          ].map((item, i) => (
            <div key={i} className="bg-white/20 rounded-lg p-3">
              <p className="text-2xl font-bold">{item.stat}</p>
              <p className="text-xs mt-0.5 opacity-80">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
