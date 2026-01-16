import { extractClassNamesFromCSS, parseCSSToWebflow } from "../lib/css-parser";
import { compileHTMLToNodes } from "../lib/html-parser";

const html = `<div class="container">
  <h1 class="heading">Test Heading</h1>
  <p class="text">Test paragraph</p>
  <a href="#" class="link">Test Link</a>
</div>`;

const css = `.container { padding: 20px; }
.heading { font-size: 32px; }
.text { font-size: 16px; }
.link { color: blue; }`;

const classNames = extractClassNamesFromCSS(css);
const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);
const { nodes } = compileHTMLToNodes(html, classToIdMap);

// Check each node type
nodes.forEach((node: any) => {
  if (node.text) {
    console.log(`✓ Text node: "${node.v}"`);
  } else {
    console.log(`\n${node.type} (${node.tag}):`);
    console.log(`  Has "text" in data: ${node.data.hasOwnProperty('text')}`);
    console.log(`  Has "tag" in data: ${node.data.hasOwnProperty('tag')}`);
    if (node.data.text !== undefined) {
      console.log(`  text value: ${node.data.text}`);
    }
    if (node.data.tag) {
      console.log(`  tag value: ${node.data.tag}`);
    }
  }
});

console.log("\n✓ Expected:");
console.log("  - Block (div): text=false, tag=div");
console.log("  - Heading (h1): tag=h1, NO text field");
console.log("  - Paragraph (p): NO tag, NO text field");
console.log("  - Link (a): NO tag, NO text field");
