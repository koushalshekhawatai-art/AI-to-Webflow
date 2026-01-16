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

  // Forms
  form: "FormWrapper",
  input: "FormTextInput",
  button: "FormButton",
  textarea: "FormTextInput",
  label: "Block",

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
 * @returns The UUID of the created node
 */
function processElement(
  element: Element,
  classToIdMap: Map<string, string>,
  allNodes: WebflowNode[]
): string {
  const nodeId = uuidv4();
  const tag = element.name.toLowerCase();
  const type = getWebflowType(tag);

  // Extract classes and map to UUIDs
  const classNames = extractClassNames(element);
  const classUUIDs = classNames
    .map((className) => classToIdMap.get(className))
    .filter((uuid): uuid is string => uuid !== undefined);

  // Extract attributes
  const attributes = extractAttributes(element, tag);

  // Build data object with correct field order (matches Relume/Webflow)
  // Different element types have different requirements for text/tag fields in data:
  // - Block/Container/Section: need text=false AND tag
  // - Heading: needs tag (no text field)
  // - Paragraph/Link: NO tag, NO text field in data
  // - Form elements (FormButton, etc.): need text=false AND tag

  const dataObject: any = {
    attr: attributes,
    xattr: [],
  };

  // Determine which fields to add based on type
  const needsTextAndTag = [
    "Block", "Section", "Container",
    "FormButton", "FormTextInput", "FormWrapper", "FormForm"
  ].includes(type);

  const needsTagOnly = ["Heading"].includes(type);

  const needsNeither = ["Paragraph", "Link", "Image"].includes(type);

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
  dataObject.search = {
    exclude: false,
  };
  dataObject.visibility = {
    conditions: [],
  };

  // Create Webflow element node with empty children (will be populated after)
  const webflowNode: WebflowElementNode = {
    _id: nodeId,
    classes: classUUIDs,
    type: type,
    tag: tag,
    data: dataObject, // Already has everything in correct order
    children: [], // Empty for now
  };

  // IMPORTANT: Add parent node FIRST (before processing children)
  // This ensures parents appear before children in the nodes array (required by Webflow)
  allNodes.push(webflowNode);

  // NOW process children (they will be added after the parent)
  const childIds: string[] = [];

  for (const child of element.children) {
    if (child instanceof Element) {
      // Recursively process child elements
      const childId = processElement(child, classToIdMap, allNodes);
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
 */
function getWebflowType(tag: string): WebflowNodeType {
  return TAG_TO_TYPE_MAP[tag] || "Block";
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

    case "input":
    case "textarea":
      attributes.type = element.attribs["type"] || "text";
      attributes.name = element.attribs["name"] || "";
      attributes.placeholder = element.attribs["placeholder"] || "";
      break;

    case "button":
      attributes.type = element.attribs["type"] || "button";
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
