# HTML to Webflow Nodes Compiler

This module provides a recursive function to compile HTML strings into Webflow node format.

## Overview

The `compileHTMLToNodes` function takes raw HTML and converts it into Webflow's node structure, handling:
- Element nodes with proper type mapping
- Text nodes
- Nested children (recursive processing)
- CSS class mapping to Webflow style UUIDs
- HTML attributes (id, src, href, etc.)
- Special node types (Link, Image, Heading, etc.)

## Main Functions

### `compileHTMLToNodes(htmlString, classToIdMap)`

Recursively parses HTML and converts it to Webflow nodes.

**Parameters:**
- `htmlString` (string): Raw HTML string to parse
- `classToIdMap` (Map<string, string>): Map of class names to Webflow style UUIDs

**Returns:**
```typescript
{
  nodes: WebflowNode[];      // All nodes (elements + text)
  rootNodeIds: string[];     // IDs of top-level nodes
}
```

**Example:**
```typescript
import { compileHTMLToNodes } from "@/lib/html-parser";
import { parseCSSToWebflow } from "@/lib/css-parser";

// Step 1: Parse CSS to get class-to-UUID map
const css = `.button { padding: 10px; }`;
const { classToIdMap } = parseCSSToWebflow(css, ["button"]);

// Step 2: Compile HTML with the class map
const html = `<div class="button">Click me</div>`;
const result = compileHTMLToNodes(html, classToIdMap);

console.log(result.nodes);      // Array of WebflowNode objects
console.log(result.rootNodeIds); // ["uuid-of-div"]
```

### `compileHTMLWithStyles(htmlString)`

Convenience function that automatically extracts classes from HTML and generates UUIDs.

**Parameters:**
- `htmlString` (string): Raw HTML string to parse

**Returns:**
```typescript
{
  nodes: WebflowNode[];
  rootNodeIds: string[];
  classToIdMap: Map<string, string>;  // Auto-generated class map
}
```

**Example:**
```typescript
import { compileHTMLWithStyles } from "@/lib/html-parser";

const html = `
  <div class="container">
    <h1 class="title">Hello World</h1>
  </div>
`;

const result = compileHTMLWithStyles(html);

// Classes automatically extracted and mapped to UUIDs
console.log(result.classToIdMap.get("container")); // "uuid-123..."
console.log(result.classToIdMap.get("title"));     // "uuid-456..."
console.log(result.nodes.length);                   // 3 (div, h1, text)
```

### `debugNodeTree(nodes, rootIds, indent?)`

Utility function to visualize the node tree structure.

**Example:**
```typescript
import { debugNodeTree } from "@/lib/html-parser";

const { nodes, rootNodeIds } = compileHTMLWithStyles(html);
console.log(debugNodeTree(nodes, rootNodeIds));

// Output:
// <div> (Block) [a1b2c3d4...]
//   classes: [1 class(es)]
//   <h1> (Heading) [e5f6g7h8...]
//     classes: [1 class(es)]
//     [TEXT] "Hello World"
```

## HTML Tag to Webflow Type Mapping

The compiler automatically maps HTML tags to appropriate Webflow types:

| HTML Tag | Webflow Type | Notes |
|----------|--------------|-------|
| `div`, `span`, `article`, `aside`, `main` | `Block` | Generic block elements |
| `section` | `Section` | Section container |
| `h1` - `h6` | `Heading` | All heading levels |
| `p` | `Paragraph` | Paragraph text |
| `a` | `Link` | Links with href support |
| `img` | `Image` | Images with src, alt, etc. |
| `ul`, `ol` | `List` | Ordered/unordered lists |
| `li` | `ListItem` | List items |
| `form` | `FormWrapper` | Form container |
| `input`, `textarea` | `FormTextInput` | Form inputs |
| `button` | `FormButton` | Form buttons |
| `header`, `footer`, `nav` | `Block` | Semantic HTML5 elements |

## Node Structure

### Element Node

Each HTML element is converted to a Webflow element node:

```typescript
{
  _id: "unique-uuid",                    // Auto-generated UUID
  classes: ["style-uuid-1", "style-uuid-2"], // Mapped from CSS classes
  type: "Block",                         // Webflow type (see mapping above)
  tag: "div",                            // Original HTML tag
  data: {
    attr: {
      id: "",                            // HTML id attribute
      // ... other attributes based on tag type
    },
    xattr: [],
    text: false,
    tag: "div",
    devlink: { runtimeProps: {}, slot: "" },
    displayName: "",
    search: { exclude: false },
    visibility: { conditions: [] }
  },
  children: ["child-uuid-1", "child-uuid-2"]  // IDs of child nodes
}
```

### Text Node

Text content is converted to text nodes:

```typescript
{
  _id: "unique-uuid",
  text: true,
  v: "Text content here",
  children: []
}
```

## Processing Workflow

1. **Parse HTML**: Uses `htmlparser2` to parse HTML into DOM
2. **Process Elements Recursively**:
   - Generate unique UUID for element
   - Map HTML tag to Webflow type
   - Extract CSS classes and look up UUIDs in classToIdMap
   - Extract attributes (id, src, href, etc.)
   - Process children recursively
   - Create element node with child UUIDs
