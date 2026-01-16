import { extractClassNamesFromCSS, parseCSSToWebflow } from "../lib/css-parser";
import { compileHTMLToNodes } from "../lib/html-parser";

const html = `<div class="container">
  <h1 class="heading">Test Heading</h1>
  <p class="text">Test paragraph</p>
</div>`;

const css = `.container {
  padding: 20px;
}

.heading {
  font-size: 32px;
  font-weight: bold;
}

.text {
  font-size: 16px;
  color: #666;
}`;

// Extract class names
const classNames = extractClassNamesFromCSS(css);
console.log("Class names found:", classNames);

// Parse CSS
const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);
console.log("\nClass to ID mapping:");
classToIdMap.forEach((id, className) => {
  console.log(`  ${className} -> ${id}`);
});

// Compile HTML
const { nodes, rootNodeIds } = compileHTMLToNodes(html, classToIdMap);
console.log(`\nGenerated ${nodes.length} nodes, ${rootNodeIds.length} root nodes`);

// Build final structure
const webflowData = {
  type: "@webflow/XscpData",
  payload: {
    nodes,
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

console.log("\nFull JSON output:");
console.log(JSON.stringify(webflowData, null, 2));

console.log("\n\nSummary:");
console.log(`Total nodes: ${nodes.length}`);
console.log(`Element nodes: ${nodes.filter((n: any) => !n.text).length}`);
console.log(`Text nodes: ${nodes.filter((n: any) => n.text).length}`);
console.log(`Styles: ${styles.length}`);
