import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'custom-link' } }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  // Reusable toolbar button component
  const ToolbarButton = ({ onClick, isActive, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: '6px 10px',
        border: isActive ? '1.5px solid #0b4335' : '1px solid #c0c9c3',
        backgroundColor: isActive ? '#0b4335' : '#fff',
        color: isActive ? '#fff' : '#404945',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s'
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ border: '1.5px solid #c0c9c3', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
      {/* Toolbar */}
      <div style={{ padding: '8px', borderBottom: '1px solid #c0c9c3', display: 'flex', gap: '4px', flexWrap: 'wrap', backgroundColor: '#fafbf8' }}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)"><b>B</b></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)"><i>I</i></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">• List</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">1. List</ToolbarButton>
        <div style={{ width: '1px', backgroundColor: '#c0c9c3', margin: '0 4px' }} />
        <ToolbarButton onClick={() => {
          const url = window.prompt('Enter image URL:');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }} title="Insert Image">🖼️</ToolbarButton>
        <ToolbarButton onClick={() => {
          const url = window.prompt('Enter link URL:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} isActive={editor.isActive('link')} title="Insert Link">🔗</ToolbarButton>
      </div>
      
      {/* Editor Area */}
      <EditorContent 
        editor={editor} 
        style={{ padding: '16px', minHeight: '250px', fontFamily: "'Source Sans 3', sans-serif", outline: 'none', color: '#191c1b' }} 
      />
      
      {/* Editor Internal Styling */}
      <style>{`
        .ProseMirror p { margin: 0 0 12px 0; line-height: 1.6; }
        .ProseMirror p.is-editor-empty:first-child::before { color: #c0c9c3; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        .ProseMirror h2 { font-size: 1.25em; font-weight: 700; margin: 16px 0 8px 0; color: #0b4335; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin: 0 0 12px 0; line-height: 1.6; }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; }
        .ProseMirror a.custom-link { color: #0b4335; text-decoration: underline; text-underline-offset: 2px; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;