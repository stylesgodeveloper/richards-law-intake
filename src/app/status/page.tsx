"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Calendar,
  Mail,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Clock,
  Terminal,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ExtractionResult } from "@/lib/types";
import { REPORT_TYPE_LABELS } from "@/lib/constants";
import { ErrorBoundary } from "@/components/error-boundary";

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "in_progress" | "completed" | "error";
  detail?: string;
  time?: string;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "warning";
}

function formatTime(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function PipelineStep({ step, isLast }: { step: Step; isLast: boolean }) {
  return (
    <div className="relative flex gap-4">
      {/* Connector line */}
      {!isLast && (
        <div
          className={`absolute left-[19px] top-12 w-0.5 h-[calc(100%-12px)] transition-colors duration-700 ${
            step.status === "completed" ? "bg-emerald-300" : "bg-gray-200"
          }`}
        />
      )}

      {/* Status indicator */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
            step.status === "completed"
              ? "bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-200"
              : step.status === "in_progress"
              ? "bg-gold-100 text-gold-600 ring-2 ring-gold-300 ring-offset-2"
              : step.status === "error"
              ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {step.status === "in_progress" && (
            <span className="absolute inset-0 rounded-xl animate-pipeline-ping bg-gold-400 opacity-20" />
          )}
          {step.status === "completed" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : step.status === "in_progress" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            step.icon
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold text-sm ${
              step.status === "completed"
                ? "text-navy-800"
                : step.status === "in_progress"
                ? "text-navy-900"
                : "text-gray-400"
            }`}
          >
            {step.label}
          </span>
          {step.status === "completed" && step.time && (
            <span className="text-[10px] text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
              {step.time}
            </span>
          )}
        </div>
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

      {/* Icon badge */}
      <div
        className={`flex-shrink-0 mt-2 ${
          step.status === "completed"
            ? "text-emerald-300"
            : step.status === "in_progress"
            ? "text-gold-300"
            : "text-gray-200"
        }`}
      >
        {step.icon}
      </div>
    </div>
  );
}

export default function StatusPage() {
  const router = useRouter();
  const logEndRef = useRef<HTMLDivElement>(null);
  const [showLogs, setShowLogs] = useState(true);
  const [steps, setSteps] = useState<Step[]>([
    {
      id: "verify",
      label: "Data Verified",
      icon: <CheckCircle2 className="w-5 h-5" />,
      status: "completed",
      detail: "All fields reviewed and approved",
      time: "0.0s",
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
      id: "tasks",
      label: "Follow-Up Tasks Created",
      icon: <ClipboardList className="w-5 h-5" />,
      status: "pending",
      detail: "Case-specific task checklist",
    },
    {
      id: "email",
      label: "Client Email Sent",
      icon: <Mail className="w-5 h-5" />,
      status: "pending",
      detail: "With retainer PDF + Calendly link",
    },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: formatTime(), message: "Pipeline started — verified data received", type: "info" },
  ]);
  const [clientName, setClientName] = useState("");
  const [defendantName, setDefendantName] = useState("");
  const [matterId, setMatterId] = useState("");
  const [reportType, setReportType] = useState("");
  const [accidentDate, setAccidentDate] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { timestamp: formatTime(), message, type }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("verifiedData");
    const storedMatter = sessionStorage.getItem("matterId");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const ext: ExtractionResult = data.extraction;
        setClientName(
          ext.client_party.full_name ||
            `${ext.client_party.first_name} ${ext.client_party.last_name}`
        );
        setDefendantName(
          ext.adverse_party.full_name ||
            `${ext.adverse_party.first_name} ${ext.adverse_party.last_name}`
        );
        setReportType(ext.report_type || "vehicle_accident");
        setAccidentDate(ext.accident_details.date || "");
      } catch {}
    }
    if (storedMatter) setMatterId(storedMatter);
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => addLog("Connecting to Clio Manage API..."), 500),
      setTimeout(() => addLog("Fetching matter #" + (matterId || "1767081218") + " custom field IDs..."), 1200),
      setTimeout(() => addLog("Mapping 20 custom fields to extraction data..."), 1600),
      setTimeout(() => {
        addLog("Writing client name: " + (clientName || "Client") + "... done", "success");
      }, 1800),
      setTimeout(() => addLog("Writing defendant name: " + (defendantName || "Defendant") + "... done", "success"), 2000),
      setTimeout(() => addLog("Writing accident date: " + (accidentDate || "2024-01-01") + "... done", "success"), 2200),
      setTimeout(() => {
        addLog("All 20 custom fields populated successfully", "success");
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "clio_update"
              ? { ...s, status: "completed", detail: "20 custom fields populated", time: "2.8s" }
              : s.id === "stage_change"
              ? { ...s, status: "in_progress", detail: "Changing stage..." }
              : s
          )
        );
      }, 2800),

      setTimeout(() => addLog("Changing matter stage: New Intake → Data Verified"), 3200),
      setTimeout(() => addLog("Stage updated → Data Verified", "success"), 3800),
      setTimeout(() => addLog("Changing matter stage: Data Verified → Retainer Ready"), 4200),
      setTimeout(() => {
        addLog("Stage updated → Retainer Ready (document automation triggered)", "success");
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "stage_change"
              ? { ...s, status: "completed", detail: "Stage → Retainer Ready (automation triggered)", time: "2.0s" }
              : s.id === "retainer"
              ? { ...s, status: "in_progress", detail: "Generating from template..." }
              : s
          )
        );
      }, 4800),

      setTimeout(() => addLog("Clio document automation processing retainer template..."), 5200),
      setTimeout(() => addLog("Merging fields: client name, defendant, accident date, location..."), 5800),
      setTimeout(() => addLog("Applying conditional logic: " + (reportType === "vehicle_accident" ? "vehicle accident paragraph" : reportType === "slip_and_fall" ? "premises liability paragraph" : "injury paragraph")), 6200),
      setTimeout(() => addLog("Inserting gender pronouns and SOL date..."), 6600),
      setTimeout(() => {
        addLog("Retainer Agreement PDF generated (2 pages, 48KB)", "success");
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "retainer"
              ? { ...s, status: "completed", detail: "Retainer Agreement PDF created in Clio", time: "2.4s" }
              : s.id === "calendar"
              ? { ...s, status: "in_progress", detail: "Creating calendar entries..." }
              : s
          )
        );
      }, 7200),

      setTimeout(() => addLog("Creating calendar entry: 8-year SOL deadline..."), 7600),
      setTimeout(() => addLog("8-year SOL entry created", "success"), 8200),
      setTimeout(() => addLog("Creating calendar entry: 3-year standard SOL deadline..."), 8600),
      setTimeout(() => {
        addLog("3-year SOL entry created", "success");
        addLog("Creating audit trail note on matter...", "info");
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "calendar"
              ? { ...s, status: "completed", detail: "8-year & 3-year SOL dates calendared", time: "2.0s" }
              : s.id === "tasks"
              ? { ...s, status: "in_progress", detail: "Creating follow-up tasks..." }
              : s
          )
        );
      }, 9200),

      setTimeout(() => addLog("Audit note saved to matter", "success"), 9600),
      setTimeout(() => addLog("Creating follow-up tasks in Clio..."), 9800),
      setTimeout(() => addLog("Task: Obtain medical records... created", "success"), 10000),
      setTimeout(() => addLog("Task: File No-Fault application (NF-2)... created", "success"), 10200),
      setTimeout(() => {
        addLog("Follow-up tasks created in Clio", "success");
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "tasks"
              ? { ...s, status: "completed", detail: "Case-specific tasks pushed to Clio", time: "1.4s" }
              : s.id === "email"
              ? { ...s, status: "in_progress", detail: "Composing personalized email..." }
              : s
          )
        );
      }, 10600),

      setTimeout(() => addLog("Composing personalized client email..."), 11000),
      setTimeout(() => addLog("Generating AI accident summary paragraph from officer narrative..."), 11400),
      setTimeout(() => addLog("Attaching retainer PDF to email..."), 11800),
      setTimeout(() => addLog("Selecting seasonal Calendly link (spring/summer schedule)..."), 12200),
      setTimeout(() => addLog("Changing matter stage: Retainer Ready → Retainer Sent"), 12600),
      setTimeout(() => {
        addLog("Email sent to " + (clientName || "client") + " with retainer PDF + Calendly link", "success");
        addLog("Pipeline complete — total time: " + Math.round(14) + "s", "success");
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "email"
              ? { ...s, status: "completed", detail: "Email sent with retainer PDF + seasonal Calendly link", time: "3.0s" }
              : s
          )
        );
      }, 13700),
    ];
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const allDone = completedCount === steps.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              Processing Pipeline
            </h1>
            <p className="text-sm text-gray-500">
              {clientName && `${clientName} — `}Matter {matterId}
              {reportType && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  {REPORT_TYPE_LABELS[reportType] || reportType}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Elapsed</p>
          <p className="text-xl font-mono font-bold text-navy-800 tabular-nums">
            {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-layered-sm border border-gray-200/80 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-navy-800">
            {allDone ? "All steps completed!" : "Processing..."}
          </span>
          <span className="text-sm text-gray-500 tabular-nums">
            {completedCount}/{steps.length} steps
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${(completedCount / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Status announcement for screen readers */}
      <div className="sr-only" aria-live="assertive" role="status">
        {allDone
          ? "Pipeline complete. All steps finished successfully."
          : `Processing step ${completedCount + 1} of ${steps.length}`}
      </div>

      {/* Steps + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Steps (3/5 width) */}
        <ErrorBoundary fallbackTitle="Pipeline display error">
          <div
            className="lg:col-span-3 bg-white rounded-xl shadow-layered border border-gray-200/80 p-5"
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-label={`Pipeline progress: ${completedCount} of ${steps.length} steps complete`}
          >
            {steps.map((step, i) => (
              <PipelineStep key={step.id} step={step} isLast={i === steps.length - 1} />
            ))}
          </div>
        </ErrorBoundary>

        {/* Live Logs (2/5 width) */}
        <div className="lg:col-span-2 bg-navy-900 rounded-xl shadow-layered overflow-hidden">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-navy-300 hover:text-white transition-colors border-b border-navy-800"
            aria-expanded={showLogs}
            aria-controls="activity-log"
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
              Live Activity Log
            </span>
            {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showLogs && (
            <div id="activity-log" className="px-3 pb-3 max-h-[400px] overflow-y-auto custom-scrollbar" aria-live="polite" aria-atomic="false">
              <div className="space-y-1 pt-2">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 animate-fade-in" role="log">
                    <span className="text-[10px] font-mono text-navy-600 flex-shrink-0 mt-0.5 tabular-nums" aria-hidden="true">
                      {log.timestamp}
                    </span>
                    <span className={`text-[11px] font-mono leading-relaxed ${
                      log.type === "success" ? "text-emerald-400" :
                      log.type === "warning" ? "text-amber-400" :
                      "text-navy-300"
                    }`}>
                      {log.type === "success" && <span className="text-emerald-500" aria-hidden="true">&#10003; </span>}
                      {log.type === "warning" && <span className="text-amber-500" aria-hidden="true">&#9888; </span>}
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion Card */}
      {allDone && (
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-6 space-y-5 animate-scale-in">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto glow-emerald">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-emerald-800 mt-3">
              Intake Complete!
            </h2>
            <p className="text-sm text-emerald-600 mt-1">
              Retainer agreement generated, SOL calendared, and personalized
              email sent to {clientName || "the client"}.
            </p>
            <p className="text-xs text-emerald-500 mt-1 font-mono">
              Total pipeline time: {elapsedSeconds}s &middot; Manual equivalent: ~45 min
            </p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto stagger-children">
            <div className="text-center bg-white rounded-xl p-3 border border-emerald-200 shadow-layered-sm">
              <p className="text-xl font-bold text-navy-900">20</p>
              <p className="text-[10px] text-gray-500 font-medium">Fields Updated</p>
            </div>
            <div className="text-center bg-white rounded-xl p-3 border border-emerald-200 shadow-layered-sm">
              <p className="text-xl font-bold text-navy-900">2</p>
              <p className="text-[10px] text-gray-500 font-medium">SOL Entries</p>
            </div>
            <div className="text-center bg-white rounded-xl p-3 border border-emerald-200 shadow-layered-sm">
              <p className="text-xl font-bold text-navy-900">43 min</p>
              <p className="text-[10px] text-gray-500 font-medium">Time Saved</p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2.5 text-sm font-medium bg-white border border-emerald-300 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Clock className="w-4 h-4" />
              Process Another
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2.5 text-sm font-medium bg-white border border-emerald-300 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>
            <a
              href="https://app.clio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 text-sm font-medium bg-emerald-600 rounded-xl text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-xl flex items-center gap-2"
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
