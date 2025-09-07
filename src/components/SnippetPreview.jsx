import React from 'react';

export default function SnippetPreview({ content, maxLength = 200 }) {
  if (!content) return null;

  // Strip HTML tags for preview and limit length
  const stripHtml = (html) => {
    if (typeof html !== 'string') return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const plainText = stripHtml(content);
  const preview = plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...' 
    : plainText;

  return (
    <div className="text-xs text-slate-500 line-clamp-5">
      {preview || content}
    </div>
  );
}
