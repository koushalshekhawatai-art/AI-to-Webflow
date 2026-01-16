/**
 * Complete HTML/CSS to Webflow conversion example
 * This demonstrates the full pipeline from raw HTML/CSS to Webflow clipboard format
 */

import { parseCSSToWebflow, extractClassNamesFromCSS } from "@/lib/css-parser";
import { compileHTMLToNodes } from "@/lib/html-parser";
import type { WebflowClipboardData } from "@/types/webflow";

// Sample HTML - A simple landing page header
const sampleHTML = `
<header class="header-section">
  <div class="container">
    <div class="header-content">
      <div class="header-left">
        <h1 class="site-logo">MyBrand</h1>
      </div>
      <nav class="header-nav">
        <a href="/" class="nav-link">Home</a>
        <a href="/features" class="nav-link">Features</a>
        <a href="/pricing" class="nav-link">Pricing</a>
        <a href="/contact" class="nav-link nav-cta">Contact Us</a>
      </nav>
    </div>
  </div>
</header>

<section class="hero-section">
  <div class="container">
    <div class="hero-grid">
      <div class="hero-content">
        <h1 class="hero-heading">Transform Your Business Today</h1>
        <p class="hero-description">
          Join thousands of companies using our platform to accelerate growth
          and achieve their goals faster than ever before.
        </p>
        <div class="button-wrapper">
          <a href="/signup" class="button button-primary">Get Started Free</a>
          <a href="/demo" class="button button-secondary">Watch Demo</a>
        </div>
      </div>
      <div class="hero-image-wrapper">
        <img
          src="https://example.com/hero-image.jpg"
          alt="Hero illustration showing product features"
          class="hero-image"
        />
      </div>
    </div>
  </div>
</section>
`;

// Sample CSS - Styling for the landing page
const sampleCSS = `
/* Header Section */
.header-section {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
}

.container {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.site-logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: #6b7280;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-cta {
  background-color: #3b82f6;
  color: #ffffff;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
}

/* Hero Section */
.hero-section {
  padding-top: 5rem;
  padding-bottom: 5rem;
  background: linear-gradient(to bottom, #f9fafb, #ffffff);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero-heading {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.1;
  color: #111827;
  margin: 0;
}

.hero-description {
  font-size: 1.25rem;
  line-height: 1.6;
  color: #6b7280;
  margin: 0;
}

.button-wrapper {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.button {
  padding: 0.875rem 2rem;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  text-align: center;
  transition: all 0.2s;
  display: inline-block;
}

.button-primary {
  background-color: #3b82f6;
  color: #ffffff;
  border: 2px solid #3b82f6;
}

.button-secondary {
  background-color: transparent;
  color: #3b82f6;
  border: 2px solid #3b82f6;
}

.hero-image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
}

.hero-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* Responsive styles */
@media (max-width: 991px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .hero-heading {
    font-size: 2.5rem;
  }
}

@media (max-width: 767px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .header-nav {
    flex-direction: column;
    gap: 0.5rem;
  }

  .hero-heading {
    font-size: 2rem;
  }

  .hero-description {
    font-size: 1.125rem;
  }

  .button-wrapper {
    flex-direction: column;
  }
}

@media (max-width: 479px) {
  .hero-heading {
    font-size: 1.75rem;
  }

  .button {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
  }
}
`;

/**
 * Main conversion function
 * Converts HTML + CSS to Webflow clipboard format
 */
export function convertToWebflow(
  html: string,
  css: string
): WebflowClipboardData {
  console.log("🔄 Starting conversion process...\n");

  // Step 1: Extract class names from CSS
  console.log("Step 1: Extracting class names from CSS");
  const classNames = extractClassNamesFromCSS(css);
  console.log(`✅ Found ${classNames.length} classes:`, classNames.join(", "));
  console.log();

  // Step 2: Parse CSS with responsive support
  console.log("Step 2: Parsing CSS and generating style UUIDs");
  const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);
  console.log(`✅ Generated ${styles.length} style objects`);
  console.log(`✅ Created UUID mapping for ${classToIdMap.size} classes`);
  console.log();

  // Step 3: Compile HTML to nodes
  console.log("Step 3: Compiling HTML to Webflow nodes");
  const { nodes, rootNodeIds } = compileHTMLToNodes(html, classToIdMap);

  const elementNodes = nodes.filter((n: any) => !n.text);
  const textNodes = nodes.filter((n: any) => n.text);

  console.log(`✅ Generated ${nodes.length} total nodes`);
  console.log(`   - ${elementNodes.length} element nodes`);
  console.log(`   - ${textNodes.length} text nodes`);
  console.log(`   - ${rootNodeIds.length} root node(s)`);
  console.log();

  // Step 4: Build Webflow clipboard format
  console.log("Step 4: Building Webflow clipboard format");
  const webflowData: WebflowClipboardData = {
    type: "@webflow/XscpData",
    payload: {
      nodes,
      styles,
      assets: [],
      ix1: [],
      ix2: {
        interactions: [],
        events: [],
        actionLists: []
      }
    },
    meta: {
      unlinkedSymbolCount: 0,
      droppedLinks: 0,
      dynBindRemovedCount: 0,
      dynListBindRemovedCount: 0,
      paginationRemovedCount: 0
    }
  };

  console.log("✅ Webflow clipboard data generated");
  console.log();

  return webflowData;
}

/**
 * Demo execution
 */
if (require.main === module) {
  console.log("=".repeat(70));
  console.log("HTML/CSS to Webflow Clipboard Converter");
  console.log("=".repeat(70));
  console.log();

  // Convert the sample HTML/CSS
  const result = convertToWebflow(sampleHTML, sampleCSS);

  // Display results
  console.log("=".repeat(70));
  console.log("Conversion Complete!");
  console.log("=".repeat(70));
  console.log();

  console.log("📊 Summary:");
  console.log(`   - Nodes: ${result.payload.nodes.length}`);
  console.log(`   - Styles: ${result.payload.styles.length}`);
  console.log(`   - Assets: ${result.payload.assets.length}`);
  console.log();

  console.log("🎯 Next steps:");
  console.log("   1. Copy the JSON output");
  console.log("   2. Open Webflow Designer");
  console.log("   3. Paste into the canvas");
  console.log();

  // Optionally save to file
  const fs = require("fs");
  const outputPath = "./output/webflow-clipboard.json";

  try {
    // Ensure output directory exists
    if (!fs.existsSync("./output")) {
      fs.mkdirSync("./output");
    }

    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Output saved to: ${outputPath}`);
  } catch (error) {
    console.log("⚠️  Could not save to file (optional)");
  }

  console.log();
  console.log("=".repeat(70));

  // Show a snippet of the output
  console.log("📋 Output Preview (first 50 lines):");
  console.log("=".repeat(70));
  const jsonOutput = JSON.stringify(result, null, 2);
  const lines = jsonOutput.split("\n").slice(0, 50);
  console.log(lines.join("\n"));

  if (jsonOutput.split("\n").length > 50) {
    console.log("...");
    console.log(`(${jsonOutput.split("\n").length - 50} more lines)`);
  }
}

export { sampleHTML, sampleCSS };
