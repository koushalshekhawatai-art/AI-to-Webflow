# CSS Parser for Webflow Conversion

This module provides utilities to parse raw CSS strings and convert them into Webflow's clipboard format.

## Features

- Parse CSS rules from raw CSS strings
- Generate unique UUIDs for each CSS class
- Convert CSS properties to Webflow's `styleLess` format
- Support for responsive CSS with media queries
- Extract class names automatically from CSS
- Clean and sanitize CSS properties

## Main Functions

### `parseCSSToWebflow(cssString, classNames)`

Parses raw CSS and converts it to Webflow style format for specified class names.

**Parameters:**
- `cssString` (string): Raw CSS string to parse
- `classNames` (string[]): Array of class names to process (without leading dot)

**Returns:**
```typescript
{
  classToIdMap: Map<string, string>;  // Maps className to UUID
  styles: WebflowStyle[];              // Array of Webflow style objects
}
```

**Example:**
```typescript
import { parseCSSToWebflow } from "@/lib/css-parser";

const css = `
  .button {
    padding: 10px 20px;
    background-color: blue;
    color: white;
    border-radius: 5px;
  }
`;

const result = parseCSSToWebflow(css, ["button"]);

// Access the generated UUID
const buttonId = result.classToIdMap.get("button");

// Access the Webflow style object
const buttonStyle = result.styles[0];
console.log(buttonStyle.styleLess);
// Output: "padding: 10px 20px; background-color: blue; color: white; border-radius: 5px"
```

### `extractClassNamesFromCSS(cssString)`

Extracts all class names found in a CSS string.

**Parameters:**
- `cssString` (string): Raw CSS string to analyze

**Returns:**
- `string[]`: Array of class names (without leading dots)

**Example:**
```typescript
import { extractClassNamesFromCSS } from "@/lib/css-parser";

const css = `
  .button { color: red; }
  .container { width: 100%; }
  .button:hover { color: blue; }
`;

const classNames = extractClassNamesFromCSS(css);
console.log(classNames);
// Output: ["button", "container"]
```

### `parseCSSWithMediaQueries(cssString, classNames)`

Parses CSS including media queries and converts them to Webflow's responsive variants.

**Parameters:**
- `cssString` (string): Raw CSS string with media queries
- `classNames` (string[]): Array of class names to process

**Returns:**
```typescript
{
  classToIdMap: Map<string, string>;
  styles: WebflowStyle[];  // Includes variants for responsive breakpoints
}
```

**Example:**
```typescript
import { parseCSSWithMediaQueries } from "@/lib/css-parser";

const css = `
  .text {
    font-size: 24px;
    padding: 40px;
  }

  @media (max-width: 767px) {
    .text {
      font-size: 18px;
      padding: 20px;
    }
  }

  @media (max-width: 479px) {
    .text {
      font-size: 16px;
      padding: 15px;
    }
  }
`;

const result = parseCSSWithMediaQueries(css, ["text"]);
const style = result.styles[0];

console.log(style.styleLess);        // Base styles
console.log(style.variants.small);   // Styles for @media (max-width: 767px)
console.log(style.variants.tiny);    // Styles for @media (max-width: 479px)
```

## Webflow Breakpoints

The parser maps CSS media queries to Webflow's breakpoint system:

| Webflow Breakpoint | CSS Media Query          | Description           |
|--------------------|--------------------------|----------------------|
| (default)          | No media query           | Desktop/Large        |
| `medium`           | `max-width: 991px`       | Tablet landscape     |
| `small`            | `max-width: 767px`       | Tablet portrait      |
| `tiny`             | `max-width: 479px`       | Mobile               |

## CSS Property Cleaning

The parser automatically cleans CSS properties to match Webflow's `styleLess` format:

**Input:**
```css
.example {
  padding-top: 1rem;
  padding-right: 2rem;
  background-color: #3b82f6;
}
```

**Output (styleLess):**
```
padding-top: 1rem; padding-right: 2rem; background-color: #3b82f6
```

Features:
- Removes curly braces
- Removes extra whitespace
- Joins properties with semicolon + space
- Removes CSS comments
- Handles malformed spacing around colons

## WebflowStyle Object Structure

Each generated style object has the following structure:

```typescript
{
  _id: string;              // Unique UUID
  fake: boolean;            // Always false for parsed styles
  type: "class";            // Type of style
  name: string;             // Class name (without dot)
  namespace: string;        // Empty string
  comb: string;             // Combinator (empty for basic classes)
  styleLess: string;        // CSS properties in Webflow format
  variants: {               // Responsive variants
    tiny?: { styleLess: string };
    small?: { styleLess: string };
    medium?: { styleLess: string };
  };
  children: string[];       // Child style IDs (for combinators)
  origin: null;
  selector: null;
}
```

## Complete Example

```typescript
import {
  parseCSSToWebflow,
  extractClassNamesFromCSS,
  parseCSSWithMediaQueries
} from "@/lib/css-parser";

// Step 1: Extract class names from CSS
const css = `
  .header {
    background: #333;
    padding: 20px;
  }

  .button {
    padding: 10px 20px;
    background: blue;
  }

  @media (max-width: 767px) {
    .header {
      padding: 10px;
    }
  }
`;

const classNames = extractClassNamesFromCSS(css);
console.log("Found classes:", classNames);

// Step 2: Parse CSS with responsive support
const result = parseCSSWithMediaQueries(css, classNames);

// Step 3: Use the generated data
result.styles.forEach(style => {
  console.log(`\nClass: ${style.name}`);
  console.log(`UUID: ${style._id}`);
  console.log(`Base styles: ${style.styleLess}`);

  if (Object.keys(style.variants).length > 0) {
    console.log("Responsive variants:", Object.keys(style.variants));
  }
});

// Step 4: Get UUID for a specific class
const headerId = result.classToIdMap.get("header");
console.log("Header UUID:", headerId);
```

## Notes

- Class names in the input array should NOT include the leading dot (`.`)
- The parser handles CSS comments and removes them automatically
- Pseudo-selectors (`:hover`, `:focus`, etc.) are detected but basic version treats them as the base class
- Invalid CSS properties are preserved as-is in the `styleLess` string
- UUIDs are generated using UUID v4 format
- Each call to parse functions generates new UUIDs

## Integration with Webflow Converter

These functions are designed to be used as part of the HTML-to-Webflow conversion pipeline:

1. Parse HTML to extract structure
2. Extract inline styles and CSS classes
3. Use `parseCSSToWebflow` to convert CSS classes
4. Generate Webflow nodes with class references (UUIDs)
5. Combine nodes + styles into Webflow clipboard format
