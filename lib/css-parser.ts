import { v4 as uuidv4 } from "uuid";
import { WebflowStyle } from "@/types/webflow";

export interface ParsedCSSResult {
  classToIdMap: Map<string, string>;
  styles: WebflowStyle[];
}

interface CSSRule {
  selector: string;
  properties: string[];
}

/**
 * Parses raw CSS string and converts it to Webflow style format
 * @param cssString - Raw CSS string to parse
 * @param classNames - List of class names to process (without leading dot)
 * @returns Map of className to UUID and array of Webflow style objects
 */
export function parseCSSToWebflow(
  cssString: string,
  classNames: string[]
): ParsedCSSResult {
  const classToIdMap = new Map<string, string>();
  const styles: WebflowStyle[] = [];

  // Parse CSS into rules
  const cssRules = parseCSSRules(cssString);

  // Process each requested class name
  for (const className of classNames) {
    const uuid = uuidv4();
    classToIdMap.set(className, uuid);

    // Find the CSS rule for this class
    const rule = findRuleForClass(cssRules, className);

    if (rule) {
      // Convert CSS properties to Webflow styleLess format
      const styleLess = convertToStyleLess(rule.properties);

      // Create Webflow style object
      const webflowStyle: WebflowStyle = {
        _id: uuid,
        fake: false,
        type: "class",
        name: className,
        namespace: "",
        comb: "",
        styleLess: styleLess,
        variants: {},
        children: [],
        origin: null,
        selector: null,
      };

      styles.push(webflowStyle);
    } else {
      // Class not found in CSS, create empty style
      const webflowStyle: WebflowStyle = {
        _id: uuid,
        fake: false,
        type: "class",
        name: className,
        namespace: "",
        comb: "",
        styleLess: "",
        variants: {},
        children: [],
        origin: null,
        selector: null,
      };

      styles.push(webflowStyle);
    }
  }

  return { classToIdMap, styles };
}

/**
 * Parses CSS string into structured rules
 */
function parseCSSRules(cssString: string): CSSRule[] {
  const rules: CSSRule[] = [];

  // Remove comments
  const cleanedCSS = cssString.replace(/\/\*[\s\S]*?\*\//g, "");

  // Match CSS rules: selector { properties }
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleanedCSS)) !== null) {
    const selector = match[1].trim();
    const propertiesBlock = match[2].trim();

    // Split properties by semicolon
    const properties = propertiesBlock
      .split(";")
      .map((prop) => prop.trim())
      .filter((prop) => prop.length > 0);

    rules.push({ selector, properties });
  }

  return rules;
}

/**
 * Finds a CSS rule for a specific class name
 */
function findRuleForClass(rules: CSSRule[], className: string): CSSRule | null {
  // Look for .className selector
  const targetSelector = `.${className}`;

  for (const rule of rules) {
    // Check if the selector matches (exact match or starts with the class)
    if (
      rule.selector === targetSelector ||
      rule.selector.startsWith(`${targetSelector} `) ||
      rule.selector.startsWith(`${targetSelector}:`) ||
      rule.selector.startsWith(`${targetSelector}.`)
    ) {
      return rule;
    }
  }

  return null;
}

/**
 * Converts CSS properties to Webflow's styleLess format
 * Webflow uses: property-name: value; property-name: value;
 */
function convertToStyleLess(properties: string[]): string {
  const cleaned = properties.map((prop) => {
    // Clean up the property
    let cleanProp = prop.trim();

    // Remove curly braces if present
    cleanProp = cleanProp.replace(/[{}]/g, "");

    // Ensure proper spacing around colon
    cleanProp = cleanProp.replace(/\s*:\s*/, ": ");

    // Remove trailing semicolon if present
    cleanProp = cleanProp.replace(/;$/, "");

    return cleanProp;
  });

  // Join with semicolon and space
  return cleaned.filter((p) => p.length > 0).join("; ");
}

