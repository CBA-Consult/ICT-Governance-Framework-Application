import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export default async function DocsIndex() {
  const docsDir = path.join(process.cwd(), '../../');
  const files = fs.readdirSync(docsDir).filter((file) => file.endsWith('.md'));
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Framework Documentation</h1>
      <ul className="space-y-2">
        {files.map((doc) => (
          <li key={doc}>
            <Link href={`/docs/${doc.replace(/\.md$/, '')}`} className="text-blue-600 hover:underline">
              {doc.replace(/\.md$/, '').replace(/-/g, ' ')}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
