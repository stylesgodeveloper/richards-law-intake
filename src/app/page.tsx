"use client";

import { useState, useCallback } from "react";
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
  Play,
  ChevronRight,
  Database,
  FileCheck,
  Users,
  TrendingUp,
} from "lucide-react";
import { DEMO_REPORTS, DEMO_EXTRACTIONS } from "@/lib/demo-data";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [matterId, setMatterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

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
    if (!matterId.trim()) {
      setError("Please enter the Clio Matter ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setLoadingMessage("Encoding PDF...");
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      sessionStorage.setItem("uploadedPdf", base64);
      sessionStorage.setItem("uploadedPdfName", file.name);

      setLoadingMessage("AI is reading the police report...");
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
      sessionStorage.setItem("matterId", matterId.trim());

      setLoadingMessage("Extraction complete! Redirecting...");
      router.push("/verify");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleDemoSelect = (reportId: string) => {
    const extraction = DEMO_EXTRACTIONS[reportId];
    if (!extraction) return;

    sessionStorage.setItem(
      "extractionResult",
      JSON.stringify({ extraction })
    );
    sessionStorage.setItem("matterId", "DEMO-001");
    sessionStorage.removeItem("uploadedPdf");
    sessionStorage.setItem("uploadedPdfName", `${reportId}.pdf`);
    sessionStorage.setItem("demoMode", "true");
    sessionStorage.setItem("demoReportId", reportId);
    router.push("/verify");
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-3 sm:space-y-4 pt-2 sm:pt-4">
        <div className="inline-flex items-center gap-2 bg-gold-50 border border-gold-200 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-gold-700 font-medium">
          <Zap className="w-3.5 h-3.5" aria-hidden="true" />
          Intake time reduced from 45 min to under 2 min
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-900 tracking-tight text-balance">
          AI-Powered Case Intake
        </h1>
        <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed px-2">
          Upload a NYC Police Accident Report. AI extracts every detail, your
          team verifies, and the retainer agreement is generated automatically
          in Clio Manage.
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 max-w-4xl mx-auto" role="list" aria-label="Workflow steps">
        {[
          { icon: Upload, label: "Upload PDF", color: "text-blue-600 bg-blue-50" },
          { icon: Brain, label: "AI Extracts", color: "text-purple-600 bg-purple-50" },
          { icon: Shield, label: "Human Verifies", color: "text-amber-600 bg-amber-50" },
          { icon: Database, label: "Clio Updated", color: "text-emerald-600 bg-emerald-50" },
          { icon: FileCheck, label: "Retainer Generated", color: "text-navy-600 bg-navy-50" },
          { icon: Mail, label: "Client Emailed", color: "text-rose-600 bg-rose-50" },
        ].map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 sm:gap-2 relative" role="listitem">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${step.color}`}>
              <step.icon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-gray-600 text-center leading-tight">
              {step.label}
            </span>
            {i < 5 && (
              <ChevronRight className="hidden md:block absolute right-[-14px] top-3 w-4 h-4 text-gray-300" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {/* Main Content: Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Left: Upload */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900">
              Process a Report
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full">
              Live Mode
            </span>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-gold-400 bg-gold-50"
                : file
                ? "border-emerald-300 bg-emerald-50"
                : "border-gray-200 hover:border-gold-400 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-medium text-emerald-700">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB &middot; Click to
                  replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? "Drop the PDF here..."
                    : "Drag & drop a police report PDF"}
                </p>
                <p className="text-xs text-gray-400">
                  MV-104AN forms &middot; Max 20MB
                </p>
              </div>
            )}
          </div>

          {/* Matter ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Clio Matter ID
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
                placeholder="e.g., 2415839201"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none"
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
            disabled={loading || !file || !matterId.trim()}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              loading || !file || !matterId.trim()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-navy-900 text-white hover:bg-navy-800 shadow-md hover:shadow-lg"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingMessage}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Process Report
              </>
            )}
          </button>
        </div>

        {/* Right: Demo Mode */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900">
              Try a Demo Report
            </h2>
            <span className="text-xs bg-purple-50 text-purple-700 font-medium px-2.5 py-1 rounded-full">
              Instant Preview
            </span>
          </div>
          <p className="text-sm text-gray-500">
            See the full extraction and verification flow instantly with one of
            5 pre-processed police reports covering all case types.
          </p>

          <div className="space-y-2.5">
            {DEMO_REPORTS.map((report) => (
              <button
                key={report.id}
                onClick={() => handleDemoSelect(report.id)}
                className="w-full text-left p-3.5 rounded-xl border border-gray-200 hover:border-gold-400 hover:bg-gold-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-navy-800 group-hover:text-navy-900">
                        {report.label}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          report.injured > 0
                            ? "bg-red-100 text-red-700"
                            : report.type === "Pedestrian" || report.type === "Bicyclist"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {report.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {report.client} &middot; {report.subtitle}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 transition-colors flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ROI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
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
            className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center"
          >
            <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gold-500 mx-auto mb-1.5 sm:mb-2" aria-hidden="true" />
            <p className="text-xl sm:text-2xl font-bold text-navy-900">{item.stat}</p>
            <p className="text-[10px] sm:text-xs font-medium text-gray-600">{item.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Bottom Links */}
      <nav className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-sm" aria-label="Additional resources">
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