3. **Process Text Nodes**:
   - Trim whitespace
   - Create text node if not empty
4. **Build Node Array**: Collect all nodes (flattened tree)
5. **Return Results**: Return all nodes + root node IDs

## Handling Special Elements

### Links (`<a>`)

```html
<a href="https://example.com" class="button">Click me</a>
```

Converted to:
```typescript
{
  type: "Link",
  tag: "a",
  data: {
    button: true,  // true if "button" class present
    link: {
      mode: "external",  // "external" for http/https, else "internal"
      url: "https://example.com"
    },
    eventIds: [],
    // ... other data
  }
}
```

### Images (`<img>`)

```html
<img src="image.jpg" alt="Description" width="500" height="300" />
```

Converted to:
```typescript
{
  type: "Image",
  tag: "img",
  data: {
    attr: {
      src: "image.jpg",
      alt: "Description",
      width: "500",
      height: "300",
      loading: "lazy"  // default
    },
    img: { id: "" },  // Asset ID (needs to be populated)
    srcsetDisabled: false,
    sizes: []
  }
}
```

### Forms

```html
<input type="text" name="email" placeholder="Enter email" />
```

Converted to:
```typescript
{
  type: "FormTextInput",
  tag: "input",
  data: {
    attr: {
      type: "text",
      name: "email",
      placeholder: "Enter email"
    }
  }
}
```

## Complete Example

```typescript
import { compileHTMLToNodes } from "@/lib/html-parser";
import { parseCSSToWebflow } from "@/lib/css-parser";

// Define CSS
const css = `
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .title {
    font-size: 2rem;
    font-weight: bold;
  }
  .button {
    padding: 10px 20px;
    background: blue;
    color: white;
  }
`;

// Define HTML
const html = `
  <div class="container">
    <h1 class="title">Welcome</h1>
    <p>This is a paragraph with <strong>bold text</strong>.</p>
    <a href="/signup" class="button">Sign Up</a>
  </div>
`;

// Step 1: Parse CSS and create style map
const { classToIdMap, styles } = parseCSSToWebflow(
  css,
  ["container", "title", "button"]
);

// Step 2: Compile HTML to nodes
const { nodes, rootNodeIds } = compileHTMLToNodes(html, classToIdMap);

console.log("Generated", nodes.length, "nodes");
console.log("Styles:", styles.length);

// Now you can combine nodes + styles into Webflow payload
const webflowPayload = {
  type: "@webflow/XscpData",
  payload: {
    nodes: nodes,
    styles: styles,
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

console.log(JSON.stringify(webflowPayload, null, 2));
```

## Node Hierarchy

The function maintains proper parent-child relationships:

```
Element Node (div)
├── _id: "uuid-1"
├── children: ["uuid-2", "uuid-3"]
│
├─> Element Node (h1)
│   ├── _id: "uuid-2"
│   ├── children: ["uuid-4"]
│   │
│   └─> Text Node
│       └── _id: "uuid-4"
│       └── v: "Title text"
│
└─> Element Node (p)
    └── _id: "uuid-3"
    └── children: ["uuid-5"]
    │
    └─> Text Node
        └── _id: "uuid-5"
        └── v: "Paragraph text"
```

## Error Handling

- **Empty text nodes**: Automatically skipped (whitespace-only text)
- **Unknown tags**: Defaults to `Block` type
- **Missing attributes**: Defaults provided (empty strings or sensible defaults)
- **Invalid HTML**: `htmlparser2` handles most malformed HTML gracefully
- **Missing classes**: Elements without matching UUIDs get empty `classes` array

## Performance Considerations

- **Recursive processing**: Efficient for typical HTML structures
- **Single pass**: Processes each node once
- **Flat array output**: All nodes stored in single array for easy serialization
- **UUID generation**: Uses `uuid` v4 for guaranteed uniqueness

## Integration with Full Pipeline

```typescript
import { parseCSSToWebflow, extractClassNamesFromCSS } from "@/lib/css-parser";
import { compileHTMLToNodes } from "@/lib/html-parser";

function convertToWebflow(html: string, css: string) {
  // 1. Extract classes from CSS
  const classNames = extractClassNamesFromCSS(css);

  // 2. Parse CSS and generate style UUIDs
  const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);

  // 3. Compile HTML with style mapping
  const { nodes, rootNodeIds } = compileHTMLToNodes(html, classToIdMap);

  // 4. Build Webflow clipboard format
  return {
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
}

// Usage
const webflowData = convertToWebflow(myHTML, myCSS);
console.log(JSON.stringify(webflowData));
```

## Testing

See `lib/__tests__/html-parser.test.ts` for comprehensive test cases covering:
- Simple HTML parsing
- Text node handling
- Tag-to-type mapping
- Nested elements
- Multiple classes per element
- Image attributes
- Link handling
- Whitespace handling
- Auto-extraction of classes
