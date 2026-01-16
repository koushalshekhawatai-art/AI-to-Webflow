#!/usr/bin/env tsx

/**
 * Demo script for clipboard functionality
 * Note: This script tests the clipboard logic but cannot actually
 * write to clipboard (requires browser environment)
 */

import { checkClipboardSupport, getWebflowDataStats } from "../lib/clipboard";
import { convertToWebflow } from "../examples/full-conversion";

console.log("=".repeat(70));
console.log("Clipboard API Demo");
console.log("=".repeat(70));
console.log();

// Generate sample Webflow data
const sampleHTML = `
<div class="container">
  <h1 class="title">Hello World</h1>
  <p class="text">This is a sample paragraph.</p>
</div>
`;

const sampleCSS = `
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.title {
  font-size: 2rem;
  font-weight: bold;
}
.text {
  font-size: 1rem;
  color: #666;
}
`;

console.log("📝 Generating sample Webflow data...");
const webflowData = convertToWebflow(sampleHTML, sampleCSS);
console.log("✅ Data generated");
console.log();

// Get statistics
console.log("=".repeat(70));
console.log("Data Statistics");
console.log("=".repeat(70));
console.log();

const stats = getWebflowDataStats(webflowData);

console.log("📊 Webflow Data Stats:");
console.log(`   Total Nodes:    ${stats.totalNodes}`);
console.log(`   Element Nodes:  ${stats.elementNodes}`);
console.log(`   Text Nodes:     ${stats.textNodes}`);
console.log(`   Styles:         ${stats.styles}`);
console.log(`   Assets:         ${stats.assets}`);
console.log(`   Size:           ${stats.sizeInKB}`);
console.log(`   Valid Format:   ${stats.valid ? "✓ Yes" : "✗ No"}`);
console.log();

// Check clipboard support (will show as not supported in Node.js)
console.log("=".repeat(70));
console.log("Clipboard API Support");
console.log("=".repeat(70));
console.log();

console.log("🔍 Checking clipboard support...");
console.log();

// Simulate browser checks
const isNode = typeof window === "undefined";

if (isNode) {
  console.log("⚠️  Running in Node.js environment");
  console.log("   Clipboard API requires a browser environment");
  console.log();
  console.log("ℹ️  In a browser, the clipboard support check would show:");
  console.log("   - hasClipboardAPI: true/false");
  console.log("   - hasClipboardItem: true/false");
  console.log("   - isSecureContext: true (on HTTPS or localhost)");
  console.log("   - canUseModernAPI: true (if all checks pass)");
} else {
  const support = checkClipboardSupport();
  console.log("Clipboard Support:");
  console.log(`   Supported:         ${support.supported ? "✓" : "✗"}`);
  console.log(`   Clipboard API:     ${support.hasClipboardAPI ? "✓" : "✗"}`);
  console.log(`   ClipboardItem:     ${support.hasClipboardItem ? "✓" : "✗"}`);
  console.log(`   Secure Context:    ${support.isSecureContext ? "✓" : "✗"}`);
  console.log(`   Modern API Ready:  ${support.canUseModernAPI ? "✓" : "✗"}`);
  console.log();
  console.log(`Recommendation: ${support.recommendation}`);
}

console.log();
console.log("=".repeat(70));
console.log("How to Use the Clipboard Function");
console.log("=".repeat(70));
console.log();

console.log("📋 In a React component:");
console.log(`
import { copyToWebflow } from "@/lib/clipboard";

const handleCopy = async () => {
  const result = await copyToWebflow(webflowData);

  if (result.success) {
    alert("Copied! Paste into Webflow Designer");
  } else {
    alert("Copy failed: " + result.message);
  }
};

<button onClick={handleCopy}>Copy to Webflow</button>
`);

console.log();
console.log("📋 With the pre-built component:");
console.log(`
import { CopyToWebflowButton } from "@/components/CopyToWebflowButton";

<CopyToWebflowButton
  webflowData={webflowData}
  showStats={true}
/>
`);

console.log();
console.log("=".repeat(70));
console.log("Testing in Browser");
console.log("=".repeat(70));
console.log();

console.log("To test the clipboard functionality:");
console.log("1. npm run dev");
console.log("2. Open http://localhost:3000 in your browser");
console.log("3. Click the 'Copy to Webflow' button");
console.log("4. Open Webflow Designer");
console.log("5. Paste (Cmd+V or Ctrl+V) into the canvas");
console.log();

console.log("=".repeat(70));
console.log("Clipboard Data Format");
console.log("=".repeat(70));
console.log();

console.log("✅ The clipboard will contain:");
console.log("   - MIME type: text/plain");
console.log("   - MIME type: application/json");
console.log("   - Format: @webflow/XscpData");
console.log();

console.log("This dual MIME type approach ensures that:");
console.log("1. Webflow Designer recognizes it as native clipboard data");
console.log("2. It can also be pasted as plain text elsewhere");
console.log("3. Both formats contain the same JSON data");
console.log();

console.log("=".repeat(70));
console.log("Sample JSON Output (first 30 lines)");
console.log("=".repeat(70));
console.log();

const jsonOutput = JSON.stringify(webflowData, null, 2);
const lines = jsonOutput.split("\n").slice(0, 30);
console.log(lines.join("\n"));
console.log("...");
console.log(`(${jsonOutput.split("\n").length - 30} more lines)`);
console.log();

console.log("=".repeat(70));
console.log("✨ Demo Complete!");
console.log("=".repeat(70));
