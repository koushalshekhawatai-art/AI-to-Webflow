import { extractClassNamesFromCSS, parseCSSToWebflow } from "../lib/css-parser";
import { compileHTMLToNodes } from "../lib/html-parser";

const html = `<a href="#" class="link">Click me</a>`;
const css = `.link { color: blue; }`;

const classNames = extractClassNamesFromCSS(css);
const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);
const { nodes } = compileHTMLToNodes(html, classToIdMap);

const linkNode = nodes.find((n: any) => !n.text && n.type === 'Link');

console.log("Our Link node data:");
console.log(JSON.stringify(linkNode?.data, null, 2));

console.log("\n\nRelume's Link node data:");
console.log(`{
  "attr": {"id": ""},
  "xattr": [],
  "button": true,
  "block": "",
  "link": {"mode": "external", "url": "#"},
  "eventIds": [],
  "devlink": {"runtimeProps": {}, "slot": ""},
  "displayName": "",
  "search": {"exclude": false},
  "visibility": {"conditions": []}
}`);

console.log("\n\nKey differences:");
console.log("1. Field order: type-specific (button, block, link, eventIds) should come BEFORE common fields (devlink, etc.)");
console.log("2. attr should only have 'id', not 'href' or 'target' (those go in link object)");
