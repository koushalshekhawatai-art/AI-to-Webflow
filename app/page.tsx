"use client";

import { useState } from "react";
import { parseCSSToWebflow, extractClassNamesFromCSS } from "@/lib/css-parser";
import { compileHTMLToNodes, splitIntoChunks, createHTMLEmbedNode, extractJavaScriptFromHTML, type WebflowChunk } from "@/lib/html-parser";
import { copyToWebflow, requestClipboardPermission } from "@/lib/clipboard";
import { copyToWebflowCustom } from "@/lib/clipboard-custom";
import type { WebflowClipboardData } from "@/types/webflow";

// shadcn components
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const defaultHTML = `<div class="container">
  <h1 class="heading">Welcome to Code to Webflow</h1>
  <p class="description">
    Convert your HTML and CSS into Webflow's clipboard format.
  </p>
  <a href="#" class="button">Get Started</a>
</div>`;

const defaultCSS = `.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.heading {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.description {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
}`;

const defaultJS = `// Optional: Add JavaScript here
// This will be embedded in your Webflow site

// Example:
// document.addEventListener('DOMContentLoaded', function() {
//   console.log('Webflow site loaded!');
// });`;

export default function ConverterPage() {
  const [html, setHtml] = useState(defaultHTML);
  const [css, setCss] = useState(defaultCSS);
  const [js, setJs] = useState(defaultJS);
  const [activeTab, setActiveTab] = useState<string>("html");
  const [webflowData, setWebflowData] = useState<WebflowClipboardData | null>(null);
  const [chunks, setChunks] = useState<WebflowChunk[]>([]);
  const [allStyles, setAllStyles] = useState<any[]>([]);
  const [copiedChunks, setCopiedChunks] = useState<Set<number>>(new Set());
  const [customCode, setCustomCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "success" | "error">("idle");
  const [copyMessage, setCopyMessage] = useState<string>("");

  const handleConvertAndCopy = async () => {
    setCopyStatus("copying");
    setError("");
    setCopyMessage("");
    setCopiedChunks(new Set());

    try {
      // Extract class names from CSS
      const classNames = extractClassNamesFromCSS(css);

      // Parse CSS and generate UUIDs (now also extracts advanced CSS)
      const { classToIdMap, styles, customCSS } = parseCSSToWebflow(css, classNames);

      // Compile HTML to nodes
      let { nodes, rootNodeIds } = compileHTMLToNodes(html, classToIdMap);

      // Extract JavaScript from HTML <script> tags
      const htmlJS = extractJavaScriptFromHTML(html);

      // Combine JavaScript from textarea and HTML
      const combinedJS = [
        htmlJS.trim(),
        js && !js.includes("not currently converted") ? js.trim() : ""
      ].filter(s => s.length > 0).join('\n\n');

      // Store custom code for display (don't auto-add to avoid Webflow crashes)
      const hasCustomCSS = customCSS && customCSS.trim().length > 0;
      const hasCustomJS = combinedJS.length > 0;
      let customCodeHTML = "";

      if (hasCustomCSS || hasCustomJS) {
        if (hasCustomCSS) {
          customCodeHTML += `<style>\n${customCSS}\n</style>\n`;
        }
        if (hasCustomJS) {
          customCodeHTML += `<script>\n${combinedJS}\n</script>`;
        }
        console.log(`[Converter] Custom code generated for manual embed in Webflow`);
        setCustomCode(customCodeHTML);
      } else {
        setCustomCode("");
      }

      // Store all styles for chunks
      setAllStyles(styles);

      // Split into chunks if HTML is large
      const nodeChunks = splitIntoChunks(nodes, rootNodeIds, 25);
      setChunks(nodeChunks);

      // If only one chunk (small HTML), copy immediately
      if (nodeChunks.length === 1) {
        const data: WebflowClipboardData = {
          type: "@webflow/XscpData",
          payload: {
            nodes: nodeChunks[0].nodes,
            styles,
            assets: [],
            ix1: [],
            ix2: {
              interactions: [],
              events: [],
              actionLists: [],
            },
          },
          meta: {
            unlinkedSymbolCount: 0,
            droppedLinks: 0,
            dynBindRemovedCount: 0,
            dynListBindRemovedCount: 0,
            paginationRemovedCount: 0,
          },
        };

        setWebflowData(data);

        const result = await copyToWebflowCustom(data);

        if (result.success) {
          setCopyStatus("success");
          setCopyMessage("✅ Copied to clipboard! Open Webflow Designer and press Cmd+V (Mac) or Ctrl+V (Windows)");
          setTimeout(() => {
            setCopyStatus("idle");
            setCopyMessage("");
          }, 5000);
        } else {
          setCopyStatus("error");
          setCopyMessage(
            "❌ " + result.message + ". Try the 'Download JSON' button as an alternative."
          );
          setTimeout(() => {
            setCopyStatus("idle");
          }, 10000);
        }
      } else {
        // Multiple chunks - show chunk UI
        setCopyStatus("success");
        setCopyMessage(`✅ Converted! Your HTML is large (${nodes.length} nodes), so it's split into ${nodeChunks.length} chunks. Copy each chunk below in order.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
      setCopyStatus("error");
      setCopyMessage("Conversion failed");
      setTimeout(() => {
        setCopyStatus("idle");
        setCopyMessage("");
      }, 5000);
    }
  };

  const handleCopyChunk = async (chunkIndex: number) => {
    const chunk = chunks[chunkIndex];
    if (!chunk) return;

    try {
      const data: WebflowClipboardData = {
        type: "@webflow/XscpData",
        payload: {
          nodes: chunk.nodes,
          styles: allStyles, // Include ALL styles in every chunk
          assets: [],
          ix1: [],
          ix2: {
            interactions: [],
            events: [],
            actionLists: [],
          },
        },
        meta: {
          unlinkedSymbolCount: 0,
          droppedLinks: 0,
          dynBindRemovedCount: 0,
          dynListBindRemovedCount: 0,
          paginationRemovedCount: 0,
        },
      };

      const result = await copyToWebflowCustom(data);

      if (result.success) {
        setCopiedChunks((prev) => new Set(prev).add(chunkIndex));
        setCopyMessage(`✅ Chunk ${chunkIndex + 1} copied! Paste it in Webflow, then come back for the next chunk.`);
      } else {
        setCopyMessage(`❌ Failed to copy chunk ${chunkIndex + 1}: ${result.message}`);
      }
    } catch (err) {
      setCopyMessage(`❌ Failed to copy chunk ${chunkIndex + 1}`);
    }
  };

  const handleDownloadJSON = () => {
    if (!webflowData) return;

    const jsonString = JSON.stringify(webflowData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "webflow-clipboard.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRequestPermission = async () => {
    if (!webflowData) {
      alert("Please convert your HTML/CSS first!");
      return;
    }

    try {
      // Try to copy with proper MIME type
      const jsonString = JSON.stringify(webflowData);
      const blob = new Blob([jsonString], { type: "application/json" });
      const clipboardItem = new ClipboardItem({
        "application/json": blob
      });

      await navigator.clipboard.write([clipboardItem]);

      setCopyStatus("success");
      setCopyMessage("✅ Permission granted! Copied to clipboard. Now paste in Webflow Designer.");
      setTimeout(() => {
        setCopyStatus("idle");
        setCopyMessage("");
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert(
        "❌ Clipboard permission was denied.\n\n" +
        "To fix this:\n" +
        "1. Look for a clipboard icon (🔒) in your browser's address bar\n" +
        "2. Click it and select 'Allow' for clipboard\n" +
        "3. Try this button again\n\n" +
        "OR:\n" +
        "- Use Chrome or Edge browser (best clipboard support)\n" +
        "- Use the 'Download JSON' button as a workaround\n\n" +
        "Error: " + errorMessage
      );
    }
  };

  const handleCopyJSON = async () => {
    if (!webflowData) return;

    try {
      const jsonString = JSON.stringify(webflowData);
      await navigator.clipboard.writeText(jsonString);
      alert("JSON copied as plain text! Note: This won't work directly in Webflow. Use the 'Download JSON' option instead.");
    } catch (err) {
      alert("Failed to copy JSON. Please use the Download button instead.");
    }
  };

  const handleShowJSON = () => {
    if (!webflowData) return;

    const jsonString = JSON.stringify(webflowData, null, 2);
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Webflow Clipboard JSON</title>
            <style>
              body {
                font-family: monospace;
                padding: 20px;
                background: #1e1e1e;
                color: #d4d4d4;
              }
              pre {
                background: #252526;
                padding: 20px;
                border-radius: 8px;
                overflow: auto;
              }
              button {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                background: #0078d4;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
              }
              button:hover {
                background: #106ebe;
              }
            </style>
          </head>
          <body>
            <button onclick="navigator.clipboard.writeText(document.querySelector('pre').textContent).then(() => alert('Copied to clipboard! Now paste in Webflow.')).catch(() => alert('Failed to copy. Please select all (Cmd+A / Ctrl+A) and copy manually (Cmd+C / Ctrl+C)'))">Copy All</button>
            <h2>Webflow Clipboard JSON</h2>
            <p><strong>Instructions:</strong></p>
            <ol>
              <li>Click the "Copy All" button above (or select all and copy manually)</li>
              <li>This is plain text, so it WON'T work directly in Webflow</li>
              <li>Instead, save this as a .json file or use the Download button</li>
            </ol>
            <pre>${jsonString.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
          </body>
        </html>
      `);
    }
  };

  // Calculate summary statistics
  const getSummary = () => {
    if (!webflowData) return null;

    const nodes = webflowData.payload.nodes;
    const elementNodes = nodes.filter((n: any) => !n.text);
    const textNodes = nodes.filter((n: any) => n.text);
    const styles = webflowData.payload.styles;

    return {
      totalNodes: nodes.length,
      elementNodes: elementNodes.length,
      textNodes: textNodes.length,
      styles: styles.length,
      classes: styles.map((s) => s.name).join(", "),
    };
  };

  const summary = getSummary();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-medium text-gray-900">Code to Webflow</h1>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="hidden sm:flex">
                v1.0
              </Badge>
              <a
                href="https://www.linkedin.com/in/koushal-singh-shekhawat-118b321a9/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 transition-colors"
                aria-label="LinkedIn Profile"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Main Container */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Input Code</CardTitle>
            <CardDescription>Paste your HTML, CSS, and JavaScript to convert to Webflow format</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Code Input Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="html" className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  HTML
                </TabsTrigger>
                <TabsTrigger value="css" className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  CSS
                </TabsTrigger>
                <TabsTrigger value="js" className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  JavaScript
                  <Badge variant="secondary" className="ml-1 text-xs">Optional</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="html-input">HTML Code</Label>
                  <Textarea
                    id="html-input"
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    className="min-h-[400px] font-mono text-sm resize-none"
                    placeholder="Paste your HTML here..."
                    spellCheck={false}
                  />
                </div>
              </TabsContent>

              <TabsContent value="css" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="css-input">CSS Code</Label>
                  <Textarea
                    id="css-input"
                    value={css}
                    onChange={(e) => setCss(e.target.value)}
                    className="min-h-[400px] font-mono text-sm resize-none"
                    placeholder="Paste your CSS here..."
                    spellCheck={false}
                  />
                </div>
              </TabsContent>

              <TabsContent value="js" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="js-input">JavaScript Code (Optional)</Label>
                  <Textarea
                    id="js-input"
                    value={js}
                    onChange={(e) => setJs(e.target.value)}
                    className="min-h-[400px] font-mono text-sm resize-none"
                    placeholder="Add custom JavaScript here (optional)..."
                    spellCheck={false}
                  />
                </div>
              </TabsContent>
            </Tabs>

          {/* Large Convert Button */}
          <div className="flex justify-center mb-8">
            <Button
              onClick={handleConvertAndCopy}
              disabled={copyStatus === "copying" || !html.trim() || !css.trim()}
              size="lg"
              className="px-12 py-6 text-lg font-bold"
              variant={
                copyStatus === "success"
                  ? "default"
                  : copyStatus === "error"
                  ? "destructive"
                  : "default"
              }
            >
              {copyStatus === "copying" && (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Converting & Copying...
                </>
              )}
              {copyStatus === "success" && (
                <>
                  <svg
                    className="h-6 w-6 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied to Clipboard!
                </>
              )}
              {copyStatus === "error" && (
                <>
                  <svg
                    className="h-6 w-6 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Copy Failed
                </>
              )}
              {copyStatus === "idle" && "Convert & Copy to Webflow"}
            </Button>
          </div>

          {/* Status Message */}
          {copyMessage && (
            <Alert variant={copyStatus === "success" ? "default" : "destructive"} className="mb-8">
              <AlertDescription>{copyMessage}</AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Chunks UI - Show when HTML is split into multiple chunks */}
          {chunks.length > 1 && (
            <div className="mb-8 bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Copy Each Chunk in Order
              </h3>
              <p className="text-gray-600 mb-4">
                Your HTML has been split into {chunks.length} chunks. Copy and paste each chunk into Webflow in order:
              </p>
              <div className="grid gap-3">
                {chunks.map((chunk, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      copiedChunks.has(index)
                        ? "bg-green-50 border-green-300"
                        : "bg-gray-50 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          copiedChunks.has(index)
                            ? "bg-green-500 text-white"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {copiedChunks.has(index) ? "✓" : index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {chunk.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {chunk.nodeCount} nodes
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCopyChunk(index)}
                      disabled={copiedChunks.has(index)}
                      variant={copiedChunks.has(index) ? "default" : "default"}
                      className={copiedChunks.has(index) ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {copiedChunks.has(index) ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy Chunk {index + 1}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Copy a chunk, paste it in Webflow, then come back to copy the next chunk. All chunks include the complete CSS styles.
                </p>
              </div>
            </div>
          )}

          {/* Custom Code Section */}
          {customCode && (
            <div className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Custom Code (Add Manually to Webflow)
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                This code contains advanced CSS (media queries, :hover, etc.) and/or JavaScript that needs to be added manually to Webflow using an <strong>HTML Embed element</strong>.
              </p>

              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre">{customCode}</pre>
              </div>

              <Button
                onClick={() => {
                  navigator.clipboard.writeText(customCode);
                  setCopyMessage("✅ Custom code copied! Add an HTML Embed element in Webflow and paste this code.");
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Custom Code
              </Button>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>How to add:</strong> In Webflow, drag an <strong>HTML Embed</strong> element to your page, paste this code, and save. The media queries and JavaScript will work on your published site.
                </p>
              </div>
            </div>
          )}

          {/* Preview/Summary Area */}
          {summary && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border-2 border-indigo-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Conversion Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-indigo-600">{summary.totalNodes}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Nodes</div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-blue-600">{summary.elementNodes}</div>
                  <div className="text-sm text-gray-600 font-medium">Element Nodes</div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-purple-600">{summary.textNodes}</div>
                  <div className="text-sm text-gray-600 font-medium">Text Nodes</div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-green-600">{summary.styles}</div>
                  <div className="text-sm text-gray-600 font-medium">Styles Created</div>
                </div>
              </div>

              {summary.classes && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-700 mb-2">CSS Classes:</div>
                  <div className="text-sm text-gray-600 font-mono">{summary.classes}</div>
                </div>
              )}
            </div>
          )}

          {/* Alternative Copy Options */}
          {summary && (
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button
                onClick={handleDownloadJSON}
                variant="secondary"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download JSON
              </Button>
              <Button
                onClick={handleRequestPermission}
                variant="default"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Grant Permission & Copy
              </Button>
              <Button
                onClick={handleConvertAndCopy}
                className="bg-green-500 hover:bg-green-600"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Retry Copy
              </Button>
            </div>
          )}

          {/* Instructions */}
          {copyStatus === "success" && (
            <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Next Steps: Paste into Webflow
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Open your Webflow Designer</li>
                <li>Click on the canvas where you want to add your elements</li>
                <li>
                  Press <kbd className="px-2 py-1 bg-blue-200 rounded font-mono text-sm">Cmd+V</kbd>{" "}
                  (Mac) or <kbd className="px-2 py-1 bg-blue-200 rounded font-mono text-sm">Ctrl+V</kbd>{" "}
                  (Windows)
                </li>
                <li>Your elements will appear with all styles intact! 🎉</li>
              </ol>
            </div>
          )}

          {/* Clipboard Permission Help */}
          {copyStatus === "error" && summary && (
            <div className="mt-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <h3 className="font-bold text-yellow-900 mb-3 text-lg flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Clipboard Permission Denied?
              </h3>
              <div className="space-y-3 text-yellow-800">
                <p className="font-semibold">Try these alternatives:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    <strong>Download JSON:</strong> Click "Download JSON" above, then manually copy the
                    file contents
                  </li>
                  <li>
                    <strong>Copy as Text:</strong> Click "Copy as Text" to use simple text clipboard
                    (works in most browsers)
                  </li>
                  <li>
                    <strong>Enable Permissions:</strong> Check your browser settings and allow clipboard
                    access for this site
                  </li>
                  <li>
                    <strong>Use Chrome/Edge:</strong> These browsers have the best clipboard API support
                  </li>
                </ol>
              </div>
            </div>
          )}
          </CardContent>
        </Card>

        {/* Info Footer */}
        {!summary && (
          <div className="text-center text-gray-500 text-sm">
            <p>Paste your HTML and CSS above, then click the button to convert and copy to clipboard</p>
          </div>
        )}
      </div>
    </div>
  );
}
