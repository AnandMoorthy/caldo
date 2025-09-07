import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { createLowlight } from 'lowlight';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Code, 
  Code2,
  Quote, 
  Minus,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';

// Import some languages for syntax highlighting
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';

// Create lowlight instance and register languages
const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('java', java);
lowlight.register('css', css);
lowlight.register('html', html);

export default function RichTextEditor({ content, onChange, placeholder = "Start typing your snippet…" }) {
  console.log('RichTextEditor received content:', content);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none h-full p-4 text-slate-900 dark:text-slate-100',
        spellcheck: 'false',
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
      },
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Update editor content when content prop changes
  React.useEffect(() => {
    if (editor) {
      const currentContent = editor.getHTML();
      console.log('RichTextEditor: Current editor content:', currentContent);
      console.log('RichTextEditor: New content prop:', content);
      if (content !== currentContent) {
        console.log('RichTextEditor: Content differs, updating editor');
        editor.commands.setContent(content || '');
      } else {
        console.log('RichTextEditor: Content is the same, no update needed');
      }
    }
  }, [editor, content]);

  if (!editor) {
    console.log('RichTextEditor: Editor not ready yet');
    return null;
  }
  
  console.log('RichTextEditor: Editor ready, current content:', editor.getHTML());

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-slate-200 dark:border-slate-700 p-2 flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-800">
        {/* Headers */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-700' : ''
          }`}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-700' : ''
          }`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 dark:bg-slate-700' : ''
          }`}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700' : ''
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700' : ''
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('code') ? 'bg-slate-200 dark:bg-slate-700' : ''
          }`}
          title="Inline Code"
        >
          <Code size={16} />
        </button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700' : ''
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Block Elements */}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('blockquote') ? 'bg-slate-200 dark:bg-slate-700' : ''
          }`}
          title="Quote"
        >
          <Quote size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('codeBlock') ? 'bg-slate-200 dark:bg-slate-700' : ''
          }`}
          title="Code Block"
        >
          <Code2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Horizontal Rule"
        >
          <Minus size={16} />
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-white dark:bg-slate-900 flex-1 min-h-0">
        <EditorContent 
          editor={editor} 
          className="h-full overflow-y-auto [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-full [&_.ProseMirror]:p-4 [&_.ProseMirror]:text-slate-900 [&_.ProseMirror]:dark:text-slate-100 [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic [&_.ProseMirror_code]:bg-slate-100 [&_.ProseMirror_code]:dark:bg-slate-800 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_pre]:bg-slate-100 [&_.ProseMirror_pre]:dark:bg-slate-800 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-slate-300 [&_.ProseMirror_blockquote]:dark:border-slate-600 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_li]:mb-1 [&_.ProseMirror_hr]:border-slate-300 [&_.ProseMirror_hr]:dark:border-slate-600 [&_.ProseMirror_hr]:my-4"
        />
      </div>
    </div>
  );
}
