# Quick Reference - Code to Webflow

## 🚀 Getting Started (30 seconds)

```bash
npm install
npm run dev
# Open http://localhost:3000/converter
```

## 📋 Core Functions

### 1. Copy to Webflow (Most Important!)

```typescript
import { copyToWebflow } from "@/lib/clipboard";

const result = await copyToWebflow(webflowData);
if (result.success) {
  // User can now paste into Webflow Designer!
}
```

**Key Feature**: Writes **both** `text/plain` and `application/json` MIME types

### 2. Parse CSS

```typescript
import { parseCSSToWebflow, extractClassNamesFromCSS } from "@/lib/css-parser";

const classNames = extractClassNamesFromCSS(css);
const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);
```

### 3. Parse HTML

```typescript
import { compileHTMLToNodes } from "@/lib/html-parser";

const { nodes, rootNodeIds } = compileHTMLToNodes(html, classToIdMap);
```

### 4. Complete Conversion

```typescript
// Step 1: Parse CSS
const classNames = extractClassNamesFromCSS(css);
const { classToIdMap, styles } = parseCSSToWebflow(css, classNames);

// Step 2: Parse HTML
const { nodes } = compileHTMLToNodes(html, classToIdMap);

// Step 3: Build Webflow format
const webflowData = {
  type: "@webflow/XscpData",
  payload: { nodes, styles, assets: [], ix1: [], ix2: {...} },
  meta: {...}
};

// Step 4: Copy to clipboard
await copyToWebflow(webflowData);
```

## 🎨 React Components

### Full-Featured Button

```tsx
import { CopyToWebflowButton } from "@/components/CopyToWebflowButton";

<CopyToWebflowButton
  webflowData={webflowData}
  showStats={true}
/>
```

### Simple Button

```tsx
import { SimpleCopyButton } from "@/components/CopyToWebflowButton";

<SimpleCopyButton
  webflowData={webflowData}
  onSuccess={() => alert("Copied!")}
  onError={(err) => alert(err)}
/>
```

## 🔧 CLI Commands

```bash
# Run the app
npm run dev              # Development server
npm run build            # Production build

# Run demos
npm run demo:css         # CSS parser demo
npm run demo:html        # HTML parser demo
npm run demo:full        # Complete conversion demo
npm run demo:clipboard   # Clipboard API demo
```

## 📦 Output Format

```json
{
  "type": "@webflow/XscpData",
  "payload": {
    "nodes": [...],      // WebflowNode[]
    "styles": [...],     // WebflowStyle[]
    "assets": [],
    "ix1": [],
    "ix2": {...}
  },
  "meta": {...}
}
```

## 🗺️ Tag Mapping

| HTML | Webflow Type |
|------|--------------|
| `div` | `Block` |
| `h1-h6` | `Heading` |
| `p` | `Paragraph` |
| `a` | `Link` |
| `img` | `Image` |

## 🎯 Typical Workflow

### In UI (Recommended)

1. Go to `/converter`
2. Paste HTML and CSS
3. Click "Convert to Webflow Format"
4. Click "Copy to Webflow"
5. Open Webflow Designer
6. Paste (Cmd+V / Ctrl+V)

### Programmatic

```typescript
import { convertToWebflow } from "@/examples/full-conversion";

const webflowData = convertToWebflow(html, css);
await copyToWebflow(webflowData);
```

## ⚠️ Important Notes

### Clipboard Requirements

- **Must** be HTTPS or localhost
- **Must** be triggered by user action (button click)
- **Must** have clipboard permissions

### Browser Support

- **Modern API**: Chrome 76+, Edge 79+, Firefox 87+, Safari 13.1+
- **Fallback**: Works in all browsers with execCommand

## 🐛 Common Issues

### "Clipboard API not available"
**Solution**: Use `copyToWebflowSmart()` for automatic fallback

### "Permission denied"
**Solution**: Click the button again (don't use keyboard shortcuts)

### "Security error"
**Solution**: Use HTTPS or localhost (not `file://`)

## 📚 Documentation Links

- [CSS Parser](./lib/README.md)
- [HTML Parser](./lib/html-parser-README.md)
- [Clipboard API](./lib/clipboard-README.md)
- [Full Documentation](./README.md)

## 💡 Pro Tips

1. **Use Smart Copy**: `copyToWebflowSmart()` handles all browser cases
2. **Check Support**: Use `checkClipboardSupport()` before copying
3. **Show Stats**: Enable `showStats={true}` for debugging
4. **Download Fallback**: Use `<CopyOrDownloadButton />` for backup

## 🎉 Success Criteria

✅ Copied to clipboard?
✅ Message says "Copied!"?
✅ Webflow Designer open?
✅ Press Cmd+V (Mac) or Ctrl+V (Windows)
✅ Elements appear on canvas!

**Done!** 🚀

---

**Quick Links:**
- Web UI: `http://localhost:3000/converter`
- Main Docs: `README.md`
- Implementation: `IMPLEMENTATION-SUMMARY.md`
