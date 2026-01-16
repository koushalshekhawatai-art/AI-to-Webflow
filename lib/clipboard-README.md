# Clipboard API - Copy to Webflow

This module provides functions to copy Webflow clipboard data using the modern Clipboard API with dual MIME types (`text/plain` and `application/json`) that Webflow Designer recognizes.

## Overview

The `copyToWebflow` function uses the `navigator.clipboard.write()` API to write data in a format that Webflow Designer can natively recognize and paste. This is critical because Webflow expects clipboard data in a specific format with both MIME types.

## Key Features

- ✅ **Dual MIME Types**: Writes both `text/plain` and `application/json`
- ✅ **Modern Clipboard API**: Uses `ClipboardItem` and `navigator.clipboard.write()`
- ✅ **Fallback Support**: Automatic fallback to `execCommand` for older browsers
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Type Safety**: Full TypeScript support
- ✅ **React Components**: Pre-built UI components for easy integration

## Main Functions

### `copyToWebflow(webflowData)`

Main function that copies Webflow data to the clipboard using the modern Clipboard API.

**Parameters:**
- `webflowData` (WebflowClipboardData): The complete Webflow clipboard data object

**Returns:**
- `Promise<CopyResult>`: Object with `success`, `message`, and optional `error`

**Example:**
```typescript
import { copyToWebflow } from "@/lib/clipboard";

const result = await copyToWebflow(webflowData);

if (result.success) {
  console.log("✅", result.message);
  // "Copied to clipboard! You can now paste into Webflow Designer."
} else {
  console.error("❌", result.message);
  // Error message with details
}
```

### `copyToWebflowSmart(webflowData)`

Smart copy function that automatically tries modern API first, then falls back to older methods.

**Parameters:**
- `webflowData` (WebflowClipboardData): The complete Webflow clipboard data object

**Returns:**
- `Promise<CopyResult>`: Object with success status and message

**Example:**
```typescript
import { copyToWebflowSmart } from "@/lib/clipboard";

// Automatically handles browser compatibility
const result = await copyToWebflowSmart(webflowData);
```

**Recommended**: Use this function in production for maximum browser compatibility.

### `copyToWebflowFallback(webflowData)`

Fallback copy function using the older `document.execCommand('copy')` API.

**Parameters:**
- `webflowData` (WebflowClipboardData): The complete Webflow clipboard data object

**Returns:**
- `Promise<CopyResult>`: Object with success status and message

**Example:**
```typescript
import { copyToWebflowFallback } from "@/lib/clipboard";

// Use fallback method explicitly
const result = await copyToWebflowFallback(webflowData);
```

### `checkClipboardSupport()`

Checks if the Clipboard API is available and supported in the current environment.

**Returns:**
```typescript
{
  supported: boolean;           // Overall support status
  hasClipboardAPI: boolean;     // Has navigator.clipboard
  hasClipboardItem: boolean;    // Has ClipboardItem constructor
  isSecureContext: boolean;     // Running on HTTPS or localhost
  canUseModernAPI: boolean;     // All checks pass
  recommendation: string;        // Human-readable recommendation
}
```

**Example:**
```typescript
import { checkClipboardSupport } from "@/lib/clipboard";

const support = checkClipboardSupport();

if (!support.supported) {
  console.warn("Clipboard API not supported:", support.recommendation);
}
```

### `getWebflowDataStats(webflowData)`

Gets detailed statistics about the Webflow data being copied.

**Parameters:**
- `webflowData` (WebflowClipboardData): The Webflow clipboard data

**Returns:**
```typescript
{
  totalNodes: number;        // Total number of nodes
  elementNodes: number;      // Number of element nodes
  textNodes: number;         // Number of text nodes
  styles: number;            // Number of styles
  assets: number;            // Number of assets
  sizeInBytes: number;       // Size in bytes
  sizeInKB: string;          // Size formatted as "X.XX KB"
  valid: boolean;            // Whether format is valid
}
```

**Example:**
```typescript
import { getWebflowDataStats } from "@/lib/clipboard";

const stats = getWebflowDataStats(webflowData);
console.log(`Copying ${stats.totalNodes} nodes (${stats.sizeInKB})`);
```

## React Components

### `<CopyToWebflowButton />`

