import React, { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Link } from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import ImageResize from "tiptap-extension-resize-image";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  RemoveFormatting,
} from "lucide-react";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL दर्ज करें:", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleButtonClass = (isActive: boolean) =>
    `p-1.5 rounded-md transition-colors ${
      isActive
        ? "bg-[var(--primary)] text-white"
        : "text-[var(--foreground)] hover:bg-[var(--surface-soft)] hover:text-[var(--primary)]"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[var(--line)] bg-[var(--surface)] p-2 sticky top-0 z-10">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={toggleButtonClass(editor.isActive("bold"))}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={toggleButtonClass(editor.isActive("italic"))}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={toggleButtonClass(editor.isActive("underline"))}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={toggleButtonClass(editor.isActive("strike"))}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-[var(--line)] mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={toggleButtonClass(editor.isActive("heading", { level: 1 }))}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={toggleButtonClass(editor.isActive("heading", { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={toggleButtonClass(editor.isActive("heading", { level: 3 }))}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-[var(--line)] mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={toggleButtonClass(editor.isActive({ textAlign: "left" }))}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={toggleButtonClass(editor.isActive({ textAlign: "center" }))}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={toggleButtonClass(editor.isActive({ textAlign: "right" }))}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        className={toggleButtonClass(editor.isActive({ textAlign: "justify" }))}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-[var(--line)] mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={toggleButtonClass(editor.isActive("bulletList"))}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={toggleButtonClass(editor.isActive("orderedList"))}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={toggleButtonClass(editor.isActive("blockquote"))}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-[var(--line)] mx-1" />

      <button
        type="button"
        onClick={setLink}
        className={toggleButtonClass(editor.isActive("link"))}
        title="Insert Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
        className={toggleButtonClass(false)}
        title="Remove Link"
      >
        <Unlink className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-[var(--line)] mx-1" />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={toggleButtonClass(false)}
        title="Insert Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="w-px h-5 bg-[var(--line)] mx-1" />

      {/* Color Picker */}
      <div className="flex items-center">
        <input
          type="color"
          onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
          value={editor.getAttributes("textStyle").color || "#000000"}
          className="w-6 h-6 p-0 border-0 cursor-pointer rounded overflow-hidden"
          title="Text Color"
        />
      </div>

      {/* Highlight Color Picker (Background) */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-[var(--muted)] font-semibold">BG</span>
        <input
          type="color"
          onInput={(event: any) => editor.chain().focus().setHighlight({ color: event.target.value }).run()}
          value={editor.getAttributes("highlight").color || "#ffffff"}
          className="w-6 h-6 p-0 border-0 cursor-pointer rounded overflow-hidden"
          title="Text Background Color"
        />
        {editor.isActive("highlight") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetHighlight().run()}
            className="text-[10px] text-[var(--primary)] hover:underline ml-1"
          >
            हटाएं
          </button>
        )}
      </div>

      <div className="w-px h-5 bg-[var(--line)] mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        className={toggleButtonClass(false)}
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>
    </div>
  );
};

const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Underline,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  ImageResize,
  Link.configure({
    openOnClick: false,
    autolink: true,
  }),
];

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChangeRef.current(html);
      }, 300);
    },
    onBlur: ({ editor }) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onChangeRef.current(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[300px] p-4 text-[var(--foreground)]",
      },
    },
  });

  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] text-[var(--foreground)]">
      <MenuBar editor={editor} />
      <div className="flex-grow overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
