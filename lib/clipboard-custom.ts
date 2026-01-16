import type { WebflowClipboardData } from "@/types/webflow";

/**
 * Copy to clipboard using custom copy event (supports custom MIME types)
 * This approach uses the DataTransfer API which supports application/json
 */
export async function copyToWebflowCustom(
  webflowData: WebflowClipboardData
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const jsonString = JSON.stringify(webflowData);

    // Create a temporary element to trigger copy event
    const tempInput = document.createElement('input');
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    tempInput.value = 'trigger';
    document.body.appendChild(tempInput);
    tempInput.select();

    // Custom copy event handler
    const copyHandler = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.clipboardData) {
        // Add multiple formats - DataTransfer supports custom MIME types!
        e.clipboardData.setData('application/json', jsonString);
        e.clipboardData.setData('text/plain', jsonString);
        e.clipboardData.setData('text/html', jsonString);

        console.log('✓ Custom copy event - added application/json');
        resolve({
          success: true,
          message: 'Copied to clipboard! You can now paste into Webflow Designer.'
        });
      } else {
        resolve({
          success: false,
          message: 'Clipboard not available'
        });
      }

      // Cleanup
      document.removeEventListener('copy', copyHandler);
      document.body.removeChild(tempInput);
    };

    // Add event listener
    document.addEventListener('copy', copyHandler);

    // Trigger copy command
    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        document.removeEventListener('copy', copyHandler);
        document.body.removeChild(tempInput);
        resolve({
          success: false,
          message: 'Copy command failed'
        });
      }
    } catch (err) {
      document.removeEventListener('copy', copyHandler);
      document.body.removeChild(tempInput);
      resolve({
        success: false,
        message: 'Copy command error'
      });
    }
  });
}