Full-featured button component with status indicators and statistics.

**Props:**
```typescript
interface CopyToWebflowButtonProps {
  webflowData: WebflowClipboardData;  // Required: Data to copy
  className?: string;                  // Optional: Additional CSS classes
  useFallback?: boolean;               // Optional: Use smart fallback
  showStats?: boolean;                 // Optional: Show data statistics
}
```

**Example:**
```tsx
import { CopyToWebflowButton } from "@/components/CopyToWebflowButton";

<CopyToWebflowButton
  webflowData={webflowData}
  showStats={true}
  className="my-4"
/>
```

**Features:**
- Visual state changes (idle, copying, success, error)
- User-friendly success/error messages
- Automatic state reset after 3 seconds
- Shows clipboard support warnings
- Optional data statistics display

### `<SimpleCopyButton />`

Minimal button with custom callback handlers.

**Props:**
```typescript
interface SimpleCopyButtonProps {
  webflowData: WebflowClipboardData;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
```

**Example:**
```tsx
import { SimpleCopyButton } from "@/components/CopyToWebflowButton";

<SimpleCopyButton
  webflowData={webflowData}
  onSuccess={() => alert("Copied!")}
  onError={(error) => alert("Failed: " + error)}
/>
```

### `<CopyOrDownloadButton />`

Button with both copy and download options.

**Props:**
```typescript
interface CopyOrDownloadButtonProps {
  webflowData: WebflowClipboardData;
  filename?: string;  // Default: "webflow-clipboard.json"
}
```

**Example:**
```tsx
import { CopyOrDownloadButton } from "@/components/CopyToWebflowButton";

<CopyOrDownloadButton
  webflowData={webflowData}
  filename="my-export.json"
/>
```

## How It Works

### 1. Data Preparation

The Webflow data is stringified to JSON:

```typescript
const jsonString = JSON.stringify(webflowData);
```

### 2. ClipboardItem Creation

A `ClipboardItem` is created with **both** MIME types:

```typescript
const clipboardItem = new ClipboardItem({
  "text/plain": new Blob([jsonString], { type: "text/plain" }),
  "application/json": new Blob([jsonString], { type: "application/json" })
});
```

**Why both MIME types?**
- `text/plain`: Allows pasting as regular text if needed
- `application/json`: Webflow Designer specifically looks for this MIME type to recognize native clipboard data

### 3. Writing to Clipboard

The data is written using the Clipboard API:

```typescript
await navigator.clipboard.write([clipboardItem]);
```

### 4. Error Handling

Handles common errors:
- **NotAllowedError**: Permission denied
- **SecurityError**: Not running on HTTPS/localhost
- **General errors**: Other clipboard failures

## Browser Compatibility

### Modern Clipboard API Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 76+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| Firefox | 87+ | ✅ Full |
| Safari | 13.1+ | ✅ Full |
| Opera | 63+ | ✅ Full |

### Requirements

1. **Secure Context**: Must be HTTPS or localhost
2. **ClipboardItem**: Constructor must be available
3. **Permissions**: User must grant clipboard access

### Fallback Support

For older browsers, the fallback method uses:
- `document.execCommand('copy')`
- Temporary textarea element
- Works in most browsers back to IE11

## Usage in Next.js

### Client Component (Recommended)

```tsx
"use client";

import { useState } from "react";
import { copyToWebflow } from "@/lib/clipboard";

export default function MyConverter() {
  const [webflowData, setWebflowData] = useState(null);

  const handleCopy = async () => {
    const result = await copyToWebflow(webflowData);

    if (result.success) {
      alert("Copied! Paste into Webflow Designer.");
    } else {
      alert("Failed: " + result.message);
    }
  };

  return (
    <button onClick={handleCopy}>
      Copy to Webflow
    </button>
  );
}
```

### With State Management

```tsx
"use client";

import { useState } from "react";
import { copyToWebflow, type CopyResult } from "@/lib/clipboard";

export default function ConverterWithState() {
  const [copyResult, setCopyResult] = useState<CopyResult | null>(null);

  const handleCopy = async () => {
    const result = await copyToWebflow(webflowData);
    setCopyResult(result);

    // Auto-clear after 3 seconds
    setTimeout(() => setCopyResult(null), 3000);
  };

  return (
    <div>
      <button onClick={handleCopy}>Copy to Webflow</button>

      {copyResult && (
        <div className={copyResult.success ? "success" : "error"}>
          {copyResult.message}
        </div>
      )}
    </div>
  );
}
```

