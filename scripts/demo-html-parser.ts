#!/usr/bin/env tsx

/**
 * Demo script for HTML Parser
 * Run with: npx tsx scripts/demo-html-parser.ts
 */

import {
  compileHTMLToNodes,
  compileHTMLWithStyles,
  debugNodeTree,
} from "../lib/html-parser";
import { parseCSSToWebflow } from "../lib/css-parser";

console.log("=".repeat(70));
console.log("HTML to Webflow Nodes Compiler Demo");
console.log("=".repeat(70));

// Example HTML
const exampleHTML = `
<header class="header">
  <div class="container">
    <div class="nav-wrapper">
      <h1 class="logo">My Website</h1>
      <nav class="navigation">
        <a href="/" class="nav-link">Home</a>
        <a href="/about" class="nav-link">About</a>
        <a href="/contact" class="nav-link button">Contact</a>
      </nav>
    </div>
  </div>
</header>

<section class="hero">
  <div class="container">
    <div class="hero-content">
      <h1 class="hero-title">Welcome to Our Website</h1>
      <p class="hero-description">
        This is a sample paragraph with some text content.
        It will be converted into Webflow nodes.
      </p>
      <div class="button-group">
        <a href="/get-started" class="button primary">Get Started</a>
        <a href="/learn-more" class="button secondary">Learn More</a>
      </div>
    </div>
    <div class="hero-image">
      <img src="https://example.com/hero.jpg" alt="Hero Image" class="image" />
    </div>
  </div>
</section>
`;

// Example CSS
const exampleCSS = `
  .header {
    background-color: #1f2937;
    color: white;
    padding: 1rem 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .hero {
    padding: 4rem 0;
    background: linear-gradient(to bottom, #f9fafb, #ffffff);
  }

  .hero-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .hero-description {
    font-size: 1.25rem;
    color: #6b7280;
    margin-bottom: 2rem;
  }

  .button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
  }

  .button.primary {
    background-color: #3b82f6;
    color: white;
  }

  .button.secondary {
    background-color: transparent;
    color: #3b82f6;
    border: 2px solid #3b82f6;
  }

  .button-group {
    display: flex;
    gap: 1rem;
  }

  .image {
    width: 100%;
    height: auto;
    border-radius: 0.5rem;
  }
`;

console.log("\n📝 Input HTML:");
console.log(exampleHTML.trim());

console.log("\n" + "=".repeat(70));
console.log("Step 1: Parse CSS and Create Style Map");
console.log("=".repeat(70));

// Extract class names and parse CSS
const cssClassRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
const classNames = new Set<string>();
let match;

while ((match = cssClassRegex.exec(exampleCSS)) !== null) {
  classNames.add(match[1]);
}

const classNamesArray = Array.from(classNames);
console.log(`\n✅ Found ${classNamesArray.length} classes in CSS:`);
console.log(classNamesArray.join(", "));

const cssResult = parseCSSToWebflow(exampleCSS, classNamesArray);

console.log("\n🔑 Class to UUID Mapping (first 5):");
let count = 0;
cssResult.classToIdMap.forEach((uuid, className) => {
  if (count < 5) {
    console.log(`   ${className.padEnd(20)} => ${uuid}`);
    count++;
  }
});
if (cssResult.classToIdMap.size > 5) {
  console.log(`   ... and ${cssResult.classToIdMap.size - 5} more`);
}

console.log("\n" + "=".repeat(70));
console.log("Step 2: Compile HTML to Webflow Nodes");
console.log("=".repeat(70));

const htmlResult = compileHTMLToNodes(exampleHTML, cssResult.classToIdMap);

console.log(`\n✅ Generated ${htmlResult.nodes.length} total nodes`);
console.log(`✅ ${htmlResult.rootNodeIds.length} root node(s)`);

// Count node types
const elementNodes = htmlResult.nodes.filter((n) => !("text" in n && n.text));
const textNodes = htmlResult.nodes.filter((n) => "text" in n && n.text);

console.log(`   - ${elementNodes.length} element nodes`);
console.log(`   - ${textNodes.length} text nodes`);

console.log("\n📊 Node Type Distribution:");
const typeCount: Record<string, number> = {};
elementNodes.forEach((node: any) => {
  const type = node.type;
  typeCount[type] = (typeCount[type] || 0) + 1;
});

Object.entries(typeCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`   ${type.padEnd(15)} : ${count}`);
  });

console.log("\n" + "=".repeat(70));
console.log("Step 3: Node Tree Structure");
console.log("=".repeat(70));

console.log("\n🌳 Tree View:");
console.log(debugNodeTree(htmlResult.nodes, htmlResult.rootNodeIds));

console.log("=".repeat(70));
console.log("Step 4: Sample Node Details");
console.log("=".repeat(70));

// Find and display a sample element node
const sampleElement = htmlResult.nodes.find(
  (n: any) => n.tag === "h1" && !n.text
);
if (sampleElement) {
  console.log("\n📋 Sample Element Node (h1):");
  console.log(JSON.stringify(sampleElement, null, 2));
}

// Find and display a sample text node
const sampleText = htmlResult.nodes.find((n: any) => n.text === true);
if (sampleText) {
  console.log("\n📋 Sample Text Node:");
  console.log(JSON.stringify(sampleText, null, 2));
}

console.log("\n" + "=".repeat(70));
console.log("Step 5: Alternative Method - Auto-extract Classes");
console.log("=".repeat(70));

const autoResult = compileHTMLWithStyles(exampleHTML);

console.log(
  `\n✅ Auto-extracted ${autoResult.classToIdMap.size} classes from HTML`
);
console.log(`✅ Generated ${autoResult.nodes.length} nodes`);

console.log("\n🔑 Auto-generated Class Map (first 5):");
count = 0;
autoResult.classToIdMap.forEach((uuid, className) => {
  if (count < 5) {
    console.log(`   ${className.padEnd(20)} => ${uuid}`);
    count++;
  }
});

console.log("\n" + "=".repeat(70));
console.log("✨ Demo Complete!");
console.log("=".repeat(70));

console.log("\nNext steps:");
console.log("1. Combine nodes + styles into Webflow payload");
console.log("2. Add assets array for images");
console.log("3. Wrap in Webflow clipboard format (@webflow/XscpData)");
console.log("4. Copy to clipboard!\n");
