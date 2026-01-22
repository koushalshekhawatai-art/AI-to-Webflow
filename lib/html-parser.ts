import { v4 as uuidv4 } from "uuid";
import * as htmlparser2 from "htmlparser2";
import { Element, Text, Node as DomNode } from "domhandler";
import {
  WebflowNode,
  WebflowElementNode,
  WebflowTextNode,
  WebflowNodeType,
  WebflowAttributes,
} from "@/types/webflow";

export interface CompileHTMLResult {
  nodes: WebflowNode[];
  rootNodeIds: string[];
}

export interface WebflowChunk {
  label: string;
  nodes: WebflowNode[];
  nodeCount: number;
}

/**
 * Maps HTML tags to Webflow node types
 */
const TAG_TO_TYPE_MAP: Record<string, WebflowNodeType> = {
  // Block elements
  div: "Block",
  section: "Section",
  article: "Block",
  aside: "Block",
  nav: "Block",
  header: "Block",
  footer: "Block",
  main: "Block",

  // Headings
  h1: "Heading",
  h2: "Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  h6: "Heading",

  // Text
  p: "Paragraph",
  span: "Block",
  strong: "Block",
  em: "Block",
  b: "Block",
  i: "Block",

  // Links
  a: "Link",

  // Images
  img: "Image",

  // Lists
  ul: "List",
  ol: "List",
  li: "ListItem",

  // Forms - Note: input type determines actual type (handled in getWebflowType)
  form: "FormForm",
  input: "FormTextInput",
  button: "Block", // Regular buttons are Block, not FormButton
  textarea: "FormTextarea",
  select: "FormSelect",
  label: "FormBlockLabel",

  // Container
  container: "Container",
};

/**
 * Tags that should be filtered out when converting to Webflow
 * These are document structure tags that can't be pasted into Webflow Designer
 */
const DOCUMENT_STRUCTURE_TAGS = [
  'html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style', 'base'
];

/**
 * Compiles HTML string into Webflow nodes
 * @param htmlString - Raw HTML string to parse
 * @param classToIdMap - Map of class names to Webflow style UUIDs
 * @returns Array of Webflow nodes and root node IDs
 */
export function compileHTMLToNodes(
  htmlString: string,
  classToIdMap: Map<string, string>
): CompileHTMLResult {
  // Parse HTML using htmlparser2
  const dom = htmlparser2.parseDocument(htmlString, {
    withStartIndices: false,
    withEndIndices: false,
  });

  const allNodes: WebflowNode[] = [];
  const rootNodeIds: string[] = [];

  // Extract content elements (skip document structure)
  const contentElements = extractContentElements(dom);

  // Process each content element
  for (const element of contentElements) {
    const nodeId = processElement(element, classToIdMap, allNodes);
    if (nodeId) {
      rootNodeIds.push(nodeId);
    }
  }

  return {
    nodes: allNodes,
    rootNodeIds,
  };
}

/**
 * Extracts only content elements, filtering out document structure tags
 * If a <body> tag is found, returns its children. Otherwise returns all elements.
 */
function extractContentElements(dom: any): Element[] {
  const contentElements: Element[] = [];

  function traverse(node: DomNode) {
    if (node instanceof Element) {
      const tag = node.name.toLowerCase();

      // If we find a body tag, extract its children
      if (tag === 'body') {
        for (const child of node.children) {
          if (child instanceof Element) {
            const childTag = child.name.toLowerCase();
            // Skip script tags even in body
            if (childTag !== 'script' && childTag !== 'style') {
              contentElements.push(child);
            }
          }
        }
        return; // Don't traverse further
      }

      // Skip document structure tags entirely
      if (DOCUMENT_STRUCTURE_TAGS.includes(tag)) {
        // But continue traversing their children to find body
        for (const child of node.children) {
          traverse(child);
        }
        return;
      }

      // This is a content element
      contentElements.push(node);
    }
  }

  // Start traversal from root
  for (const child of dom.children) {
    traverse(child);
  }

  return contentElements;
}

/**
 * Recursively processes an HTML element and its children
 * @param element - DOM element to process
 * @param classToIdMap - Map of class names to style UUIDs
 * @param allNodes - Array to accumulate all nodes
 * @param insideForm - Whether this element is inside a form
 * @returns The UUID of the created node
 */
