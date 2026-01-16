import { parseCSSToWebflow, extractClassNamesFromCSS, parseCSSWithMediaQueries } from "../css-parser";

describe("CSS Parser", () => {
  describe("parseCSSToWebflow", () => {
    it("should parse simple CSS and generate UUIDs", () => {
      const css = `
        .button {
          padding: 10px 20px;
          background-color: blue;
          color: white;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
      `;

      const classNames = ["button", "container"];
      const result = parseCSSToWebflow(css, classNames);

      // Check that we have 2 styles
      expect(result.styles).toHaveLength(2);

      // Check that map has correct entries
      expect(result.classToIdMap.size).toBe(2);
      expect(result.classToIdMap.has("button")).toBe(true);
      expect(result.classToIdMap.has("container")).toBe(true);

      // Check UUID format (should be valid UUID v4)
      const buttonId = result.classToIdMap.get("button")!;
      expect(buttonId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      // Check style objects
      const buttonStyle = result.styles.find((s) => s.name === "button");
      expect(buttonStyle).toBeDefined();
      expect(buttonStyle?._id).toBe(buttonId);
      expect(buttonStyle?.type).toBe("class");
      expect(buttonStyle?.styleLess).toContain("padding: 10px 20px");
      expect(buttonStyle?.styleLess).toContain("background-color: blue");
      expect(buttonStyle?.styleLess).toContain("color: white");
    });

    it("should handle classes not found in CSS", () => {
      const css = `
        .button {
          padding: 10px;
        }
      `;

      const classNames = ["button", "nonexistent"];
      const result = parseCSSToWebflow(css, classNames);

      expect(result.styles).toHaveLength(2);

      const nonexistentStyle = result.styles.find((s) => s.name === "nonexistent");
      expect(nonexistentStyle).toBeDefined();
      expect(nonexistentStyle?.styleLess).toBe("");
    });

    it("should clean CSS properties correctly", () => {
      const css = `
        .test {
          padding-top: 1rem;
          margin-bottom: 2rem;
          border-radius: 5px;
        }
      `;

      const result = parseCSSToWebflow(css, ["test"]);
      const testStyle = result.styles[0];

      expect(testStyle.styleLess).toBe(
        "padding-top: 1rem; margin-bottom: 2rem; border-radius: 5px"
      );
    });
  });

  describe("extractClassNamesFromCSS", () => {
    it("should extract all class names from CSS", () => {
      const css = `
        .button { color: red; }
        .container { width: 100%; }
        .header { font-size: 2rem; }
        .button:hover { color: blue; }
      `;

      const classNames = extractClassNamesFromCSS(css);

      expect(classNames).toContain("button");
      expect(classNames).toContain("container");
      expect(classNames).toContain("header");
      expect(classNames).toHaveLength(3); // button should not be duplicated
    });
  });

  describe("parseCSSWithMediaQueries", () => {
    it("should parse CSS with media queries into variants", () => {
      const css = `
        .responsive {
          font-size: 16px;
          padding: 20px;
        }

        @media (max-width: 767px) {
          .responsive {
            font-size: 14px;
            padding: 10px;
          }
        }

        @media (max-width: 479px) {
          .responsive {
            font-size: 12px;
            padding: 5px;
          }
        }
      `;

      const result = parseCSSWithMediaQueries(css, ["responsive"]);
      const style = result.styles[0];

      // Check base styles
      expect(style.styleLess).toContain("font-size: 16px");
      expect(style.styleLess).toContain("padding: 20px");

      // Check variants
      expect(style.variants.small).toBeDefined();
      expect(style.variants.small.styleLess).toContain("font-size: 14px");
      expect(style.variants.small.styleLess).toContain("padding: 10px");

      expect(style.variants.tiny).toBeDefined();
      expect(style.variants.tiny.styleLess).toContain("font-size: 12px");
      expect(style.variants.tiny.styleLess).toContain("padding: 5px");
    });
  });
});
