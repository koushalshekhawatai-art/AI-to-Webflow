import { v4 as uuidv4 } from "uuid";
import { WebflowStyle } from "@/types/webflow";

export interface ParsedCSSResult {
  classToIdMap: Map<string, string>;
  styles: WebflowStyle[];
  customCSS?: string; // Advanced CSS that needs to go in HTML Embed
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

  // Extract CSS variables from :root
  const cssVariables = extractCSSVariables(cssString);

  // Parse CSS into rules
  const cssRules = parseCSSRules(cssString);

  // Process each requested class name
  for (const className of classNames) {
    const uuid = uuidv4();
    classToIdMap.set(className, uuid);

    // Find the CSS rule for this class
    const rule = findRuleForClass(cssRules, className);

    if (rule) {
      // Resolve CSS variables in properties
      const resolvedProperties = rule.properties.map((prop) =>
        resolveCSSVariables(prop, cssVariables)
      );

      // Convert CSS properties to Webflow styleLess format
      const styleLess = convertToStyleLess(resolvedProperties);

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

  // Extract advanced CSS (media queries, pseudo-selectors, etc.)
  const customCSS = extractAdvancedCSS(cssString);

  return { classToIdMap, styles, customCSS };
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

  // Extract CSS variables from :root
  const cssVariables = extractCSSVariables(cssString);

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
      ? convertToStyleLess(
          baseRule.properties.map((prop) =>
            resolveCSSVariables(prop, cssVariables)
          )
        )
      : "";

    // Find variant rules from media queries
    const variants: Record<string, { styleLess: string }> = {};

    for (const [breakpoint, rules] of Object.entries(mediaQueries)) {
      const variantRule = findRuleForClass(rules, className);
      if (variantRule) {
        variants[breakpoint] = {
          styleLess: convertToStyleLess(
            variantRule.properties.map((prop) =>
              resolveCSSVariables(prop, cssVariables)
            )
          ),
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

/**
 * Extracts CSS custom properties (variables) from :root selector
 * @param cssString - Raw CSS string
 * @returns Map of variable names (without --) to their values
 */
function extractCSSVariables(cssString: string): Map<string, string> {
  const variables = new Map<string, string>();

  // Remove comments
  const cleanedCSS = cssString.replace(/\/\*[\s\S]*?\*\//g, "");

  // Find :root block with proper bracket matching
  const rootStart = cleanedCSS.indexOf(":root");
  if (rootStart === -1) return variables;

  const openBrace = cleanedCSS.indexOf("{", rootStart);
  if (openBrace === -1) return variables;

  // Count brackets to find matching closing brace
  let braceCount = 1;
  let currentPos = openBrace + 1;
  let closeBrace = -1;

  while (currentPos < cleanedCSS.length && braceCount > 0) {
    if (cleanedCSS[currentPos] === "{") braceCount++;
    if (cleanedCSS[currentPos] === "}") braceCount--;
    if (braceCount === 0) {
      closeBrace = currentPos;
      break;
    }
    currentPos++;
  }

  if (closeBrace === -1) return variables;

  const rootContent = cleanedCSS.substring(openBrace + 1, closeBrace);

  // Extract CSS variables (--variable-name: value;)
  const variableRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let varMatch;

  while ((varMatch = variableRegex.exec(rootContent)) !== null) {
    const varName = varMatch[1].trim();
    const varValue = varMatch[2].trim();
    variables.set(varName, varValue);
  }

  return variables;
}

/**
 * Resolves CSS variables in a property string
 * Replaces var(--variable-name) with actual values
 * @param property - CSS property string (e.g., "color: var(--color-primary)")
 * @param variables - Map of variable names to values
 * @returns Property with resolved variables
 */
function resolveCSSVariables(
  property: string,
  variables: Map<string, string>
): string {
  // Match var(--variable-name) or var(--variable-name, fallback)
  const varRegex = /var\(\s*--([\w-]+)\s*(?:,\s*([^)]+))?\)/g;

  return property.replace(varRegex, (match, varName, fallback) => {
    // Look up the variable value
    const value = variables.get(varName);

    if (value !== undefined) {
      // If the value itself contains a variable, resolve it recursively
      if (value.includes("var(")) {
        return resolveCSSVariables(value, variables);
      }
      return value;
    }

    // If not found, use fallback or return original
    if (fallback) {
      return fallback.trim();
    }

    return match; // Keep original if no value and no fallback
  });
}

/**
 * Extracts advanced CSS that can't be handled by Webflow's style system
 * This includes: media queries, pseudo-selectors (:hover, :focus, etc.),
 * keyframes, and other @-rules
 * @param cssString - Raw CSS string
 * @returns Custom CSS string to be embedded in HTML Embed element
 */
function extractAdvancedCSS(cssString: string): string {
  const advancedCSS: string[] = [];

  // Remove comments
  const cleanedCSS = cssString.replace(/\/\*[\s\S]*?\*\//g, "");

  // Extract media queries
  const mediaQueryRegex = /@media[^{]+\{[\s\S]*?\n\}/g;
  let match;

  while ((match = mediaQueryRegex.exec(cleanedCSS)) !== null) {
    advancedCSS.push(match[0]);
  }

  // Extract keyframes
  const keyframesRegex = /@keyframes[^{]+\{[\s\S]*?\n\}/g;
  while ((match = keyframesRegex.exec(cleanedCSS)) !== null) {
    advancedCSS.push(match[0]);
  }

  // Extract pseudo-selector rules (:hover, :focus, :active, ::before, ::after, etc.)
  const pseudoRegex = /([.#\w\-\s,>+~\[\]="':]+)(:hover|:focus|:active|:visited|:disabled|::before|::after|::placeholder|:first-child|:last-child|:nth-child)([^{]*)\{([^}]+)\}/g;
  while ((match = pseudoRegex.exec(cleanedCSS)) !== null) {
    // match[0] is the full match, reconstruct it properly
    const selector = match[1].trim() + match[2] + match[3];
    const properties = match[4];
    advancedCSS.push(`${selector} {\n${properties}\n}`);
  }

  // Join all advanced CSS
  const result = advancedCSS.join('\n\n');

  if (result.length > 0) {
    console.log(`[CSS Parser] Extracted ${advancedCSS.length} advanced CSS rules for HTML Embed`);
  }

  return result;
}
