// Webflow Clipboard Format Types (@webflow/XscpData)

// Main structure
export interface WebflowClipboardData {
  type: "@webflow/XscpData";
  payload: WebflowPayload;
  meta: WebflowMeta;
}

export interface WebflowPayload {
  nodes: WebflowNode[];
  styles: WebflowStyle[];
  assets: WebflowAsset[];
  ix1: any[];
  ix2: WebflowInteractions;
}

// Node types
export type WebflowNode = WebflowElementNode | WebflowTextNode;

export interface WebflowElementNode {
  _id: string;
  classes?: string[];
  type: WebflowNodeType;
  tag: string;
  data?: WebflowNodeData;
  children: string[];
  text?: false;
}

export interface WebflowTextNode {
  _id: string;
  text: true;
  v: string;
  children: [];
}

export type WebflowNodeType =
  | "Block"
  | "Grid"
  | "Heading"
  | "Paragraph"
  | "Link"
  | "Image"
  | "Section"
  | "Container"
  | "List"
  | "ListItem"
  | "FormWrapper"
  | "FormForm"
  | "FormButton"
  | "FormTextInput"
  | string; // Allow for other node types

// Node data structure
export interface WebflowNodeData {
  attr: WebflowAttributes;
  xattr: any[];
  text?: boolean;
  tag?: string;
  devlink: WebflowDevlink;
  displayName: string;
  search: WebflowSearch;
  visibility: WebflowVisibility;
  // Grid specific
  grid?: string;
  // Link specific
  button?: boolean;
  block?: string;
  link?: WebflowLink;
  eventIds?: string[];
  // Image specific
  img?: WebflowImageRef;
  srcsetDisabled?: boolean;
  sizes?: any[];
}

export interface WebflowAttributes {
  id: string;
  // Image attributes
  width?: string;
  height?: string;
  alt?: string;
  src?: string;
  loading?: "lazy" | "eager";
  // Link attributes
  href?: string;
  target?: string;
  // Other common attributes
  [key: string]: string | undefined;
}

export interface WebflowDevlink {
  runtimeProps: Record<string, any>;
  slot: string;
}

export interface WebflowSearch {
  exclude: boolean;
}

export interface WebflowVisibility {
  conditions: any[];
}

export interface WebflowLink {
  mode: "external" | "internal" | "email" | "phone";
  url: string;
}

export interface WebflowImageRef {
  id: string;
}

// Style types
export interface WebflowStyle {
  _id: string;
  fake: boolean;
  type: "class" | "tag" | "combo";
  name: string;
  namespace: string;
  comb: string;
  styleLess: string;
  variants: WebflowStyleVariants;
  children: string[];
  origin: string | null;
  selector: string | null;
  createdBy?: string;
}

export interface WebflowStyleVariants {
  [breakpoint: string]: {
    styleLess: string;
  };
}

// Asset types
export interface WebflowAsset {
  _id: string;
  siteId: string;
  fileName: string;
  cdnUrl: string;
  width: number;
  height: number;
  isHD: boolean;
  createdOn: string;
  origFileName: string;
  fileHash: string;
  translationLoading: boolean;
  variants: any[];
  mimeType: string;
  isFromWellKnownFolder: boolean;
  s3Url: string;
  thumbUrl: string;
  updatedOn: string;
  fileSize: number;
  localizedSettings: Record<string, any>;
}

// Interactions (ix2)
export interface WebflowInteractions {
  interactions: any[];
  events: any[];
  actionLists: any[];
}

// Meta information
export interface WebflowMeta {
  unlinkedSymbolCount: number;
  droppedLinks: number;
  dynBindRemovedCount: number;
  dynListBindRemovedCount: number;
  paginationRemovedCount: number;
}

// Type guards
export function isTextNode(node: WebflowNode): node is WebflowTextNode {
  return node.text === true;
}

export function isElementNode(node: WebflowNode): boolean {
  return !node.text;
}
