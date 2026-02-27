"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  CheckCircle2,
  Database,
  FileText,
  Calendar,
  Mail,
  Loader2,
  Circle,
  ArrowLeft,
  ExternalLink,
  Clock,
} from "lucide-react";

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "in_progress" | "completed" | "error";
  detail?: string;
}

export default function StatusPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([
    {
      id: "verify",
      label: "Data Verified",
      icon: <CheckCircle2 className="w-5 h-5" />,
      status: "completed",
      detail: "All fields reviewed and approved",
    },
    {
      id: "clio_update",
      label: "Clio Matter Updated",
      icon: <Database className="w-5 h-5" />,
      status: "in_progress",
      detail: "Updating custom fields...",
    },
    {
      id: "stage_change",
      label: "Stage → Retainer Ready",
      icon: <Brain className="w-5 h-5" />,
      status: "pending",
      detail: "Triggers document automation",
    },
    {
      id: "retainer",
      label: "Retainer Generated",
      icon: <FileText className="w-5 h-5" />,
      status: "pending",
      detail: "Via Clio document automation",
    },
    {
      id: "calendar",
      label: "SOL Calendar Entry",
      icon: <Calendar className="w-5 h-5" />,
      status: "pending",
      detail: "8-year + 3-year SOL dates",
    },
    {
      id: "email",
      label: "Client Email Sent",
      icon: <Mail className="w-5 h-5" />,
      status: "pending",
      detail: "With retainer PDF + Calendly link",
    },
  ]);

  const [clientName, setClientName] = useState("");
  const [matterId, setMatterId] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("verifiedData");
    const storedMatter = sessionStorage.getItem("matterId");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const ext = data.extraction;
        setClientName(
          ext.client_party.full_name ||
            `${ext.client_party.first_name} ${ext.client_party.last_name}`
        );
      } catch {}
    }
    if (storedMatter) setMatterId(storedMatter);
  }, []);

  // Simulated progress (in production, poll Make.com or use webhooks)
  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "clio_update"
              ? { ...s, status: "completed", detail: "Custom fields populated" }
              : s.id === "stage_change"
              ? { ...s, status: "in_progress", detail: "Changing stage..." }
              : s
          )
        );
      }, 2000),
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "stage_change"
              ? {
                  ...s,
                  status: "completed",
                  detail: "Stage changed → Document automation triggered",
                }
              : s.id === "retainer"
              ? { ...s, status: "in_progress", detail: "Generating from template..." }
              : s
          )
        );
      }, 4000),
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "retainer"
              ? {
                  ...s,
                  status: "completed",
                  detail: "Retainer Agreement PDF created in Clio",
                }
              : s.id === "calendar"
              ? { ...s, status: "in_progress", detail: "Creating calendar entries..." }
              : s
          )
        );
      }, 7000),
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "calendar"
              ? {
                  ...s,
                  status: "completed",
                  detail: "8-year & 3-year SOL dates calendared",
                }
              : s.id === "email"
              ? {
                  ...s,
                  status: "in_progress",
                  detail: "Composing personalized email...",
                }
              : s
          )
        );
      }, 9000),
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "email"
              ? {
                  ...s,
                  status: "completed",
                  detail:
                    "Email sent with retainer PDF + seasonal Calendly link",
                }
              : s
          )
        );
      }, 12000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const allDone = completedCount === steps.length;

  function StepIcon({ status }: { status: string }) {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      case "in_progress":
        return <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />;
      case "error":
        return <Circle className="w-6 h-6 text-red-500" />;
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Processing Pipeline
          </h1>
          <p className="text-sm text-gray-500">
            {clientName && `${clientName} — `}Matter {matterId}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-navy-800">
            {allDone ? "All steps completed!" : "Processing..."}
          </span>
          <span className="text-sm text-gray-500">
            {completedCount}/{steps.length} steps
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${(completedCount / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                step.status === "in_progress" ? "bg-gold-50" : ""
              } ${step.status === "completed" ? "bg-emerald-50/30" : ""}`}
            >
              <div className="flex-shrink-0">
                <StepIcon status={step.status} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    step.status === "completed"
                      ? "text-emerald-800"
                      : step.status === "in_progress"
                      ? "text-navy-800"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                {step.detail && (
                  <p
                    className={`text-xs mt-0.5 ${
                      step.status === "completed"
                        ? "text-emerald-600"
                        : step.status === "in_progress"
                        ? "text-gold-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.detail}
                  </p>
                )}
              </div>
              <div className="text-gray-300">{step.icon}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Card */}
      {allDone && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-4 animate-slide-up">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-emerald-800">
              Intake Complete!
            </h2>
            <p className="text-sm text-emerald-600 mt-1">
              Retainer agreement generated, SOL calendared, and personalized
              email sent to {clientName || "the client"}.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-sm font-medium bg-white border border-emerald-300 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Process Another
            </button>
            <a
              href="https://app.clio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium bg-emerald-600 rounded-lg text-white hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              View in Clio
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
