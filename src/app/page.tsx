"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap,
  Clock,
  Shield,
  Brain,
  Mail,
  Calendar,
  ArrowRight,
  ChevronRight,
  Database,
  FileCheck,
  Users,
  TrendingUp,
  Car,
  Footprints,
  Gavel,
  BarChart3,
  ScanLine,
  Target,
} from "lucide-react";
import { DEMO_REPORTS, DEMO_EXTRACTIONS } from "@/lib/demo-data";
import { REPORT_TYPE_COLORS } from "@/lib/constants";

const PROCESSING_ANIMATION_STEPS = [
  { id: "upload", label: "Uploading PDF", icon: Upload, duration: 800 },
  { id: "scan", label: "Scanning document", icon: ScanLine, duration: 1500 },
  { id: "detect", label: "Detecting report type", icon: FileCheck, duration: 1000 },
  { id: "extract", label: "AI extracting fields", icon: Brain, duration: 0 },
];

function ProcessingOverlay({ currentStep, reportType }: { currentStep: number; reportType?: string }) {
  const messages = [
    "Reading police report header...",
    "Scanning document structure...",
    "Detecting report type...",
    "Extracting structured data with Claude AI...",
  ];

  return (
    <div className="space-y-5 py-4">
      {/* Animated rings */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-gold-200 animate-pipeline-ping opacity-30" />
        <div className="absolute inset-2 rounded-full border-2 border-gold-300 animate-pipeline-ping opacity-40" style={{ animationDelay: "0.3s" }} />
        <div className="absolute inset-0 rounded-full bg-gold-50 flex items-center justify-center">
          <Brain className="w-8 h-8 text-gold-600" />
        </div>
      </div>

      {/* Status message */}
      <p className="text-sm text-gray-500 text-center font-medium">
        {messages[Math.min(currentStep, messages.length - 1)]}
      </p>

      {/* Step indicators */}
      <div className="space-y-2.5">
        {PROCESSING_ANIMATION_STEPS.map((step, i) => {
          const status = i < currentStep ? "completed" : i === currentStep ? "active" : "pending";
          const Icon = step.icon;
          return (
            <div key={step.id} className={`flex items-center gap-3 transition-all duration-500 ${
              status === "pending" ? "opacity-30" : "opacity-100"
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                status === "completed" ? "bg-emerald-100 text-emerald-600" :
                status === "active" ? "bg-gold-100 text-gold-600" :
                "bg-gray-100 text-gray-400"
              }`}>
                {status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : status === "active" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  status === "completed" ? "text-emerald-700" :
                  status === "active" ? "text-navy-800" :
                  "text-gray-400"
                }`}>
                  {step.label}
                  {status === "completed" && step.id === "detect" && reportType && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      REPORT_TYPE_COLORS[reportType] || "bg-blue-100 text-blue-700"
                    }`}>
                      {reportType === "vehicle_accident" ? "Vehicle Accident" :
                       reportType === "slip_and_fall" ? "Slip & Fall" :
                       reportType === "assault" ? "Assault" :
                       reportType === "dog_bite" ? "Dog Bite" : "Detected"}
                    </span>
                  )}
                </p>
              </div>
              {status === "completed" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-gold-400 to-gold-600 rounded-full animate-progress-sweep" />
      </div>

      <p className="text-xs text-gray-400 text-center">
        {currentStep < 3 ? "Preparing document..." : "Claude AI is reading the report — this may take up to 60 seconds"}
      </p>
    </div>
  );
}

const REPORT_TYPE_ICONS: Record<string, typeof Car> = {
  vehicle_accident: Car,
  slip_and_fall: Footprints,
  assault: Gavel,
};

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [matterId, setMatterId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload a police report PDF.");
      return;
    }

    setLoading(true);
    setProcessingStep(0);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      sessionStorage.setItem("uploadedPdf", base64);
      sessionStorage.setItem("uploadedPdfName", file.name);

      setProcessingStep(1);
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStep(2);
      await new Promise((r) => setTimeout(r, 500));

      setProcessingStep(3);

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdf_base64: base64,
          matter_id: matterId.trim(),
          file_name: file.name,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `Extraction failed (${response.status})`
        );
      }

      const data = await response.json();
      sessionStorage.setItem("extractionResult", JSON.stringify(data));
      sessionStorage.setItem("matterId", matterId.trim() || "auto");
      sessionStorage.setItem("clientEmail", clientEmail.trim());

      router.push("/verify");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setLoading(false);
      setProcessingStep(0);
    }
  };

  const handleDemoSelect = (reportId: string) => {
    const extraction = DEMO_EXTRACTIONS[reportId];
    if (!extraction) return;

    sessionStorage.setItem(
      "extractionResult",
      JSON.stringify({ extraction })
    );
    sessionStorage.setItem("matterId", "auto");
    sessionStorage.setItem("clientEmail", clientEmail.trim());
    sessionStorage.removeItem("uploadedPdf");
    sessionStorage.setItem("uploadedPdfName", `${reportId}.pdf`);
    sessionStorage.setItem("demoMode", "true");
    sessionStorage.setItem("demoReportId", reportId);
    router.push("/verify");
  };

  return (
    <div className="space-y-0">
      {/* ─── Dark Gradient Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 sm:-mt-8 mb-10">
        <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white">
          <div className="absolute inset-0 bg-grid-pattern" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="text-center space-y-5 sm:space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-500/10 border border-gold-500/20 rounded-full">
                <Zap className="w-3.5 h-3.5 text-gold-400" aria-hidden="true" />
                <span className="text-xs font-medium text-gold-300">
                  Intake time reduced from 45 min to under 2 min
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Police Report to Clio
                <br />
                <span className="text-gold-400">in 90 Seconds</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-navy-200 max-w-2xl mx-auto leading-relaxed">
                Upload any police or incident report. AI extracts every detail, your
                team verifies, and the case is processed automatically in Clio Manage.
              </p>

              {/* Supported Report Types */}
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: "Vehicle Accidents", icon: Car, color: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
                  { label: "Slip & Fall", icon: Footprints, color: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
                  { label: "Assault / Battery", icon: Gavel, color: "bg-red-500/10 text-red-300 border-red-500/20" },
                ].map((rt) => (
                  <span key={rt.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${rt.color}`}>
                    <rt.icon className="w-3 h-3" aria-hidden="true" />
                    {rt.label}
                  </span>
                ))}
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center items-center gap-6 pt-2">
                {[
                  { icon: Target, text: "95%+ Accuracy" },
                  { icon: Clock, text: "~2 min per case" },
                  { icon: Shield, text: "Human-Verified" },
                  { icon: CheckCircle2, text: "100% Automated Post-Verify" },
                ].map((t) => (
                  <div key={t.text} className="flex items-center gap-1.5 text-xs text-navy-300">
                    <t.icon className="w-3.5 h-3.5 text-navy-400" />
                    {t.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Workflow Steps ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 max-w-4xl mx-auto mb-10 stagger-children" role="list" aria-label="Workflow steps">
        {[
          { icon: Upload, label: "Upload PDF", color: "text-blue-600 bg-blue-50 group-hover:bg-blue-100" },
          { icon: Brain, label: "AI Extracts", color: "text-purple-600 bg-purple-50 group-hover:bg-purple-100" },
          { icon: Shield, label: "Human Verifies", color: "text-amber-600 bg-amber-50 group-hover:bg-amber-100" },
          { icon: Database, label: "Clio Updated", color: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100" },
          { icon: FileCheck, label: "Retainer Generated", color: "text-navy-600 bg-navy-50 group-hover:bg-navy-100" },
          { icon: Mail, label: "Client Emailed", color: "text-rose-600 bg-rose-50 group-hover:bg-rose-100" },
        ].map((step, i) => (
          <div key={i} className="group flex flex-col items-center gap-1.5 sm:gap-2 relative" role="listitem">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-colors ${step.color}`}>
              <step.icon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-gray-600 text-center leading-tight">
              {step.label}
            </span>
            {i < 5 && (
              <ChevronRight className="hidden md:block absolute right-[-14px] top-3.5 w-4 h-4 text-gray-300" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {/* ─── Main Content: Two columns ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-10">
        {/* Left: Upload */}
        <div className="bg-white rounded-2xl shadow-layered border border-gray-200/80 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900">
              Process a Report
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full border border-emerald-200">
              Live Mode
            </span>
          </div>

          {loading ? (
            <ProcessingOverlay currentStep={processingStep} />
          ) : (
            <>
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? "border-gold-400 bg-gold-50 scale-[1.02]"
                    : file
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-gray-200 hover:border-gold-400 hover:bg-gold-50/30"
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-700">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB &middot; Click to replace
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      {isDragActive
                        ? "Drop the PDF here..."
                        : "Drag & drop a police report PDF"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Vehicle accidents, slip & fall, assault &middot; Max 20MB
                    </p>
                  </div>
                )}
              </div>

              {/* Matter ID */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">
                  Clio Matter ID <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={matterId}
                    onChange={(e) => {
                      setMatterId(e.target.value);
                      setError(null);
                    }}
                    placeholder="Leave blank to auto-create in Clio"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-shadow"
                  />
                </div>
              </div>

              {/* Client Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">
                  Client Email <span className="text-gray-400 font-normal normal-case">(for retainer delivery)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => {
                      setClientEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="client@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-shadow"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 animate-slide-up">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !file}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  loading || !file || !matterId.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-navy-900 text-white hover:bg-navy-800 shadow-lg shadow-navy-900/20 hover:shadow-xl hover:shadow-navy-900/30 hover:-translate-y-0.5"
                }`}
              >
                <Zap className="w-4 h-4" />
                Process Report
              </button>
            </>
          )}
        </div>

        {/* Right: Demo Mode */}
        <div className="bg-white rounded-2xl shadow-layered border border-gray-200/80 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900">
              Try a Demo Report
            </h2>
            <span className="text-xs bg-purple-50 text-purple-700 font-medium px-2.5 py-1 rounded-full border border-purple-200">
              Instant Preview
            </span>
          </div>
          <p className="text-sm text-gray-500">
            See the full extraction and verification flow instantly with
            pre-processed reports covering vehicle accidents, slip & fall, and assault.
          </p>

          <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
            {DEMO_REPORTS.map((report) => {
              const TypeIcon = REPORT_TYPE_ICONS[report.reportType] || FileText;
              return (
                <button
                  key={report.id}
                  onClick={() => handleDemoSelect(report.id)}
                  className="w-full text-left p-3.5 rounded-xl border border-gray-200 hover:border-gold-400 hover:shadow-layered-sm transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gold-50 transition-colors">
                          <TypeIcon className="w-3 h-3 text-gray-500 group-hover:text-gold-600 transition-colors" />
                        </div>
                        <span className="text-sm font-semibold text-navy-800 group-hover:text-navy-900">
                          {report.label}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            report.reportType === "assault"
                              ? "bg-red-100 text-red-700"
                              : report.reportType === "slip_and_fall"
                              ? "bg-amber-100 text-amber-700"
                              : report.injured > 0
                              ? "bg-red-100 text-red-700"
                              : report.type === "Pedestrian" || report.type === "Bicyclist"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {report.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 ml-8">
                        {report.client} &middot; {report.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── ROI Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-8 stagger-children">
        {[
          {
            icon: Clock,
            stat: "~2 min",
            label: "Per case intake",
            detail: "Down from 45 min",
          },
          {
            icon: TrendingUp,
            stat: "37.5 hrs",
            label: "Saved per month",
            detail: "At 50 cases/month",
          },
          {
            icon: Users,
            stat: "95%+",
            label: "Extraction accuracy",
            detail: "Human-verified",
          },
          {
            icon: FileCheck,
            stat: "100%",
            label: "Automated post-verify",
            detail: "Zero manual steps",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200/80 p-4 text-center shadow-layered-sm hover:shadow-layered transition-shadow duration-300"
          >
            <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center mx-auto mb-2">
              <item.icon className="w-4 h-4 text-gold-500" aria-hidden="true" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-navy-900">{item.stat}</p>
            <p className="text-[10px] sm:text-xs font-medium text-gray-600 mt-0.5">{item.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* ─── Bottom Links ───────────────────────────────────────────────── */}
      <nav className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-sm pb-4" aria-label="Additional resources">
        <a
          href="/dashboard"
          className="text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1 transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
          Analytics Dashboard
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
        <span className="hidden sm:inline text-gray-300" aria-hidden="true">|</span>
        <a
          href="/architecture"
          className="text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1 transition-colors"
        >
          View System Architecture
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
        <span className="hidden sm:inline text-gray-300" aria-hidden="true">|</span>
        <a
          href="/setup"
          className="text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1 transition-colors"
        >
          Clio Setup Guide
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </nav>
    </div>
  );
}