function processElement(
  element: Element,
  classToIdMap: Map<string, string>,
  allNodes: WebflowNode[],
  insideForm: boolean = false
): string {
  const nodeId = uuidv4();
  const tag = element.name.toLowerCase();
  const type = getWebflowType(tag, element, insideForm);

  // Extract classes and map to UUIDs
  const classNames = extractClassNames(element);
  const classUUIDs = classNames
    .map((className) => classToIdMap.get(className))
    .filter((uuid): uuid is string => uuid !== undefined);

  // Extract attributes
  const attributes = extractAttributes(element, tag);

  // Build data object with correct field order (matches Relume/Webflow)
  // DOM type (Custom Element) has a different structure than other types
  let dataObject: any;

  if (type === "DOM") {
    // Custom Element (DOM) structure based on actual Webflow format
    console.log(`[HTML Parser] Creating Custom Element (DOM) for tag: <${tag}>`);

    // Extract HTML attributes and convert to Webflow format
    const htmlAttributes: Array<{name: string, value: string}> = [];
    if (element.attribs) {
      for (const [name, value] of Object.entries(element.attribs)) {
        // Skip class and id (handled separately)
        if (name !== 'class' && name !== 'id') {
          htmlAttributes.push({
            name: name,
            value: value || " " // Empty attributes get a space
          });
        }
      }
    }

    dataObject = {
      editable: true,
      tag: tag, // The actual custom tag (audio, video, canvas, etc.)
      attributes: htmlAttributes
    };
  } else {
    // Standard Webflow elements
    dataObject = {
      attr: attributes,
      xattr: [],
    };

    // All form-related types (they don't use text/tag, use form object instead)
    const formTypes = [
      "FormWrapper", "FormForm", "FormButton", "FormTextInput", "FormTextarea",
      "FormSelect", "FormBlockLabel", "FormInlineLabel", "FormRadioWrapper",
      "FormRadioInput", "FormCheckboxWrapper", "FormCheckboxInput",
      "FormSuccessMessage", "FormErrorMessage"
    ];

    // Determine which fields to add based on type
    const needsTextAndTag = ["Block", "Section", "Container"].includes(type);
    const needsTagOnly = ["Heading"].includes(type);
    const needsNeither = ["Paragraph", "Link", "Image", ...formTypes].includes(type);

    if (needsTextAndTag) {
      // Block and Form types: attr, xattr, text, tag, devlink, ...
      dataObject.text = false;
      dataObject.tag = tag;
    } else if (needsTagOnly) {
      // Heading types: attr, xattr, tag, devlink, ...
      dataObject.tag = tag;
    }
    // else needsNeither: attr, xattr, devlink, ... (no text or tag in data)

    // Add type-specific data BEFORE common fields (critical for Webflow!)
    // Order must be: attr, xattr, [text, tag], [type-specific], devlink, displayName, search, visibility
    const typeSpecificData = getTypeSpecificData(element, tag, type);
    Object.assign(dataObject, typeSpecificData);

    // Add remaining common fields in correct order
    dataObject.devlink = {
      runtimeProps: {},
      slot: "",
    };
    dataObject.displayName = "";
    // FormWrapper has search.exclude = true, all others have false
    dataObject.search = {
      exclude: type === "FormWrapper" ? true : false,
    };
    dataObject.visibility = {
      conditions: [],
    };
  }

  // Create Webflow element node with empty children (will be populated after)
  const webflowNode: WebflowElementNode = {
    _id: nodeId,
    classes: classUUIDs,
    type: type,
    tag: type === "DOM" ? "div" : tag, // DOM elements always use "div" at root level
    data: dataObject, // Already has everything in correct order
    children: [], // Empty for now
  };

  // IMPORTANT: Add parent node FIRST (before processing children)
  // This ensures parents appear before children in the nodes array (required by Webflow)
  allNodes.push(webflowNode);

  // NOW process children (they will be added after the parent)
  const childIds: string[] = [];

  // If this is a form element, mark all children as being inside a form
  const childrenInsideForm = tag === "form" || insideForm;

  for (const child of element.children) {
    if (child instanceof Element) {
      // Recursively process child elements, passing form context
      const childId = processElement(child, classToIdMap, allNodes, childrenInsideForm);
      childIds.push(childId);
    } else if (child instanceof Text) {
      // Process text nodes
      const textContent = child.data.trim();
      if (textContent.length > 0) {
        const textNodeId = createTextNode(textContent, allNodes);
        childIds.push(textNodeId);
      }
    }
  }

  // Update the node's children array with the processed child IDs
  webflowNode.children = childIds;

  return nodeId;
}

