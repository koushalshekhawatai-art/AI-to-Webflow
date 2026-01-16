import { extractClassNamesFromCSS, parseCSSToWebflow } from "../lib/css-parser";
import { compileHTMLToNodes } from "../lib/html-parser";

const html = `<div class="container">
  <h1 class="heading">Hello World</h1>
  <p class="text">This is a paragraph</p>
  <a href="#" class="link">Click me</a>
</div>`;

const css = `.container {
  padding: 20px;
  background-color: #f5f5f5;
}

.heading {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.text {
  font-size: 16px;
  color: #666;
}

.link {
  color: #0066cc;
  text-decoration: underline;
}`;

const classNames = extractClassNamesFromCSS(css);
const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);
const { nodes, rootNodeIds } = compileHTMLToNodes(html, classToIdMap);

console.log("Total nodes:", nodes.length);
console.log("Root node IDs:", rootNodeIds);
console.log("\nNode breakdown:");
nodes.forEach((node: any, i) => {
  if (node.text) {
    console.log(`${i}: Text "${node.v}"`);
  } else {
    console.log(`${i}: ${node.type} (${node.tag}) - classes: [${node.classes.join(', ')}]`);
    console.log(`   children: [${node.children.length} items]`);
  }
});

// Find the container div
const containerDiv = nodes.find((n: any) => !n.text && n.tag === 'div' && n.classes.some((c: string) => {
  const style = styles.find(s => s._id === c);
  return style?.name === 'container';
}));

console.log("\nContainer div found:", !!containerDiv);
if (containerDiv) {
  console.log("Container div ID:", containerDiv._id);
  console.log("Container children count:", containerDiv.children.length);
}
