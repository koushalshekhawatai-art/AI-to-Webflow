"use client";

import { useState } from "react";
import type { WebflowClipboardData } from "@/types/webflow";
import {
  copyToWebflow,
  copyToWebflowSmart,
  checkClipboardSupport,
  getWebflowDataStats,
  type CopyResult,
} from "@/lib/clipboard";

interface CopyToWebflowButtonProps {
  webflowData: WebflowClipboardData;
  className?: string;
  useFallback?: boolean;
  showStats?: boolean;
}

/**
 * Button component for copying Webflow data to clipboard
 * Handles success/error states and provides user feedback
 */
export function CopyToWebflowButton({
  webflowData,
  className = "",
  useFallback = false,
  showStats = false,
}: CopyToWebflowButtonProps) {
  const [copyState, setCopyState] = useState<"idle" | "copying" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handleCopy = async () => {
    setCopyState("copying");
    setMessage("Copying...");

    try {
      const result: CopyResult = useFallback
        ? await copyToWebflowSmart(webflowData)
        : await copyToWebflow(webflowData);

      if (result.success) {
        setCopyState("success");
        setMessage(result.message);

        // Reset after 3 seconds
        setTimeout(() => {
          setCopyState("idle");
          setMessage("");
        }, 3000);
      } else {
        setCopyState("error");
        setMessage(result.message);

        // Reset after 5 seconds
        setTimeout(() => {
          setCopyState("idle");
          setMessage("");
        }, 5000);
      }
    } catch (error) {
      setCopyState("error");
      setMessage("Unexpected error occurred");
      setTimeout(() => {
        setCopyState("idle");
        setMessage("");
      }, 5000);
    }
  };

  // Get clipboard support info
  const clipboardSupport = checkClipboardSupport();
  const stats = showStats ? getWebflowDataStats(webflowData) : null;

  // Button styles based on state
  const getButtonClass = () => {
    const baseClass = `px-6 py-3 rounded-lg font-semibold transition-all ${className}`;

    switch (copyState) {
      case "copying":
        return `${baseClass} bg-gray-400 text-white cursor-wait`;
      case "success":
        return `${baseClass} bg-green-500 text-white`;
      case "error":
        return `${baseClass} bg-red-500 text-white`;
      default:
        return `${baseClass} bg-blue-500 hover:bg-blue-600 text-white cursor-pointer`;
    }
  };

  // Button text based on state
  const getButtonText = () => {
    switch (copyState) {
      case "copying":
        return "Copying...";
      case "success":
        return "✓ Copied!";
      case "error":
        return "✗ Failed";
      default:
        return "Copy to Webflow";
    }
  };

  return (
    <div className="space-y-4">
      {/* Main copy button */}
      <button
        onClick={handleCopy}
        disabled={!clipboardSupport.supported || copyState === "copying"}
        className={getButtonClass()}
        aria-label="Copy to Webflow clipboard"
      >
        {getButtonText()}
      </button>

      {/* Status message */}
      {message && (
        <div
          className={`p-3 rounded ${
            copyState === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : copyState === "error"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Clipboard support warning */}
      {!clipboardSupport.supported && (
        <div className="p-3 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
          <strong>⚠️ Clipboard not supported:</strong> {clipboardSupport.recommendation}
        </div>
      )}

      {/* Data statistics */}
      {showStats && stats && (
        <div className="p-4 rounded bg-gray-50 border border-gray-200 text-sm">
          <h3 className="font-semibold mb-2">Data Statistics</h3>
          <ul className="space-y-1 text-gray-700">
            <li>
              <strong>Nodes:</strong> {stats.totalNodes} ({stats.elementNodes} elements,{" "}
              {stats.textNodes} text)
            </li>
            <li>
              <strong>Styles:</strong> {stats.styles}
            </li>
            <li>
              <strong>Assets:</strong> {stats.assets}
            </li>
            <li>
              <strong>Size:</strong> {stats.sizeInKB}
            </li>
            <li>
              <strong>Valid:</strong> {stats.valid ? "✓ Yes" : "✗ No"}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Simple copy button with minimal UI
 */
export function SimpleCopyButton({
  webflowData,
  onSuccess,
  onError,
}: {
  webflowData: WebflowClipboardData;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  const handleCopy = async () => {
    const result = await copyToWebflowSmart(webflowData);

    if (result.success) {
      onSuccess?.();
    } else {
      onError?.(result.message);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
    >
      Copy to Clipboard
    </button>
  );
}

/**
 * Copy button with download fallback
 */
export function CopyOrDownloadButton({
  webflowData,
  filename = "webflow-clipboard.json",
}: {
  webflowData: WebflowClipboardData;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const result = await copyToWebflowSmart(webflowData);

    if (result.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(webflowData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className={`px-4 py-2 rounded ${
          copied
            ? "bg-green-500 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        {copied ? "✓ Copied!" : "Copy to Clipboard"}
      </button>
      <button
        onClick={handleDownload}
        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
      >
        Download JSON
      </button>
    </div>
  );
}