/**
 * Creates a text node
 */
function createTextNode(text: string, allNodes: WebflowNode[]): string {
  const textNodeId = uuidv4();

  const textNode: WebflowTextNode = {
    _id: textNodeId,
    text: true,
    v: text,
    children: [],
  };

  allNodes.push(textNode);
  return textNodeId;
}

/**
 * Gets the Webflow type for an HTML tag
 * For form inputs, checks the type attribute to determine the correct Webflow type
 * Only creates form elements when inside a form context
 */
function getWebflowType(tag: string, element?: Element, insideForm: boolean = false): WebflowNodeType {
  // Special handling for input elements - type attribute determines Webflow type
  if (tag === "input" && element) {
    const inputType = element.attribs["type"]?.toLowerCase() || "text";

    // Only create FormButton if inside a form, otherwise treat as regular Block
    if (inputType === "submit" || inputType === "button") {
      return insideForm ? "FormButton" : "Block";
    } else if (inputType === "radio") {
      return insideForm ? "FormRadioInput" : "Block";
    } else if (inputType === "checkbox") {
      return insideForm ? "FormCheckboxInput" : "Block";
    } else {
      // text, email, tel, password, etc. - only FormTextInput if inside form
      return insideForm ? "FormTextInput" : "Block";
    }
  }

  // textarea and select only become form elements if inside a form
  if (tag === "textarea") {
    return insideForm ? "FormTextarea" : "Block";
  }

  if (tag === "select") {
    return insideForm ? "FormSelect" : "Block";
  }

  if (tag === "label") {
    return insideForm ? "FormBlockLabel" : "Block";
  }

  // If tag is in the map, use the mapped type
  if (TAG_TO_TYPE_MAP[tag]) {
    return TAG_TO_TYPE_MAP[tag];
  }

  // For tags not in our map, use Custom Element (type "DOM") to preserve the original tag
  // This preserves semantic HTML5 tags like <article>, <figure>, <aside>, <main>, etc.
  return "DOM";
}

/**
 * Extracts class names from an element
 */
