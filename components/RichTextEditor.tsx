import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, editable }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content if it changes externally
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="prose prose-invert max-w-none w-full min-h-[60vh]">
      <EditorContent editor={editor} />
    </div>
  );
};
