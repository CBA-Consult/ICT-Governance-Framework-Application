'use client';

// This is a mockup component and does not perform real syntax highlighting.
// It simulates the appearance for demonstration purposes.

export default function CodeBlock({ code, language }) {
  // A simple way to simulate highlighting for a mockup
  const highlightedCode = code.replace(
    /const|let|function|return|import|from/g,
    '<span class="text-blue-400">$&</span>'
  ).replace(
    /=>|\{|\}|\(|\)|\[|\]/g,
    '<span class="text-yellow-400">$&</span>'
  ).replace(
      /'(.*?)'/g,
      '<span class="text-green-400">$&</span>'
  );

  return (
    <div className="bg-gray-800 dark:bg-black rounded-lg my-6">
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
            <span className="text-xs font-semibold text-gray-400">{language}</span>
            <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
            >
                Copy
            </button>
        </div>
      <pre className="p-4 text-sm text-white overflow-x-auto">
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  );
}
