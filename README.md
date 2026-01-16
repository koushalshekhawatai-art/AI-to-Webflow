# Code to Webflow Converter

A Next.js tool to convert HTML/CSS into Webflow's clipboard JSON format (`@webflow/XscpData`).

## Overview

This tool allows you to convert standard HTML and CSS into Webflow's proprietary clipboard format, enabling you to paste custom code directly into Webflow's Designer.

## Features

✅ **TypeScript Interfaces** - Complete type definitions for Webflow clipboard format
✅ **CSS Parser** - Parse CSS rules and convert to Webflow `styleLess` format
✅ **HTML Parser** - Recursive HTML to Webflow nodes converter
✅ **UUID Generation** - Automatic unique ID generation for all elements and styles
✅ **Class Mapping** - Map CSS classes to Webflow style UUIDs
✅ **Responsive Support** - Handle media queries and convert to Webflow breakpoints
✅ **Attribute Handling** - Preserve HTML attributes (id, src, href, etc.)
✅ **Special Elements** - Smart handling of links, images, forms, headings

## Installation

```bash
# Clone and install
cd "Code to Webflow"
npm install
```

## Quick Start

### 1. Run Demo Scripts

```bash
# Demo: CSS Parser
npm run demo:css

# Demo: HTML Parser
npm run demo:html

# Start Next.js dev server
npm run dev
```

### 2. Use in Code

```typescript
import { parseCSSToWebflow, extractClassNamesFromCSS } from "@/lib/css-parser";
import { compileHTMLToNodes } from "@/lib/html-parser";

// Your HTML and CSS
const html = `<div class="container"><h1>Hello World</h1></div>`;
const css = `.container { max-width: 1200px; margin: 0 auto; }`;

// Parse CSS
const classNames = extractClassNamesFromCSS(css);
const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);

// Compile HTML
const { nodes } = compileHTMLToNodes(html, classToIdMap);

// Build Webflow format
const webflowData = {
  type: "@webflow/XscpData",
  payload: {
    nodes,
    styles,
    assets: [],
    ix1: [],
    ix2: { interactions: [], events: [], actionLists: [] }
  },
  meta: {
    unlinkedSymbolCount: 0,
    droppedLinks: 0,
    dynBindRemovedCount: 0,
    dynListBindRemovedCount: 0,
    paginationRemovedCount: 0
  }
};

console.log(JSON.stringify(webflowData));
```

## Project Structure

```
Code to Webflow/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── lib/                   # Core library
│   ├── css-parser.ts      # CSS to Webflow styles converter
│   ├── html-parser.ts     # HTML to Webflow nodes converter
│   ├── README.md          # CSS parser docs
│   ├── html-parser-README.md  # HTML parser docs
│   └── __tests__/         # Test files
├── types/                 # TypeScript definitions
│   └── webflow.ts         # Webflow format types
├── scripts/               # Demo scripts
│   ├── demo-css-parser.ts
│   └── demo-html-parser.ts
├── examples/              # Usage examples
│   └── css-parser-example.ts
└── package.json
```

## Core Functions

### CSS Parser (`lib/css-parser.ts`)

#### `parseCSSToWebflow(cssString, classNames)`

Converts CSS to Webflow styles with UUID mapping.

```typescript
const css = `.button { padding: 10px; background: blue; }`;
const result = parseCSSToWebflow(css, ["button"]);

// Result:
// {
//   classToIdMap: Map { "button" => "uuid-123" },
//   styles: [{
//     _id: "uuid-123",
//     name: "button",
//     styleLess: "padding: 10px; background: blue",
//     ...
//   }]
// }
```

#### `extractClassNamesFromCSS(cssString)`

Extracts all CSS class names from a stylesheet.

```typescript
const css = `.header { ... } .footer { ... }`;
const classes = extractClassNamesFromCSS(css);
// ["header", "footer"]
```

#### `parseCSSWithMediaQueries(cssString, classNames)`

Parses responsive CSS and maps media queries to Webflow breakpoints.

```typescript
const css = `
  .text { font-size: 20px; }
  @media (max-width: 767px) {
    .text { font-size: 16px; }
  }
`;

const result = parseCSSWithMediaQueries(css, ["text"]);
// result.styles[0].variants.small = { styleLess: "font-size: 16px" }
```

### HTML Parser (`lib/html-parser.ts`)

#### `compileHTMLToNodes(htmlString, classToIdMap)`

Recursively converts HTML to Webflow node structure.

```typescript
const html = `<div class="container"><h1>Hello</h1></div>`;
const classMap = new Map([["container", "uuid-123"]]);

const result = compileHTMLToNodes(html, classMap);
// {
//   nodes: [
//     { _id: "...", tag: "div", classes: ["uuid-123"], children: [...] },
//     { _id: "...", tag: "h1", children: [...] },
//     { _id: "...", text: true, v: "Hello" }
//   ],
//   rootNodeIds: ["..."]
// }
```

#### `compileHTMLWithStyles(htmlString)`

Auto-extracts classes and generates UUID map.

```typescript
const html = `<div class="box"><p class="text">Content</p></div>`;
const result = compileHTMLWithStyles(html);

// Automatically generates:
// - classToIdMap with UUIDs for "box" and "text"
// - Complete node structure
```

#### `debugNodeTree(nodes, rootIds, indent?)`

Visualizes node hierarchy for debugging.

```typescript
console.log(debugNodeTree(nodes, rootNodeIds));

// Output:
// <div> (Block) [abc123...]
//   classes: [1 class(es)]
//   <h1> (Heading) [def456...]
//     [TEXT] "Hello"
```

### Clipboard API (`lib/clipboard.ts`)

#### `copyToWebflow(webflowData)`

