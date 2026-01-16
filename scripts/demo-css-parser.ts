#!/usr/bin/env tsx

/**
 * Demo script for CSS Parser
 * Run with: npx tsx scripts/demo-css-parser.ts
 */

import { parseCSSToWebflow, extractClassNamesFromCSS } from "../lib/css-parser";

console.log("=".repeat(60));
console.log("CSS to Webflow Parser Demo");
console.log("=".repeat(60));

// Example CSS
const exampleCSS = `
  /* Button styles */
  .button {
    padding-top: 0.75rem;
    padding-right: 1.5rem;
    padding-bottom: 0.75rem;
    padding-left: 1.5rem;
    background-color: #3b82f6;
    color: white;
    border-radius: 0.5rem;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .button:hover {
    background-color: #2563eb;
  }

  /* Container styles */
  .container {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  /* Heading styles */
  .heading {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1rem;
    color: #1f2937;
  }
`;

console.log("\n📝 Input CSS:");
console.log(exampleCSS);

console.log("\n" + "=".repeat(60));
console.log("Step 1: Extract Class Names");
console.log("=".repeat(60));

const extractedClasses = extractClassNamesFromCSS(exampleCSS);
console.log("\n✅ Found", extractedClasses.length, "classes:");
extractedClasses.forEach((className, index) => {
  console.log(`   ${index + 1}. ${className}`);
});

console.log("\n" + "=".repeat(60));
console.log("Step 2: Parse CSS to Webflow Format");
console.log("=".repeat(60));

const result = parseCSSToWebflow(exampleCSS, extractedClasses);

console.log("\n🔑 Class to UUID Mapping:");
result.classToIdMap.forEach((uuid, className) => {
  console.log(`   ${className.padEnd(15)} => ${uuid}`);
});

console.log("\n📦 Generated Webflow Style Objects:");
console.log(`   Total: ${result.styles.length} styles\n`);

result.styles.forEach((style, index) => {
  console.log(`   ${index + 1}. ${style.name}`);
  console.log(`      _id: ${style._id}`);
  console.log(`      type: ${style.type}`);
  console.log(`      styleLess: ${style.styleLess.substring(0, 60)}${style.styleLess.length > 60 ? "..." : ""}`);
  console.log();
});

console.log("=".repeat(60));
console.log("Step 3: Detailed View of First Style");
console.log("=".repeat(60));

if (result.styles.length > 0) {
  const firstStyle = result.styles[0];
  console.log("\n📋 Full Style Object for:", firstStyle.name);
  console.log(JSON.stringify(firstStyle, null, 2));
}

console.log("\n" + "=".repeat(60));
console.log("✨ Demo Complete!");
console.log("=".repeat(60));
console.log("\nYou can now use these style objects to build a Webflow clipboard payload.");
console.log("The classToIdMap allows you to reference styles by their UUIDs in nodes.\n");