/**
 * Extracts all class names from a CSS string
 */
export function extractClassNamesFromCSS(cssString: string): string[] {
  const classNames = new Set<string>();

  // Remove comments
  const cleanedCSS = cssString.replace(/\/\*[\s\S]*?\*\//g, "");

  // Parse CSS rules to extract class selectors only from selector position
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleanedCSS)) !== null) {
    const selector = match[1].trim();

    // Extract class names from the selector
    // Match .className but ensure it starts with a letter (not a number)
    const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
    let classMatch;

    while ((classMatch = classRegex.exec(selector)) !== null) {
      classNames.add(classMatch[1]);
    }
  }

  return Array.from(classNames);
}

/**
 * Parses responsive CSS with media queries and converts to Webflow variants
 */
export function parseCSSWithMediaQueries(
  cssString: string,
  classNames: string[]
): ParsedCSSResult {
  const classToIdMap = new Map<string, string>();
  const styles: WebflowStyle[] = [];

  // Parse base CSS (outside media queries)
  const baseCSSRules = parseCSSRules(cssString);

  // Parse media queries
  const mediaQueries = parseMediaQueries(cssString);

  // Process each class name
  for (const className of classNames) {
    const uuid = uuidv4();
    classToIdMap.set(className, uuid);

    // Find base rule
    const baseRule = findRuleForClass(baseCSSRules, className);
    const baseStyleLess = baseRule
      ? convertToStyleLess(baseRule.properties)
      : "";

    // Find variant rules from media queries
    const variants: Record<string, { styleLess: string }> = {};

    for (const [breakpoint, rules] of Object.entries(mediaQueries)) {
      const variantRule = findRuleForClass(rules, className);
      if (variantRule) {
        variants[breakpoint] = {
          styleLess: convertToStyleLess(variantRule.properties),
        };
      }
    }

    const webflowStyle: WebflowStyle = {
      _id: uuid,
      fake: false,
      type: "class",
      name: className,
      namespace: "",
      comb: "",
      styleLess: baseStyleLess,
      variants: variants,
      children: [],
      origin: null,
      selector: null,
    };

    styles.push(webflowStyle);
  }

  return { classToIdMap, styles };
}

/**
 * Parses media queries and maps them to Webflow breakpoints
 */
function parseMediaQueries(
  cssString: string
): Record<string, CSSRule[]> {
  const mediaQueries: Record<string, CSSRule[]> = {};

  // Remove comments
  const cleanedCSS = cssString.replace(/\/\*[\s\S]*?\*\//g, "");

  // Match media queries
  const mediaQueryRegex = /@media\s*([^{]+)\{([\s\S]*?)\n\}/g;
  let match;

  while ((match = mediaQueryRegex.exec(cleanedCSS)) !== null) {
    const mediaCondition = match[1].trim();
    const mediaContent = match[2];

    // Map media query to Webflow breakpoint
    const breakpoint = mapMediaQueryToBreakpoint(mediaCondition);

    if (breakpoint) {
      const rules = parseCSSRules(mediaContent);
      mediaQueries[breakpoint] = rules;
    }
  }

  return mediaQueries;
}

/**
 * Maps CSS media queries to Webflow breakpoints
 * Webflow breakpoints: tiny, small, medium, large (default)
 */
function mapMediaQueryToBreakpoint(mediaCondition: string): string | null {
  const condition = mediaCondition.toLowerCase();

  // Webflow breakpoints (approximate):
  // tiny: max-width: 479px
  // small: max-width: 767px
  // medium: max-width: 991px
  // large: default (no media query)

  if (condition.includes("max-width")) {
    if (condition.includes("479px") || condition.includes("480px")) {
      return "tiny";
    } else if (condition.includes("767px") || condition.includes("768px")) {
      return "small";
    } else if (condition.includes("991px") || condition.includes("992px")) {
      return "medium";
    }
  }

  // You can add more sophisticated mapping logic here
  return null;
}
