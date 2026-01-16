import type { WebflowClipboardData } from "@/types/webflow";

/**
 * Result of clipboard copy operation
 */
export interface CopyResult {
  success: boolean;
  error?: string;
  message: string;
}

/**
 * Copies Webflow data to clipboard in a format that Webflow Designer recognizes
 * Writes data as both text/plain and application/json MIME types
 *
 * @param webflowData - The complete Webflow clipboard data object
 * @returns Promise with success status and message
 *
 * @example
 * ```typescript
 * const webflowData = {
 *   type: "@webflow/XscpData",
 *   payload: { nodes, styles, assets: [], ix1: [], ix2: {...} },
 *   meta: {...}
 * };
 *
 * const result = await copyToWebflow(webflowData);
 * if (result.success) {
 *   console.log("Copied! Paste into Webflow Designer");
 * }
 * ```
 */
export async function copyToWebflow(
  webflowData: WebflowClipboardData
): Promise<CopyResult> {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard || !navigator.clipboard.write) {
      return {
        success: false,
        error: "Clipboard API not available",
        message:
          "Your browser doesn't support the Clipboard API. Please use a modern browser like Chrome, Edge, or Firefox.",
      };
    }

    // Validate the data structure
    if (!webflowData || webflowData.type !== "@webflow/XscpData") {
      return {
        success: false,
        error: "Invalid Webflow data",
        message: 'Data must have type "@webflow/XscpData"',
      };
    }

    // Stringify the JSON
    const jsonString = JSON.stringify(webflowData);

    // Chrome doesn't support application/json for clipboard write
    // Try multiple approaches: text/html (preferred) and text/plain (fallback)

    try {
      // Approach 1: Try text/html (Chrome supports this and Webflow might recognize it)
      const htmlBlob = new Blob([jsonString], { type: "text/html" });
      const plainBlob = new Blob([jsonString], { type: "text/plain" });

      const clipboardItem = new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": plainBlob
      });

      await navigator.clipboard.write([clipboardItem]);

      console.log("✓ Copied to clipboard as text/html and text/plain");
      console.log("JSON length:", jsonString.length, "bytes");
    } catch (htmlError) {
      console.warn("text/html failed, trying text/plain only:", htmlError);

      // Fallback: Just text/plain
      const plainBlob = new Blob([jsonString], { type: "text/plain" });
      const clipboardItem = new ClipboardItem({
        "text/plain": plainBlob
      });

      await navigator.clipboard.write([clipboardItem]);

      console.log("✓ Copied to clipboard as text/plain");
    }

    return {
      success: true,
      message: "Copied to clipboard! You can now paste into Webflow Designer.",
    };
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.name === "NotAllowedError") {
        return {
          success: false,
          error: "Permission denied",
          message:
            "Clipboard access was denied. Please allow clipboard permissions and try again.",
        };
      }

      if (error.name === "SecurityError") {
        return {
          success: false,
          error: "Security error",
          message:
            "Clipboard access is only available on secure (HTTPS) origins or localhost.",
        };
      }

      return {
        success: false,
        error: error.name,
        message: `Failed to copy: ${error.message}`,
      };
    }

    return {
      success: false,
      error: "Unknown error",
      message: "An unknown error occurred while copying to clipboard.",
    };
  }
}

/**
 * Fallback copy function using the older execCommand API
 * Used when ClipboardItem is not supported
 *
 * @param webflowData - The complete Webflow clipboard data object
 * @returns Promise with success status and message
 */
export async function copyToWebflowFallback(
  webflowData: WebflowClipboardData
): Promise<CopyResult> {
  try {
    const jsonString = JSON.stringify(webflowData);

    // Create temporary textarea
    const textarea = document.createElement("textarea");
    textarea.value = jsonString;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    // Select and copy
    textarea.select();
    const successful = document.execCommand("copy");

    // Clean up
    document.body.removeChild(textarea);

    if (successful) {
      return {
        success: true,
        message:
          "Copied to clipboard (fallback method). You can now paste into Webflow Designer.",
      };
    } else {
      return {
        success: false,
        error: "Copy failed",
        message: "Failed to copy using fallback method.",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to copy to clipboard.",
    };
  }
}

/**
 * Smart copy function that tries modern API first, then falls back
 *
 * @param webflowData - The complete Webflow clipboard data object
 * @returns Promise with success status and message
 */
export async function copyToWebflowSmart(
  webflowData: WebflowClipboardData
): Promise<CopyResult> {
  // Try modern API first
  if (
    typeof ClipboardItem !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.write !== "undefined"
  ) {
    const result = await copyToWebflow(webflowData);
    if (result.success) {
      return result;
    }
    // If modern API fails, try fallback
    console.warn("Modern clipboard API failed, trying fallback:", result.error);
  }

  // Use fallback
  return copyToWebflowFallback(webflowData);
}

/**
 * Requests clipboard permission explicitly
 * This can help avoid permission denied errors
 *
 * @returns Promise that resolves when permission is granted
 */
export async function requestClipboardPermission(): Promise<{granted: boolean, message: string}> {
  try {
    // Try to request permission explicitly
    if (navigator.permissions && navigator.permissions.query) {
      const result = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });

      if (result.state === 'granted') {
        return { granted: true, message: 'Permission already granted' };
      } else if (result.state === 'prompt') {
        return { granted: false, message: 'Permission will be requested on next copy attempt' };
      } else {
        return { granted: false, message: 'Permission denied by user' };
      }
    }

    // Fallback: Try to write a test string
    await navigator.clipboard.writeText('test');
    return { granted: true, message: 'Permission granted' };
  } catch (error) {
    return { granted: false, message: 'Permission check failed - will try on copy' };
  }
}

/**
 * Checks if the clipboard API is available in the current environment
 *
 * @returns Object with availability info
 */
export function checkClipboardSupport() {
  const hasClipboardAPI =
    typeof navigator !== "undefined" &&
    navigator.clipboard !== undefined &&
    navigator.clipboard.write !== undefined;

  const hasClipboardItem = typeof ClipboardItem !== "undefined";

  const isSecureContext =
    typeof window !== "undefined" &&
    (window.isSecureContext || window.location.protocol === "https:");

  return {
    supported: hasClipboardAPI && hasClipboardItem,
    hasClipboardAPI,
    hasClipboardItem,
    isSecureContext,
    canUseModernAPI: hasClipboardAPI && hasClipboardItem && isSecureContext,
    recommendation: !hasClipboardAPI
      ? "Browser does not support Clipboard API"
      : !hasClipboardItem
      ? "Browser does not support ClipboardItem"
      : !isSecureContext
      ? "Page must be served over HTTPS or localhost"
      : "Clipboard API is fully supported",
  };
}

/**
 * Gets detailed information about the Webflow data being copied
 *
 * @param webflowData - The Webflow clipboard data
 * @returns Statistics about the data
 */
export function getWebflowDataStats(webflowData: WebflowClipboardData) {
  const payload = webflowData.payload;

  const elementNodes = payload.nodes.filter((n: any) => !n.text);
  const textNodes = payload.nodes.filter((n: any) => n.text);

  const jsonString = JSON.stringify(webflowData);
  const sizeInBytes = new Blob([jsonString]).size;
  const sizeInKB = (sizeInBytes / 1024).toFixed(2);

  return {
    totalNodes: payload.nodes.length,
    elementNodes: elementNodes.length,
    textNodes: textNodes.length,
    styles: payload.styles.length,
    assets: payload.assets.length,
    sizeInBytes,
    sizeInKB: `${sizeInKB} KB`,
    valid: webflowData.type === "@webflow/XscpData",
  };
}
