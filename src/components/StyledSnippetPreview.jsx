import React from 'react';

export default function StyledSnippetPreview({ content, maxLength = 200 }) {
  if (!content) return null;

  // Create a safe preview that preserves some basic formatting
  const createSafePreview = (html) => {
    if (typeof html !== 'string') return '';
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Convert headers to bold text with # prefix
    const headers = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headers.forEach(header => {
      const level = parseInt(header.tagName.charAt(1));
      const prefix = '#'.repeat(level) + ' ';
      header.textContent = prefix + header.textContent;
    });
    
    // Convert bold/strong to bold text
    const boldElements = tempDiv.querySelectorAll('strong, b');
    boldElements.forEach(el => {
      el.textContent = `**${el.textContent}**`;
    });
    
    // Convert italic/em to italic text
    const italicElements = tempDiv.querySelectorAll('em, i');
    italicElements.forEach(el => {
      el.textContent = `*${el.textContent}*`;
    });
    
    // Convert strikethrough to strike text
    const strikeElements = tempDiv.querySelectorAll('s, del');
    strikeElements.forEach(el => {
      el.textContent = `~~${el.textContent}~~`;
    });
    
    // Convert code to inline code
    const codeElements = tempDiv.querySelectorAll('code');
    codeElements.forEach(el => {
      el.textContent = `\`${el.textContent}\``;
    });
    
    // Get the text content
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  };

  const styledText = createSafePreview(content);
  const preview = styledText.length > maxLength 
    ? styledText.substring(0, maxLength) + '...' 
    : styledText;

  return (
    <div className="text-xs text-slate-500 line-clamp-5 whitespace-pre-wrap">
      {preview}
    </div>
  );
}
