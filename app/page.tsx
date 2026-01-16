import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Code to Webflow
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Convert HTML/CSS to Webflow clipboard format and paste directly into the Designer
          </p>
          <Link
            href="/converter"
            className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all"
          >
            Open Converter →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Parse HTML and CSS into Webflow's native format</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Automatic UUID generation for elements and styles</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Smart tag-to-type mapping (div→Block, h1→Heading, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Preserve HTML attributes (id, src, href, alt, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>One-click copy to clipboard with dual MIME types</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Paste directly into Webflow Designer - no manual work!</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">How it works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Paste your HTML & CSS</h3>
                <p className="text-gray-600 text-sm">
                  Input your HTML structure and CSS styles into the converter
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Convert to Webflow format</h3>
                <p className="text-gray-600 text-sm">
                  The tool parses your code and generates Webflow's clipboard JSON
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Copy to clipboard</h3>
                <p className="text-gray-600 text-sm">
                  Click the button to copy with both text/plain and application/json MIME types
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Paste into Webflow</h3>
                <p className="text-gray-600 text-sm">
                  Open Webflow Designer and press Cmd+V (Mac) or Ctrl+V (Windows) - done!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/converter"
            className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all"
          >
            Try it now →
          </Link>
        </div>
      </div>
    </main>
  );
}
