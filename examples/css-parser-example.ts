import { parseCSSToWebflow, parseCSSWithMediaQueries, extractClassNamesFromCSS } from "@/lib/css-parser";

// Example 1: Basic CSS parsing
function example1() {
  console.log("=== Example 1: Basic CSS Parsing ===\n");

  const css = `
    .button {
      padding-top: 0.75rem;
      padding-right: 1.5rem;
      padding-bottom: 0.75rem;
      padding-left: 1.5rem;
      background-color: #3b82f6;
      color: white;
      border-radius: 0.5rem;
      font-weight: 600;
      text-align: center;
      cursor: pointer;
    }

    .container {
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .heading {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 1rem;
    }
  `;

  const classNames = ["button", "container", "heading"];
  const result = parseCSSToWebflow(css, classNames);

  console.log("Class to ID Mapping:");
  result.classToIdMap.forEach((uuid, className) => {
    console.log(`  ${className} => ${uuid}`);
  });

  console.log("\nGenerated Webflow Styles:");
  result.styles.forEach((style) => {
    console.log(`\n  Class: ${style.name}`);
    console.log(`  ID: ${style._id}`);
    console.log(`  StyleLess: ${style.styleLess}`);
  });
}

// Example 2: Extracting class names automatically
function example2() {
  console.log("\n\n=== Example 2: Auto-Extract Class Names ===\n");

  const css = `
    .hero { height: 100vh; }
    .nav { display: flex; }
    .footer { background: #333; }
    .hero:hover { opacity: 0.9; }
  `;

  // Automatically extract all class names
  const classNames = extractClassNamesFromCSS(css);
  console.log("Found classes:", classNames);

  const result = parseCSSToWebflow(css, classNames);
  console.log(`\nGenerated ${result.styles.length} style objects`);
}

// Example 3: CSS with media queries (responsive)
function example3() {
  console.log("\n\n=== Example 3: Responsive CSS with Media Queries ===\n");

  const css = `
    .responsive-text {
      font-size: 24px;
      line-height: 1.5;
      padding: 40px;
    }

    @media (max-width: 991px) {
      .responsive-text {
        font-size: 20px;
        padding: 30px;
      }
    }

    @media (max-width: 767px) {
      .responsive-text {
        font-size: 18px;
        padding: 20px;
      }
    }

    @media (max-width: 479px) {
      .responsive-text {
        font-size: 16px;
        padding: 15px;
      }
    }
  `;

  const result = parseCSSWithMediaQueries(css, ["responsive-text"]);
  const style = result.styles[0];

  console.log(`Class: ${style.name}`);
  console.log(`ID: ${style._id}`);
  console.log(`\nBase styles: ${style.styleLess}`);

  if (Object.keys(style.variants).length > 0) {
    console.log("\nResponsive variants:");
    Object.entries(style.variants).forEach(([breakpoint, variant]) => {
      console.log(`  ${breakpoint}: ${variant.styleLess}`);
    });
  }
}

// Example 4: Handling edge cases
function example4() {
  console.log("\n\n=== Example 4: Edge Cases ===\n");

  const css = `
    .with-comments {
      /* This is a comment */
      color: red;
      /* Another comment */
      background: blue;
    }

    .extra-spaces   {
      margin   :   10px   ;
      padding:5px;
    }
  `;

  const result = parseCSSToWebflow(css, ["with-comments", "extra-spaces", "nonexistent"]);

  result.styles.forEach((style) => {
    console.log(`\n${style.name}:`);
    console.log(`  StyleLess: "${style.styleLess}"`);
  });
}

// Run all examples
if (require.main === module) {
  example1();
  example2();
  example3();
  example4();
}

export { example1, example2, example3, example4 };
