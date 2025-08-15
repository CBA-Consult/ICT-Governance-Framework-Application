'use client';

import { useScrollSpy } from '../../hooks/useScrollSpy';

export default function TableOfContents({ headings }) {
  const activeId = useScrollSpy(
    headings.map((h) => `#${h.id}`),
    { rootMargin: '0% 0% -80% 0%' }
  );

  return (
    <nav className="sticky top-24">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">On this page</h3>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`block text-sm transition-colors duration-200 ${
                activeId === heading.id
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