Copies Webflow data to clipboard using dual MIME types.

```typescript
import { copyToWebflow } from "@/lib/clipboard";

const result = await copyToWebflow(webflowData);

if (result.success) {
  // Data copied! User can paste into Webflow Designer
  alert("Copied! Paste into Webflow with Cmd+V / Ctrl+V");
}
```

**Key Feature**: Writes both `text/plain` and `application/json` MIME types so Webflow Designer recognizes it as native clipboard data.

#### `copyToWebflowSmart(webflowData)`

Smart copy with automatic fallback for browser compatibility.

```typescript
import { copyToWebflowSmart } from "@/lib/clipboard";

// Automatically handles browser compatibility
const result = await copyToWebflowSmart(webflowData);
```

#### `checkClipboardSupport()`

Checks if Clipboard API is available.

```typescript
import { checkClipboardSupport } from "@/lib/clipboard";

const support = checkClipboardSupport();
if (!support.supported) {
  console.warn("Clipboard not supported:", support.recommendation);
}
```

## HTML Tag Mapping

| HTML | Webflow Type |
|------|--------------|
| `div`, `span`, `article` | `Block` |
| `section` | `Section` |
| `h1` - `h6` | `Heading` |
| `p` | `Paragraph` |
| `a` | `Link` |
| `img` | `Image` |
| `ul`, `ol` | `List` |
| `li` | `ListItem` |
| `form` | `FormWrapper` |
| `input`, `textarea` | `FormTextInput` |
| `button` | `FormButton` |

## Webflow Breakpoints

| Breakpoint | CSS Media Query | Description |
|------------|-----------------|-------------|
| (default) | None | Desktop/Large |
| `medium` | `max-width: 991px` | Tablet landscape |
| `small` | `max-width: 767px` | Tablet portrait |
| `tiny` | `max-width: 479px` | Mobile |

## Complete Example

```typescript
import { parseCSSToWebflow, extractClassNamesFromCSS } from "@/lib/css-parser";
import { compileHTMLToNodes } from "@/lib/html-parser";
import type { WebflowClipboardData } from "@/types/webflow";

function convertToWebflow(
  html: string,
  css: string
): WebflowClipboardData {
  // 1. Extract class names from CSS
  const classNames = extractClassNamesFromCSS(css);

  // 2. Parse CSS and generate UUIDs
  const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);

  // 3. Compile HTML with class mapping
  const { nodes } = compileHTMLToNodes(html, classToIdMap);

  // 4. Build Webflow clipboard format
  return {
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
}

// Usage
const myHTML = `
  <header class="header">
    <div class="container">
      <h1 class="logo">My Site</h1>
      <nav class="nav">
        <a href="/" class="nav-link">Home</a>
        <a href="/about" class="nav-link">About</a>
      </nav>
    </div>
  </header>
`;

const myCSS = `
  .header {
    background: #333;
    color: white;
    padding: 20px 0;
  }
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .logo {
    font-size: 24px;
    font-weight: bold;
  }
  .nav {
    display: flex;
    gap: 20px;
  }
  .nav-link {
    color: white;
    text-decoration: none;
  }
`;

const webflowData = convertToWebflow(myHTML, myCSS);
console.log(JSON.stringify(webflowData, null, 2));

// Copy to clipboard and paste into Webflow!
```

## Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server

# Demos
npm run demo:css         # Run CSS parser demo
npm run demo:html        # Run HTML parser demo
npm run demo:full        # Run complete conversion demo
npm run demo:clipboard   # Run clipboard API demo

# Type checking
npx tsc --noEmit         # Check TypeScript types
```

## Technology Stack

- **Next.js 15** - React framework
- **TypeScript 5** - Type safety
- **Tailwind CSS 3** - Styling
- **htmlparser2** - HTML parsing
- **uuid** - Unique ID generation
- **tsx** - TypeScript execution

## Documentation

- [CSS Parser Documentation](./lib/README.md)
- [HTML Parser Documentation](./lib/html-parser-README.md)
- [Clipboard API Documentation](./lib/clipboard-README.md)
- [Webflow Types Reference](./types/webflow.ts)

## Type Definitions

All Webflow types are fully defined in TypeScript:

```typescript
import type {
  WebflowClipboardData,
  WebflowPayload,
  WebflowNode,
  WebflowElementNode,
  WebflowTextNode,
  WebflowStyle,
  WebflowAsset,
  WebflowMeta
} from "@/types/webflow";
```

## Testing

Test files are located in `lib/__tests__/`:
- `css-parser.test.ts` - CSS parser tests
- `html-parser.test.ts` - HTML parser tests

## Next Steps

1. ✅ TypeScript interfaces for Webflow format
2. ✅ CSS parser with UUID generation
3. ✅ HTML parser with recursive processing
4. ✅ Web UI for conversion
5. ✅ Clipboard copy functionality (dual MIME types)
6. ✅ Webflow Designer paste integration
7. 🔲 Asset handling for images
8. 🔲 Batch conversion
9. 🔲 Export/import presets

## Contributing

This is a tool for converting HTML/CSS to Webflow format. The main conversion logic is in:
- `lib/css-parser.ts` - CSS parsing and style generation
- `lib/html-parser.ts` - HTML parsing and node generation
- `types/webflow.ts` - Type definitions

## License

MIT

## Notes

- UUIDs are generated using UUID v4 format
- Each function call generates new UUIDs (not deterministic)
- Text nodes with only whitespace are automatically skipped
- Unknown HTML tags default to `Block` type
- CSS variables (e.g., `@var_*`) are preserved in `styleLess`
- Media query mapping is approximate and may need tuning

---

Built for Webflow clipboard format `@webflow/XscpData`