function extractClassNames(element: Element): string[] {
  const classAttr = element.attribs["class"];
  if (!classAttr) return [];

  return classAttr
    .split(/\s+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

/**
 * Extracts attributes from an element
 */
function extractAttributes(
  element: Element,
  tag: string
): WebflowAttributes {
  const attributes: WebflowAttributes = {
    id: element.attribs["id"] || "",
  };

  // Extract tag-specific attributes
  switch (tag) {
    case "img":
      attributes.width = element.attribs["width"] || "auto";
      attributes.height = element.attribs["height"] || "auto";
      attributes.alt = element.attribs["alt"] || "";
      attributes.src = element.attribs["src"] || "";
      const loadingAttr = element.attribs["loading"];
      attributes.loading = (loadingAttr === "eager" ? "eager" : "lazy") as "lazy" | "eager";
      break;

    case "a":
      // For links, href and target go in the link object, NOT in attr
      // attr should only have id for links
      break;

    case "form":
      attributes.name = element.attribs["name"] || "";
      attributes["data-name"] = element.attribs["data-name"] || element.attribs["name"] || "";
      attributes.action = element.attribs["action"] || "";
      attributes.method = element.attribs["method"] || "get";
      attributes.redirect = element.attribs["redirect"] || "";
      attributes["data-redirect"] = element.attribs["data-redirect"] || "";
      break;

    case "input":
      const inputType = element.attribs["type"] || "text";
      attributes.type = inputType;
      attributes.name = element.attribs["name"] || "";
      attributes["data-name"] = element.attribs["data-name"] || element.attribs["name"] || "";
      attributes.placeholder = element.attribs["placeholder"] || "";
      attributes.required = element.attribs["required"] !== undefined;
      attributes.disabled = element.attribs["disabled"] !== undefined;
      attributes.autofocus = element.attribs["autofocus"] !== undefined;

      if (inputType === "submit" || inputType === "button") {
        attributes.value = element.attribs["value"] || "Submit";
        attributes["data-wait"] = element.attribs["data-wait"] || "Please wait...";
      } else if (inputType === "radio" || inputType === "checkbox") {
        attributes.value = element.attribs["value"] || "";
        attributes.checked = element.attribs["checked"] !== undefined;
      } else {
        attributes.maxlength = parseInt(element.attribs["maxlength"]) || 256;
      }
      break;

    case "textarea":
      attributes.name = element.attribs["name"] || "";
      attributes["data-name"] = element.attribs["data-name"] || element.attribs["name"] || "";
      attributes.placeholder = element.attribs["placeholder"] || "";
      attributes.required = element.attribs["required"] !== undefined;
      attributes.autofocus = element.attribs["autofocus"] !== undefined;
      attributes.maxlength = parseInt(element.attribs["maxlength"]) || 5000;
      break;

    case "select":
      attributes.name = element.attribs["name"] || "";
      attributes["data-name"] = element.attribs["data-name"] || element.attribs["name"] || "";
      attributes.required = element.attribs["required"] !== undefined;
      attributes.multiple = element.attribs["multiple"] !== undefined;
      break;

    case "button":
      attributes.type = element.attribs["type"] || "button";
      break;

    case "label":
      attributes.for = element.attribs["for"] || "";
      break;
  }

  return attributes;
}

/**
 * Gets type-specific data for special Webflow node types
 */
function getTypeSpecificData(
  element: Element,
  tag: string,
  type: WebflowNodeType
): Partial<WebflowElementNode["data"]> {
  const data: any = {};

  switch (type) {
    case "Link":
      data.button = element.attribs["class"]?.includes("button") || false;
      data.block = "";
      data.link = {
        mode: element.attribs["href"]?.startsWith("http")
          ? "external"
          : "internal",
        url: element.attribs["href"] || "#",
      };
      data.eventIds = [];
      break;

    case "Image":
      data.img = {
        id: "", // Would need to be mapped to asset ID
      };
      data.srcsetDisabled = false;
      data.sizes = [];
      break;

    case "Grid":
      data.grid = "two-by-two";
      break;

    // Form elements
    case "FormWrapper":
      data.form = { type: "wrapper" };
      // Note: search.exclude will be set to true in common fields section
      break;

    case "FormForm":
      const formName = element.attribs["name"] || element.attribs["id"] || "Form";
      data.form = {
        type: "form",
        name: formName,
      };
      data.Source = {
        tag: "Default form",
        val: {},
      };
      break;

    case "FormButton":
      const buttonValue = element.attribs["value"] || "Submit";
      data.style = {
        base: {
          main: {
            noPseudo: { justifySelf: "start" },
          },
        },
      };
      data.form = { type: "button" };
      data.eventIds = [];
      break;

    case "FormTextInput":
      const inputName = element.attribs["name"] || element.attribs["id"] || "Field";
      data.form = {
        type: "input",
        name: inputName,
        passwordPage: false,
      };
      break;

    case "FormTextarea":
      const textareaName = element.attribs["name"] || element.attribs["id"] || "Message";
      data.form = {
        type: "textarea",
        name: textareaName,
      };
      break;

    case "FormSelect":
      const selectName = element.attribs["name"] || element.attribs["id"] || "Select";
      // TODO: Parse <option> elements from children
      data.form = {
        type: "select",
        opts: [
          { v: "", t: "Select one..." },
          { v: "Option 1", t: "Option 1" },
        ],
        name: selectName,
      };
      break;

    case "FormBlockLabel":
      data.form = {
        type: "label",
        passwordPage: false,
      };
      break;

    case "FormInlineLabel":
      // Type determined by parent (radio or checkbox)
      data.form = {
        type: "radio-label", // Will be updated based on context
      };
      break;

    case "FormRadioInput":
      const radioName = element.attribs["name"] || "Radio";
      data.form = {
        type: "radio-input",
        name: radioName,
      };
      data.inputType = "custom";
      break;

    case "FormCheckboxInput":
      const checkboxName = element.attribs["name"] || "Checkbox";
      data.form = {
        type: "checkbox-input",
        name: checkboxName,
      };
      data.inputType = "custom";
      break;

    case "FormRadioWrapper":
      data.form = { type: "radio" };
      break;

    case "FormCheckboxWrapper":
      data.form = { type: "checkbox" };
      break;

    case "FormSuccessMessage":
      data.form = { type: "msg-done" };
      break;

    case "FormErrorMessage":
      data.form = { type: "msg-fail" };
      break;
  }

  return data;
}

/**
 * Helper function to compile HTML with inline styles
 * Extracts styles and classes automatically
 */
export function compileHTMLWithStyles(
  htmlString: string
): {
  nodes: WebflowNode[];
  rootNodeIds: string[];
  classToIdMap: Map<string, string>;
} {
  // Parse HTML to find all classes
  const dom = htmlparser2.parseDocument(htmlString);
  const classNames = new Set<string>();

  function extractClasses(node: DomNode) {
    if (node instanceof Element) {
      const classAttr = node.attribs["class"];
      if (classAttr) {
        classAttr
          .split(/\s+/)
          .forEach((className) => classNames.add(className.trim()));
      }
      node.children.forEach(extractClasses);
    }
  }

  dom.children.forEach(extractClasses);

  // Create style map with UUIDs for all classes
  const classToIdMap = new Map<string, string>();
  Array.from(classNames).forEach((className) => {
    if (className.length > 0) {
      classToIdMap.set(className, uuidv4());
    }
  });

  // Compile HTML to nodes
  const result = compileHTMLToNodes(htmlString, classToIdMap);

  return {
    ...result,
    classToIdMap,
  };
}

/**
 * Splits compiled HTML into smaller chunks for easier pasting into Webflow
 * Each chunk contains all styles but only a subset of nodes
 * @param nodes - All compiled nodes
 * @param rootNodeIds - Root node IDs from compilation
 * @param maxNodesPerChunk - Maximum nodes per chunk (default: 100)
 * @returns Array of chunks with labels
 */
export function splitIntoChunks(
  nodes: WebflowNode[],
  rootNodeIds: string[],
  maxNodesPerChunk: number = 100
): WebflowChunk[] {
  const chunks: WebflowChunk[] = [];

  // Helper function to count all nodes in a subtree
  function countNodesInSubtree(nodeId: string): number {
    const node = nodes.find((n) => n._id === nodeId);
    if (!node) return 0;

    let count = 1; // Count this node

    if ("children" in node && node.children) {
      for (const childId of node.children) {
        count += countNodesInSubtree(childId);
      }
    }

    return count;
  }

  // Helper function to collect all nodes in a subtree
  function collectSubtreeNodes(nodeId: string, collected: Set<string>) {
    collected.add(nodeId);
    const node = nodes.find((n) => n._id === nodeId);

    if (node && "children" in node && node.children) {
      for (const childId of node.children) {
        collectSubtreeNodes(childId, collected);
      }
    }
  }

  // Helper function to get semantic label for a node
  function getNodeLabel(nodeId: string): string {
    const node = nodes.find((n) => n._id === nodeId);
    if (!node || "text" in node) return "Content";

    const elementNode = node as WebflowElementNode;
    const tag = elementNode.tag.toLowerCase();

    // Map tags to user-friendly labels
    const labelMap: Record<string, string> = {
      header: "Header",
      nav: "Navigation",
      section: "Section",
      footer: "Footer",
      main: "Main Content",
      article: "Article",
      aside: "Sidebar",
      form: "Form",
    };

    return labelMap[tag] || "Content";
  }

  let currentChunkNodes = new Set<string>();
  let currentChunkRoots: string[] = [];
  let chunkIndex = 1;

  for (const rootId of rootNodeIds) {
    const subtreeSize = countNodesInSubtree(rootId);

    // If adding this root would exceed the limit, start a new chunk
    if (currentChunkNodes.size > 0 && currentChunkNodes.size + subtreeSize > maxNodesPerChunk) {
      // Finalize current chunk
      const chunkNodes = nodes.filter((n) => currentChunkNodes.has(n._id));
      const label = currentChunkRoots.length === 1
        ? getNodeLabel(currentChunkRoots[0])
        : `Chunk ${chunkIndex}`;

      chunks.push({
        label,
        nodes: chunkNodes,
        nodeCount: chunkNodes.length,
      });

      chunkIndex++;
      currentChunkNodes = new Set<string>();
      currentChunkRoots = [];
    }

    // Add this root to current chunk
    collectSubtreeNodes(rootId, currentChunkNodes);
    currentChunkRoots.push(rootId);
  }

  // Add final chunk if it has content
  if (currentChunkNodes.size > 0) {
    const chunkNodes = nodes.filter((n) => currentChunkNodes.has(n._id));
    const label = currentChunkRoots.length === 1
      ? getNodeLabel(currentChunkRoots[0])
      : chunkIndex === 1
        ? "Complete Page"
        : `Chunk ${chunkIndex}`;

    chunks.push({
      label,
      nodes: chunkNodes,
      nodeCount: chunkNodes.length,
    });
  }

  return chunks;
}

/**
 * Extracts JavaScript from HTML <script> tags
 * @param htmlString - Raw HTML string
 * @returns Extracted JavaScript code
 */
export function extractJavaScriptFromHTML(htmlString: string): string {
  const scriptParts: string[] = [];

  // Match <script> tags - both with src and inline content
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(htmlString)) !== null) {
    const attributes = match[1];
    const scriptContent = match[2].trim();

    // Check if this is an external script (has src attribute)
    const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);

    if (srcMatch) {
      const srcUrl = srcMatch[1];

      // Only include if it's a CDN/external URL (starts with http://, https://, or //)
      // Skip local file references like "script.js"
      if (srcUrl.match(/^(https?:)?\/\//)) {
        scriptParts.push(`<script src="${srcUrl}"></script>`);
      } else {
        console.warn(`[HTML Parser] Skipping local script reference: ${srcUrl}`);
      }
    }

    // Add inline script content if present
    if (scriptContent.length > 0) {
      scriptParts.push(scriptContent);
    }
  }

  return scriptParts.join('\n\n');
}

