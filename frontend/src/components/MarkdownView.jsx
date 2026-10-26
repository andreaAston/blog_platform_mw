import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Links open in a new tab safely; images load lazily (saves data on slow connections).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
  if (node.tagName === 'IMG') node.setAttribute('loading', 'lazy');
});

// Markdown -> HTML -> SANITISED HTML. Anything dangerous (<script>, onerror=..., javascript: links)
// is stripped by DOMPurify before it reaches the page. That is our XSS defence.
export default function MarkdownView({ source }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(source || '', { async: false, gfm: true })),
    [source]
  );
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}