## Complete Example

```typescript
import { parseCSSToWebflow, extractClassNamesFromCSS } from "@/lib/css-parser";
import { compileHTMLToNodes } from "@/lib/html-parser";
import { copyToWebflow, checkClipboardSupport } from "@/lib/clipboard";
import type { WebflowClipboardData } from "@/types/webflow";

async function convertAndCopy(html: string, css: string) {
  // 1. Check clipboard support first
  const support = checkClipboardSupport();
  if (!support.supported) {
    alert("Clipboard not supported: " + support.recommendation);
    return;
  }

  // 2. Convert HTML/CSS to Webflow format
  const classNames = extractClassNamesFromCSS(css);
  const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);
  const { nodes } = compileHTMLToNodes(html, classToIdMap);

  const webflowData: WebflowClipboardData = {
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

  // 3. Copy to clipboard
  const result = await copyToWebflow(webflowData);

  // 4. Show result
  if (result.success) {
    alert("✅ " + result.message);
  } else {
    alert("❌ " + result.message);
  }
}

// Usage
convertAndCopy(myHTML, myCSS);
```

## Troubleshooting

### "Clipboard API not available"

**Cause**: Browser doesn't support the Clipboard API

**Solution**: Use `copyToWebflowSmart()` which automatically falls back

### "Permission denied"

**Cause**: User denied clipboard access

**Solution**:
1. Check browser permissions
2. Ensure user interaction (button click)
3. Try again after granting permission

### "Security error"

**Cause**: Not running on HTTPS or localhost

**Solution**:
1. Use HTTPS in production
2. Use `localhost` for development
3. For `file://` URLs, clipboard won't work

### "ClipboardItem is not defined"

**Cause**: Older browser without ClipboardItem support

**Solution**: Use `copyToWebflowSmart()` for automatic fallback

## Security Considerations

1. **User Interaction Required**: Clipboard write must be triggered by user action (button click)
2. **Secure Context**: Only works on HTTPS or localhost
3. **Permissions**: Browser may prompt user for clipboard access
4. **No Background Access**: Cannot write to clipboard without user knowing

## Testing

### In Browser Console

```javascript
// Test clipboard support
const support = checkClipboardSupport();
console.log(support);

// Test copy (requires user interaction)
button.addEventListener('click', async () => {
  const result = await copyToWebflow(testData);
  console.log(result);
});
```

### In Development

```bash
# Run the demo
npm run demo:clipboard

# Start dev server (required for browser testing)
npm run dev

# Open http://localhost:3000/converter
# Click "Copy to Webflow" button
```

## Pasting into Webflow

After copying:

1. Open Webflow Designer
2. Click on the canvas where you want to paste
3. Press **Cmd+V** (Mac) or **Ctrl+V** (Windows)
4. Your elements appear with styles intact!

## API Reference

### CopyResult Type

```typescript
interface CopyResult {
  success: boolean;    // Whether copy succeeded
  message: string;     // User-friendly message
  error?: string;      // Error type/name if failed
}
```

### Error Types

- `"Clipboard API not available"` - Browser doesn't support API
- `"Invalid Webflow data"` - Data format is incorrect
- `"Permission denied"` - User denied clipboard access
- `"Security error"` - Not on HTTPS/localhost
- `"Unknown error"` - Other unexpected errors

## Performance

- **Data Size**: Typically 2-50 KB depending on complexity
- **Copy Time**: < 100ms for typical data
- **No Network**: All operations are client-side
- **Memory**: Temporary clipboard data released by browser

## Future Enhancements

Potential improvements:
- [ ] Batch copy multiple elements
- [ ] Copy with asset URLs embedded
- [ ] Custom MIME type registration
- [ ] Clipboard monitoring/validation
- [ ] Compression for large datasets

---

**Related Documentation:**
- [CSS Parser](./README.md)
- [HTML Parser](./html-parser-README.md)
- [Webflow Types](../types/webflow.ts)
