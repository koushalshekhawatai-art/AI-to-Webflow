import {
  compileHTMLToNodes,
  compileHTMLWithStyles,
} from "../html-parser";

describe("HTML Parser", () => {
  describe("compileHTMLToNodes", () => {
    it("should parse simple HTML and create nodes", () => {
      const html = `<div class="container"><h1>Hello</h1></div>`;
      const classMap = new Map([["container", "uuid-123"]]);

      const result = compileHTMLToNodes(html, classMap);

      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.rootNodeIds.length).toBe(1);

      // Find the container div
      const containerNode: any = result.nodes.find(
        (n: any) => n.tag === "div"
      );
      expect(containerNode).toBeDefined();
      expect(containerNode.classes).toContain("uuid-123");
      expect(containerNode.type).toBe("Block");
    });

    it("should handle text nodes correctly", () => {
      const html = `<p>Hello World</p>`;
      const classMap = new Map();

      const result = compileHTMLToNodes(html, classMap);

      // Should have 2 nodes: p element and text node
      expect(result.nodes.length).toBe(2);

      const textNode = result.nodes.find((n: any) => n.text === true);
      expect(textNode).toBeDefined();
      expect((textNode as any).v).toBe("Hello World");
    });

    it("should map HTML tags to correct Webflow types", () => {
      const html = `
        <div>Block</div>
        <h1>Heading</h1>
        <p>Paragraph</p>
        <a href="#">Link</a>
        <img src="test.jpg" alt="test" />
      `;
      const classMap = new Map();

      const result = compileHTMLToNodes(html, classMap);

      const divNode: any = result.nodes.find((n: any) => n.tag === "div");
      const h1Node: any = result.nodes.find((n: any) => n.tag === "h1");
      const pNode: any = result.nodes.find((n: any) => n.tag === "p");
      const aNode: any = result.nodes.find((n: any) => n.tag === "a");
      const imgNode: any = result.nodes.find((n: any) => n.tag === "img");

      expect(divNode?.type).toBe("Block");
      expect(h1Node?.type).toBe("Heading");
      expect(pNode?.type).toBe("Paragraph");
      expect(aNode?.type).toBe("Link");
      expect(imgNode?.type).toBe("Image");
    });

    it("should handle nested elements recursively", () => {
      const html = `
        <div class="outer">
          <div class="inner">
            <p class="text">Content</p>
          </div>
        </div>
      `;
      const classMap = new Map([
        ["outer", "uuid-1"],
        ["inner", "uuid-2"],
        ["text", "uuid-3"],
      ]);

      const result = compileHTMLToNodes(html, classMap);

      // Find outer div
      const outerDiv: any = result.nodes.find(
        (n: any) => n.classes?.includes("uuid-1")
      );
      expect(outerDiv).toBeDefined();
      expect(outerDiv.children.length).toBeGreaterThan(0);

      // Find inner div
      const innerDiv: any = result.nodes.find(
        (n: any) => n.classes?.includes("uuid-2")
      );
      expect(innerDiv).toBeDefined();
      expect(outerDiv.children).toContain(innerDiv._id);
    });

    it("should extract and map multiple classes", () => {
      const html = `<div class="container flex mx-auto">Content</div>`;
      const classMap = new Map([
        ["container", "uuid-1"],
        ["flex", "uuid-2"],
        ["mx-auto", "uuid-3"],
      ]);

      const result = compileHTMLToNodes(html, classMap);

      const divNode: any = result.nodes.find((n: any) => n.tag === "div");
      expect(divNode.classes).toHaveLength(3);
      expect(divNode.classes).toContain("uuid-1");
      expect(divNode.classes).toContain("uuid-2");
      expect(divNode.classes).toContain("uuid-3");
    });

    it("should handle images with attributes", () => {
      const html = `<img src="test.jpg" alt="Test Image" width="500" height="300" />`;
      const classMap = new Map();

      const result = compileHTMLToNodes(html, classMap);

      const imgNode: any = result.nodes.find((n: any) => n.tag === "img");
      expect(imgNode).toBeDefined();
      expect(imgNode.data.attr.src).toBe("test.jpg");
      expect(imgNode.data.attr.alt).toBe("Test Image");
      expect(imgNode.data.attr.width).toBe("500");
      expect(imgNode.data.attr.height).toBe("300");
    });

    it("should handle links with href", () => {
      const html = `<a href="https://example.com" class="button">Click me</a>`;
      const classMap = new Map([["button", "uuid-btn"]]);

      const result = compileHTMLToNodes(html, classMap);

      const linkNode: any = result.nodes.find((n: any) => n.tag === "a");
      expect(linkNode).toBeDefined();
      expect(linkNode.type).toBe("Link");
      expect(linkNode.data.link.url).toBe("https://example.com");
      expect(linkNode.data.link.mode).toBe("external");
      expect(linkNode.data.button).toBe(true);
    });

    it("should skip empty text nodes", () => {
      const html = `<div>   </div>`;
      const classMap = new Map();

      const result = compileHTMLToNodes(html, classMap);

      // Should only have the div, no text node for whitespace
      expect(result.nodes.length).toBe(1);
      const divNode: any = result.nodes[0];
      expect(divNode.children.length).toBe(0);
    });
  });

  describe("compileHTMLWithStyles", () => {
    it("should auto-extract classes and generate UUIDs", () => {
      const html = `
        <div class="container">
          <h1 class="title">Hello</h1>
          <p class="description">World</p>
        </div>
      `;

      const result = compileHTMLWithStyles(html);

      expect(result.classToIdMap.size).toBe(3);
      expect(result.classToIdMap.has("container")).toBe(true);
      expect(result.classToIdMap.has("title")).toBe(true);
      expect(result.classToIdMap.has("description")).toBe(true);
      expect(result.nodes.length).toBeGreaterThan(0);
    });

    it("should handle duplicate classes", () => {
      const html = `
        <div class="box">First</div>
        <div class="box">Second</div>
      `;

      const result = compileHTMLWithStyles(html);

      // Should only have one UUID for "box" class
      expect(result.classToIdMap.size).toBe(1);
      expect(result.classToIdMap.has("box")).toBe(true);

      // Both divs should reference the same class UUID
      const boxUUID = result.classToIdMap.get("box");
      const divNodes = result.nodes.filter(
        (n: any) => n.tag === "div"
      ) as any[];
      expect(divNodes.length).toBe(2);
      divNodes.forEach((div) => {
        expect(div.classes).toContain(boxUUID);
      });
    });
  });
});