/**
 * Creates an HTML Embed element for custom CSS and JavaScript
 * @param customCSS - Custom CSS to embed (media queries, pseudo-selectors, etc.)
 * @param customJS - Custom JavaScript to embed (optional)
 * @returns Webflow HTML Embed element node
 */
export function createHTMLEmbedNode(
  customCSS?: string,
  customJS?: string
): WebflowElementNode {
  const uuid = uuidv4();
  let embedHTML = "";

  // Add custom CSS in a <style> tag
  if (customCSS && customCSS.trim().length > 0) {
    embedHTML += `<style>\n${customCSS}\n</style>\n`;
  }

  // Add custom JavaScript in a <script> tag
  if (customJS && customJS.trim().length > 0) {
    embedHTML += `<script>\n${customJS}\n</script>`;
  }

  // Create HTML Embed element
  const embedNode: WebflowElementNode = {
    _id: uuid,
    type: "HtmlEmbed",
    tag: "div",
    data: {
      attr: {
        id: "",
      },
      xattr: [],
      text: false,
      tag: "div",
      devlink: {
        runtimeProps: {},
        slot: "",
      },
      displayName: "",
      search: {
        exclude: false,
      },
      visibility: {
        conditions: [],
      },
      embed: {
        type: "code",
        content: embedHTML,
      },
    },
    children: [],
  };

  console.log(`[HTML Parser] Created HTML Embed with ${customCSS ? 'CSS' : ''}${customCSS && customJS ? ' and ' : ''}${customJS ? 'JavaScript' : ''}`);

  return embedNode;
}

/**
 * Flattens the node tree for easier debugging
 */
export function debugNodeTree(
  nodes: WebflowNode[],
  rootIds: string[],
  indent: number = 0
): string {
  let output = "";
  const indentStr = "  ".repeat(indent);

  for (const rootId of rootIds) {
    const node = nodes.find((n) => n._id === rootId);
    if (!node) continue;

    if ("text" in node && node.text) {
      output += `${indentStr}[TEXT] "${node.v}"\n`;
    } else {
      const elementNode = node as WebflowElementNode;
      output += `${indentStr}<${elementNode.tag}> (${elementNode.type}) [${elementNode._id.substring(0, 8)}...]\n`;

      if (elementNode.classes && elementNode.classes.length > 0) {
        output += `${indentStr}  classes: [${elementNode.classes.length} class(es)]\n`;
      }

      if (elementNode.children.length > 0) {
        output += debugNodeTree(nodes, elementNode.children, indent + 1);
      }
    }
  }

  return output;
}
