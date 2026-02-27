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
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [matterId, setMatterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
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
    maxSize: 20 * 1024 * 1024, // 20MB
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
      // Convert PDF to base64
      setLoadingMessage("Encoding PDF...");
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // Store the PDF for the verification page viewer
      sessionStorage.setItem("uploadedPdf", base64);
      sessionStorage.setItem("uploadedPdfName", file.name);

      // Send to extraction API
      setLoadingMessage("Sending to AI for extraction...");
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

      // Store extraction result and navigate to verification
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

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-navy-900">
          Police Report Processing
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Upload a NYC Police Accident Report (MV-104AN) to automatically
          extract case data, update Clio Manage, and generate a retainer
          agreement.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        <div className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <Zap className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-navy-800 text-sm">~2 Min Intake</p>
            <p className="text-xs text-gray-500">Down from 45 minutes</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <Shield className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-navy-800 text-sm">
              Human-in-the-Loop
            </p>
            <p className="text-xs text-gray-500">Verify before processing</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-navy-800 text-sm">
              End-to-End Auto
            </p>
            <p className="text-xs text-gray-500">
              Retainer + email + calendar
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-navy-800">
            1. Upload Police Report
          </h2>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-gold-400 bg-gold-50"
                : file
                ? "border-emerald-300 bg-emerald-50"
                : "border-gray-300 hover:border-gold-400 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-medium text-emerald-700">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB &middot; Click or
                  drop to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? "Drop the PDF here..."
                    : "Drag & drop a police report PDF, or click to browse"}
                </p>
                <p className="text-xs text-gray-400">
                  MV-104AN forms &middot; Max 20MB
                </p>
              </div>
            )}
          </div>

          {/* Matter ID */}
          <div>
            <h2 className="text-lg font-semibold text-navy-800 mb-3">
              2. Enter Clio Matter ID
            </h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={matterId}
                  onChange={(e) => {
                    setMatterId(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., 2415839201"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Find this in Clio Manage under the Matter details
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 animate-slide-up">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !file || !matterId.trim()}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              loading || !file || !matterId.trim()
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-700 shadow-sm"
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
      </div>
    </div>
  );
}
