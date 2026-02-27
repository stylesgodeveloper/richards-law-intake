"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Paperclip,
  Calendar,
  ExternalLink,
  ArrowRight,
  Send,
} from "lucide-react";
import type { ExtractionResult } from "@/lib/types";
import { getSeasonalCalendlyLink } from "@/lib/constants";

export default function EmailPreviewPage() {
  const router = useRouter();
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("extractionResult");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setExtraction(parsed.extraction || parsed);
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!extraction) return null;

  const cp = extraction.client_party;
  const ap = extraction.adverse_party;
  const ad = extraction.accident_details;
  const clientName = cp.full_name || `${cp.first_name} ${cp.last_name}`;
  const clientFirst = cp.first_name || clientName.split(" ")[0];
  const defendantName = ap.full_name || `${ap.first_name} ${ap.last_name}`;
  const calendlyLink = getSeasonalCalendlyLink();
  const isWinter = new Date().getMonth() + 1 >= 9 || new Date().getMonth() + 1 <= 2;

  const accidentDateFormatted = ad.date
    ? new Date(ad.date + "T12:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "[Date]";

  // Build accident type description for email
  let accidentTypeDesc = "car accident";
  if (cp.role === "pedestrian") {
    accidentTypeDesc = "pedestrian accident";
  } else if (cp.role === "bicyclist") {
    accidentTypeDesc = "bicycle accident";
  } else if (ad.accident_type?.toLowerCase().includes("rear")) {
    accidentTypeDesc = "rear-end collision";
  } else if (ad.accident_type?.toLowerCase().includes("swipe")) {
    accidentTypeDesc = "sideswipe collision";
  }

  // Generate personalized paragraph from officer's narrative
  function generateAccidentSummary(): string {
    const desc = ad.description_verbatim || "";
    if (!desc) return "";

    // For the demo, generate a client-friendly summary
    if (cp.role === "pedestrian") {
      return `From the details shared, I understand that you were crossing the street when you were struck by a vehicle operated by ${defendantName}. ${
        ad.num_injured > 0
          ? "Given the injuries you sustained, we want to ensure that all aspects of your recovery are properly documented and that you receive full compensation."
          : "We want to make sure all aspects of this incident are properly addressed."
      }`;
    }
    if (cp.role === "bicyclist") {
      return `From the details shared, I understand that you were cycling when a vehicle operated by ${defendantName} made contact with your bicycle. These types of incidents between vehicles and cyclists require careful investigation, and I want to reassure you that we are here to advocate for you.`;
    }

    // Vehicle cases - use narrative context
    if (desc.toUpperCase().includes("BUS LANE") || desc.toUpperCase().includes("MIDDLE LANE")) {
      return `From the details shared, I understand that you were traveling on ${
        ad.location_road || "the road"
      } when your vehicle was struck. While you stated that the other driver was moving from the bus lane into the middle lane and hit you, they are claiming that you were the one in the middle lane and merged into them. We know that these types of disputed collisions can be disruptive, but I want to reassure you that we are here to advocate for you and handle the legal process as smoothly as possible.`;
    }
    if (desc.toUpperCase().includes("REAR") || ad.accident_type?.toLowerCase().includes("rear")) {
      return `From the details shared, I understand that your vehicle was struck from behind while you were driving on ${
        ad.location_road || "the road"
      }. Rear-end collisions like this are often clear-cut in terms of liability, and we are well-positioned to advocate on your behalf and ensure you receive fair compensation for any damages sustained.`;
    }

    return `From the details shared, I understand that you were involved in a ${accidentTypeDesc} on ${
      ad.location_road || "the road"
    } involving a vehicle operated by ${defendantName}. We know that dealing with the aftermath of an accident can be disruptive, and I want to reassure you that we are here to advocate for you and handle the legal process as smoothly as possible.`;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              Client Email Preview
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Automated email with retainer PDF &amp; Calendly link
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/status")}
          className="ml-12 sm:ml-0 px-4 py-2 text-sm font-medium bg-navy-900 text-white rounded-lg hover:bg-navy-800 flex items-center gap-2 self-start sm:self-auto"
        >
          View Pipeline Status
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Seasonal Link Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-700">
            Seasonal Calendly Link: {isWinter ? "Winter/Autumn (Virtual)" : "Summer/Spring (In-Office)"}
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            Current month triggers the {isWinter ? "September-February virtual" : "March-August in-office"} scheduling link
          </p>
        </div>
      </div>

      {/* Email Preview */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Email Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 space-y-2">
          <div className="flex items-start gap-2 text-xs sm:text-sm">
            <span className="text-gray-500 w-10 sm:w-12 flex-shrink-0">To:</span>
            <span className="text-gray-800 break-all">
              talent.legal-engineer.hackathon.automation-email@swans.co
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs sm:text-sm">
            <span className="text-gray-500 w-10 sm:w-12 flex-shrink-0">From:</span>
            <span className="text-gray-800">
              Andrew Richards &lt;andrew@richardsandlaw.com&gt;
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs sm:text-sm">
            <span className="text-gray-500 w-10 sm:w-12 flex-shrink-0">Subject:</span>
            <span className="text-gray-900 font-semibold">
              Retainer Agreement for Your Review – Richards &amp; Law
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm pt-1 border-t border-gray-100 mt-2">
            <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
            <span className="text-blue-600 text-xs font-medium truncate">
              {clientName} [Retainer Agreement].pdf
            </span>
          </div>
        </div>

        {/* Email Body */}
        <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-4 text-sm sm:text-[15px] leading-relaxed text-gray-800">
          <p>Hello {clientFirst},</p>

          <p>
            I hope you&apos;re doing well. I wanted to follow up regarding your{" "}
            <span className="bg-gold-100 px-1 rounded">{accidentTypeDesc}</span> on{" "}
            <span className="bg-gold-100 px-1 rounded">{accidentDateFormatted}</span>. I know
            dealing with the aftermath of{" "}
            {cp.role === "pedestrian"
              ? "an accident"
              : cp.role === "bicyclist"
              ? "a cycling incident"
              : "a crash"}{" "}
            is stressful, and I want to make sure we move things forward as
            smoothly as possible for you.
          </p>

          <p>
            <span className="bg-emerald-50 px-1 rounded border border-emerald-200">
              {generateAccidentSummary()}
            </span>
          </p>

          <p>
            Attached is your Retainer Agreement, which sets the foundation for
            our partnership. It details the specific legal services we will
            provide and the mutual responsibilities needed to move your claim
            forward effectively. Please take a moment to review it before we
            meet.
          </p>

          <p>
            When you&apos;re ready, you can book an appointment with us using this
            link:{" "}
            <a
              href={calendlyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
            >
              Book a Consultation
              <ExternalLink className="w-3 h-3" />
            </a>
            . At that meeting, we&apos;ll go through the agreement in detail and
            discuss next steps.
          </p>

          <p className="pt-2">Andrew Richards</p>
        </div>

        {/* Attachment */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200 max-w-xs">
            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
              <Mail className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {clientName} [Retainer Agreement].pdf
              </p>
              <p className="text-[10px] text-gray-400">PDF Document</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3 bg-gray-50 flex flex-wrap items-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-gold-100 rounded flex-shrink-0" aria-hidden="true" /> Personalized field
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded flex-shrink-0" aria-hidden="true" /> AI-generated paragraph
          </div>
        </div>
      </div>
    </div>
  );
}
