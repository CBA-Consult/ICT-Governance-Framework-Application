import fs from 'fs';
import path from 'path';
import React from 'react';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';

export async function getStaticProps({ params }) {
  const docPath = path.join(process.cwd(), '../../', `${params.slug}.md`);
  const fileContents = fs.readFileSync(docPath, 'utf8');
  const { content, data } = matter(fileContents);
  return {
    props: {
      content,
      data: data || {},
    },
  };
}

export async function getStaticPaths() {
  const docsDir = path.join(process.cwd(), '../../');
  const files = fs.readdirSync(docsDir);
  const paths = files
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({ params: { slug: file.replace(/\.md$/, '') } }));
  return {
    paths,
    fallback: false,
  };
}

export default function DocPage({ content, data }) {
  return (
    <div className="prose mx-auto py-8">
      <h1>{data.title || 'Documentation'}</h1>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
