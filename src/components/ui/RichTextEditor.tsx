import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import {
  BackgroundColor,
  FontSize,
  TextStyle,
} from '@tiptap/extension-text-style';
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';

function editorContent(value: string): string {
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  const escapeHtml = (text: string) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      BackgroundColor,
      FontFamily,
      FontSize,
    ],
    content: editorContent(value),
    editorProps: {
      attributes: {
        class: 'sermon-editor-content',
        'aria-label': placeholder,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChangeRef.current(currentEditor.isEmpty ? '' : currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && !editor.isFocused && editor.getHTML() !== editorContent(value)) {
      editor.commands.setContent(editorContent(value), { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const buttonClass = (active = false) =>
    `sermon-editor-button${active ? ' sermon-editor-button-active' : ''}`;

  return (
    <div className="sermon-editor">
      <div className="sermon-editor-toolbar" role="toolbar" aria-label="Text formatting">
        <button type="button" className={buttonClass(editor.isActive('bold'))} title="Bold" aria-label="Bold" aria-pressed={editor.isActive('bold')} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </button>
        <button type="button" className={buttonClass(editor.isActive('italic'))} title="Italic" aria-label="Italic" aria-pressed={editor.isActive('italic')} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </button>
        <button type="button" className={buttonClass(editor.isActive('underline'))} title="Underline" aria-label="Underline" aria-pressed={editor.isActive('underline')} onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </button>
        <span className="sermon-editor-divider" />
        <select
          className="sermon-editor-select"
          aria-label="Font family"
          defaultValue=""
          onChange={(event) => {
            const font = event.target.value;
            if (font) editor.chain().focus().setFontFamily(font).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
        >
          <option value="">Font</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="Tahoma, sans-serif">Tahoma</option>
          <option value="Times New Roman, serif">Times New Roman</option>
          <option value="Verdana, sans-serif">Verdana</option>
        </select>
        <select
          className="sermon-editor-select sermon-editor-size"
          aria-label="Font size"
          defaultValue=""
          onChange={(event) => {
            const size = event.target.value;
            if (size) editor.chain().focus().setFontSize(size).run();
            else editor.chain().focus().unsetFontSize().run();
          }}
        >
          <option value="">Size</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="24px">24</option>
          <option value="32px">32</option>
        </select>
        <label className="sermon-editor-color" title="Text color">
          <span>A</span>
          <input
            type="color"
            aria-label="Text color"
            defaultValue="#f3f4f6"
            onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
          />
        </label>
        <label className="sermon-editor-color" title="Highlight color">
          <span className="sermon-highlight-icon">H</span>
          <input
            type="color"
            aria-label="Highlight color"
            defaultValue="#facc15"
            onChange={(event) => {
              editor.chain().focus().setHighlight({ color: event.target.value }).run();
            }}
          />
        </label>
        <span className="sermon-editor-divider" />
        <button type="button" className={buttonClass(editor.isActive('heading', { level: 2 }))} title="Heading" aria-label="Heading" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={16} />
        </button>
        <button type="button" className={buttonClass(editor.isActive('bulletList'))} title="Bulleted list" aria-label="Bulleted list" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </button>
        <button type="button" className={buttonClass(editor.isActive('orderedList'))} title="Numbered list" aria-label="Numbered list" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </button>
        <span className="sermon-editor-divider" />
        <button type="button" className={buttonClass()} title="Undo" aria-label="Undo" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={16} />
        </button>
        <button type="button" className={buttonClass()} title="Redo" aria-label="Redo" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
