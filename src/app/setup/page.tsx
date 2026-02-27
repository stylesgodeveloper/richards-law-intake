"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  Zap,
  Settings,
  Users,
  Globe,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";

function SetupStep({
  step,
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  step: number;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <span className="w-8 h-8 bg-navy-100 text-navy-700 rounded-full text-sm flex items-center justify-center font-bold flex-shrink-0">
          {step}
        </span>
        <Icon className="w-5 h-5 text-navy-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-navy-800 flex-1 text-left">
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 text-sm text-gray-600 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="bg-gray-900 text-gray-100 rounded-lg p-3 font-mono text-xs overflow-x-auto relative group">
      <pre>{children}</pre>
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-900">
            Clio Manage Setup Guide
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Step-by-step instructions to configure Clio for the automation
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-medium">Prerequisites</p>
        <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside text-amber-700">
          <li>
            Clio Manage account (US region, Advanced plan for doc automation)
          </li>
          <li>Make.com account (free tier works)</li>
          <li>Anthropic API key for Claude</li>
        </ul>
      </div>

      <div className="space-y-4">
        <SetupStep step={1} title="Clio Account & Firm Configuration" icon={Settings} defaultOpen={true}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Sign up at{" "}
              <a href="https://www.clio.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                clio.com
              </a>{" "}
              — select <strong>US region</strong> and <strong>Advanced plan</strong> (free trial)
            </li>
            <li>Firm name: <strong>Richards &amp; Law</strong></li>
            <li>Create attorney user: <strong>Andrew Richards</strong> (this will be the Responsible Attorney)</li>
            <li>
              Create Practice Area: <strong>Personal Injury</strong>
            </li>
            <li>
              Create Matter Stages (Settings → Matter Stages):
              <div className="mt-1 flex gap-2 flex-wrap">
                {["New Intake", "Data Verified", "Retainer Ready", "Retainer Sent"].map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-navy-50 text-navy-700 rounded text-xs font-mono">
                    {s}
                  </span>
                ))}
              </div>
            </li>
          </ol>
        </SetupStep>

        <SetupStep step={2} title="Create Custom Fields (20 fields)" icon={Database}>
          <p>
            Go to <strong>Settings → Custom Fields → Matter</strong> and create
            each field exactly as named:
          </p>
          <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-1">
            {[
              { name: "ClientFullName", type: "Text" },
              { name: "ClientGender", type: "Text (Male/Female)" },
              { name: "ClientAddress", type: "Text (Long)" },
              { name: "ClientDOB", type: "Date" },
              { name: "ClientDriversLicense", type: "Text" },
              { name: "ClientPlateNumber", type: "Text" },
              { name: "ClientVehicle", type: "Text" },
              { name: "DefendantName", type: "Text" },
              { name: "DefendantAddress", type: "Text (Long)" },
              { name: "DefendantVehicle", type: "Text" },
              { name: "AccidentDate", type: "Date" },
              { name: "AccidentLocation", type: "Text (Long)" },
              { name: "AccidentDescription", type: "Text (Long)" },
              { name: "AccidentType", type: "Text" },
              { name: "NumberInjured", type: "Text" },
              { name: "InjuriesDescription", type: "Text (Long)" },
              { name: "PoliceReportNumber", type: "Text" },
              { name: "OfficerName", type: "Text" },
              { name: "Precinct", type: "Text" },
              { name: "StatuteOfLimitationsDate", type: "Date" },
            ].map((f, i) => (
              <div key={i} className="flex justify-between text-xs py-0.5">
                <span className="font-mono text-navy-700">{f.name}</span>
                <span className="text-gray-500">{f.type}</span>
              </div>
            ))}
          </div>
        </SetupStep>

        <SetupStep step={3} title="Create Contact & Matter" icon={Users}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Create Contact:</strong>
              <ul className="ml-4 mt-1 space-y-0.5 text-xs list-disc list-inside">
                <li>First Name: <strong>Guillermo</strong></li>
                <li>Last Name: <strong>Reyes</strong></li>
                <li>
                  Email:{" "}
                  <code className="bg-gray-100 px-1 rounded text-xs">
                    talent.legal-engineer.hackathon.automation-email@swans.co
                  </code>
                </li>
              </ul>
            </li>
            <li>
              <strong>Create Matter:</strong>
              <ul className="ml-4 mt-1 space-y-0.5 text-xs list-disc list-inside">
                <li>Description: <strong>Reyes v. Francois</strong></li>
                <li>Responsible Attorney: <strong>Andrew Richards</strong></li>
                <li>Practice Area: <strong>Personal Injury</strong></li>
                <li>Stage: <strong>New Intake</strong></li>
                <li>Client: <strong>Guillermo Reyes</strong></li>
              </ul>
            </li>
            <li>
              <strong>Note the Matter ID</strong> — you&apos;ll need this for the web
              app
            </li>
          </ol>
        </SetupStep>

        <SetupStep step={4} title="Upload Retainer Template" icon={FileText}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Download the <code className="bg-gray-100 px-1 rounded">retainer-template.docx</code>{" "}
              from the project
            </li>
            <li>
              Go to <strong>Settings → Document Automation → Templates</strong>
            </li>
            <li>
              Upload the .docx file as <strong>&quot;PI Retainer Agreement&quot;</strong>
            </li>
            <li>
              Verify merge fields are recognized (look for{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">
                {"<<CF:ClientFullName>>"}
              </code>{" "}
              etc.)
            </li>
            <li>Test manually with a matter that has custom fields filled</li>
          </ol>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 mt-2">
            <strong>Note on conditional logic:</strong> Clio&apos;s exact syntax for
            IF/THEN conditionals may vary. If{" "}
            <code>{"<<CF:NumberInjured!=0?...>>"}</code> doesn&apos;t work, create a
            separate <strong>HasInjuries</strong> checkbox field (Yes/No) and use that
            for conditionals.
          </div>
        </SetupStep>

        <SetupStep step={5} title="Configure Automated Workflow" icon={Zap}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Go to <strong>Settings → Automated Workflows → Create</strong>
            </li>
            <li>
              <strong>Trigger:</strong> Matter stage changes TO &quot;Retainer Ready&quot;
            </li>
            <li>
              <strong>Condition:</strong> Practice Area = Personal Injury
            </li>
            <li>
              <strong>Action:</strong> Generate document from &quot;PI Retainer
              Agreement&quot; template, save as PDF in Matter
            </li>
            <li>Test by manually changing a matter&apos;s stage to &quot;Retainer Ready&quot;</li>
          </ol>
        </SetupStep>

        <SetupStep step={6} title="Make.com Webhook Setup" icon={Globe}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Import the JSON blueprints from <code className="bg-gray-100 px-1 rounded">make-blueprints/</code>
            </li>
            <li>
              <strong>Scenario 1 (Extraction):</strong> Copy the webhook URL
              after importing
            </li>
            <li>
              <strong>Scenario 2 (Pipeline):</strong> Copy the webhook URL
              after importing
            </li>
            <li>
              Set environment variables on Vercel:
              <CodeBlock>{`MAKE_WEBHOOK_EXTRACT=https://hook.us1.make.com/your-scenario-1
MAKE_WEBHOOK_PROCESS=https://hook.us1.make.com/your-scenario-2`}</CodeBlock>
            </li>
            <li>
              Configure Clio OAuth connection in Make.com (needed for API calls)
            </li>
            <li>
              Configure Gmail connection for sending emails
            </li>
          </ol>
        </SetupStep>

        <SetupStep step={7} title="Environment Variables" icon={Settings}>
          <p>Set these in Vercel Dashboard → Settings → Environment Variables:</p>
          <CodeBlock>{`# Required: At least one extraction backend
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Make.com webhooks (alternative to direct Claude API)
MAKE_WEBHOOK_EXTRACT=https://hook.us1.make.com/...
MAKE_WEBHOOK_PROCESS=https://hook.us1.make.com/...`}</CodeBlock>
        </SetupStep>
      </div>

      {/* Completion */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-emerald-800 text-sm">
            After completing all steps:
          </p>
          <ol className="mt-1 text-xs text-emerald-700 list-decimal list-inside space-y-0.5">
            <li>Upload GUILLERMO_REYES police report via the web app</li>
            <li>Enter the Matter ID from Step 3</li>
            <li>Verify extracted data and click &quot;Approve &amp; Process&quot;</li>
            <li>Watch the automation run end-to-end</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
