import React, { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Link } from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import ImageResize from "tiptap-extension-resize-image";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
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
  Video as VideoIcon,
  RemoveFormatting,
  ArrowLeftFromLine,
  ArrowRightFromLine,
} from "lucide-react";
import { Mark, Node as TiptapNode, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection, NodeSelection } from "@tiptap/pm/state";

export const PreventImageDelete = Extension.create({
  name: "preventImageDelete",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("preventImageDelete"),
        props: {
          handleKeyDown: (view, event) => {
            const { selection } = view.state;
            if (selection instanceof NodeSelection && (selection.node.type.name === "image" || selection.node.type.name === "imageResize")) {
              if (
                event.key === "Backspace" ||
                event.key === "Delete" ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                event.key.startsWith("Arrow")
              ) {
                return false;
              }
              if (event.key.length === 1 || event.key === "Enter" || event.key === "Process") {
                const tr = view.state.tr;
                tr.setSelection(TextSelection.create(view.state.doc, selection.to));
                view.dispatch(tr);
                return false;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

export const LegacySpan = Mark.create({
  name: "legacySpan",
  parseHTML() {
    return [
      { tag: "span" },
      { tag: "font" },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    let style = HTMLAttributes.style || "";
    if (HTMLAttributes.color && !style.includes("color")) {
       style += `color: ${HTMLAttributes.color};`;
    }
    if (HTMLAttributes.face && !style.includes("font-family")) {
       style += `font-family: ${HTMLAttributes.face};`;
    }
    const attrs = { ...HTMLAttributes, style: style || undefined };
    delete attrs.color;
    delete attrs.face;
    delete attrs.size;
    return ["span", mergeAttributes(attrs), 0];
  },
  addAttributes() {
    return {
      style: { default: null, parseHTML: (element) => element.getAttribute("style") },
      class: { default: null, parseHTML: (element) => element.getAttribute("class") },
      color: { default: null, parseHTML: (element) => element.getAttribute("color") },
      face: { default: null, parseHTML: (element) => element.getAttribute("face") },
      size: { default: null, parseHTML: (element) => element.getAttribute("size") }
    };
  },
});

export const GenericIframe = TiptapNode.create({
  name: 'genericIframe',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: '100%' },
      height: { default: '400' },
      frameborder: { default: '0' },
      allowfullscreen: { default: 'true' },
    }
  },

  parseHTML() {
    return [{ tag: 'iframe' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'iframe-wrapper flex justify-center w-full my-4' }, ['iframe', mergeAttributes(HTMLAttributes)]]
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export const BlockBackgroundColor = Extension.create({
  name: 'blockBackgroundColor',
  addOptions() {
    return { types: ['blockquote', 'paragraph', 'heading', 'listItem', 'tableCell'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: element => element.style.backgroundColor || null,
            renderHTML: attributes => {
              if (!attributes.backgroundColor) return {}
              return { style: `background-color: ${attributes.backgroundColor}` }
            },
          },
        },
      },
    ]
  },
})

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
})

export const FontFamily = Extension.create({
  name: 'fontFamily',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: element => element.style.fontFamily?.replace(/['"]+/g, '') || null,
            renderHTML: attributes => {
              if (!attributes.fontFamily) return {}
              return { style: `font-family: ${attributes.fontFamily}` }
            },
          },
        },
      },
    ]
  },
})

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'list_item'],
      defaultLineHeight: 'normal',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: element => element.style.lineHeight || this.options.defaultLineHeight,
            renderHTML: attributes => {
              if (!attributes.lineHeight || attributes.lineHeight === this.options.defaultLineHeight) {
                return {};
              }
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }) => {
        let applied = false;
        this.options.types.forEach((type: string) => {
          if (commands.updateAttributes(type, { lineHeight })) {
            applied = true;
          }
        });
        return applied;
      },
      unsetLineHeight: () => ({ commands }) => {
        let applied = false;
        this.options.types.forEach((type: string) => {
          if (commands.resetAttributes(type, 'lineHeight')) {
            applied = true;
          }
        });
        return applied;
      },
    };
  },
});

export const TabIndent = Extension.create({
  name: 'tabIndent',
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        editor.commands.insertContent('\u00A0\u00A0\u00A0\u00A0'); // Insert 4 non-breaking spaces
        return true; // Return true to prevent default browser behavior
      },
    };
  },
});

const convertQuillHtmlToStandard = (htmlString: string) => {
  if (typeof htmlString !== "string") return htmlString;
  
  // Only process if it looks like legacy Quill HTML. 
  // Processing Tiptap HTML via DOMParser slightly alters the string, triggering infinite setContent loops during typing!
  if (!htmlString.includes("ql-")) {
    return htmlString;
  }

  let html = htmlString;
  
  if (typeof window !== "undefined" && window.DOMParser) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 1. Convert ql-* classes on all elements to inline styles
    const elements = doc.querySelectorAll("[class*='ql-']");
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const classes = Array.from(htmlEl.classList);
      classes.forEach((c) => {
        if (c.startsWith("ql-color-")) htmlEl.style.color = c.replace("ql-color-", "");
        else if (c.startsWith("ql-bg-")) htmlEl.style.backgroundColor = c.replace("ql-bg-", "");
        else if (c === "ql-align-center") htmlEl.style.textAlign = "center";
        else if (c === "ql-align-right") htmlEl.style.textAlign = "right";
        else if (c === "ql-align-justify") htmlEl.style.textAlign = "justify";
        else if (c === "ql-size-small") htmlEl.style.fontSize = "0.75em";
        else if (c === "ql-size-large") htmlEl.style.fontSize = "1.5em";
        else if (c === "ql-size-huge") htmlEl.style.fontSize = "2.5em";
        else if (c === "ql-font-serif") htmlEl.style.fontFamily = "serif";
        else if (c === "ql-font-monospace") htmlEl.style.fontFamily = "monospace";
        else if (c === "ql-font-sans-serif") htmlEl.style.fontFamily = "sans-serif";
        else if (c.startsWith("ql-indent-")) {
          const level = parseInt(c.replace("ql-indent-", ""), 10);
          if (!isNaN(level)) htmlEl.style.marginLeft = `${level * 3}em`;
        }
        
        htmlEl.classList.remove(c);
      });
      if (htmlEl.classList.length === 0) {
        htmlEl.removeAttribute("class");
      }
    });

    // 2. Convert Quill video embeds (iframe.ql-video) to standard iframes
    doc.querySelectorAll("iframe.ql-video").forEach((iframe) => {
      iframe.classList.remove("ql-video");
      if (iframe.classList.length === 0) iframe.removeAttribute("class");
    });

    // 3. Bridge old Quill images to the tiptap-extension-resize-image format.
    // The plugin reads `containerstyle` and `wrapperstyle` attributes from <img>.
    // Old Quill images only have width/height/style — without these attributes
    // the plugin defaults every image to `float: left`, breaking layouts.
    doc.querySelectorAll("img").forEach((img) => {
      // Skip images that already have resize-image attributes (already saved from Tiptap)
      if (img.getAttribute("containerstyle") || img.getAttribute("wrapperstyle")) return;

      const w = img.getAttribute("width");
      const h = img.getAttribute("height");
      const existingStyle = img.style.cssText || "";

      // Determine the float from the image's inline style or its parent's style
      const imgFloat = img.style.float || img.style.cssFloat || "";
      const parentEl = img.parentElement;
      const parentFloat = parentEl ? (parentEl.style.float || parentEl.style.cssFloat || "") : "";
      const effectiveFloat = imgFloat || parentFloat;

      const parentTextAlign = parentEl ? (parentEl.style.textAlign || "") : "";

      // Build the width value
      let widthVal = "";
      if (img.style.width) {
        widthVal = img.style.width;
      } else if (w) {
        widthVal = w.includes("%") ? w : `${w}px`;
      }

      // Build containerStyle: width + height + cursor + display
      let containerParts = [];
      if (widthVal) containerParts.push(`width: ${widthVal}`);
      containerParts.push("height: auto");
      containerParts.push("cursor: pointer");
      
      if (effectiveFloat) {
        containerParts.push("display: inline-block");
      } else {
        // If not floating, check parent text alignment for centering
        if (parentTextAlign === "center") {
          containerParts.push("margin: 0 auto");
        } else if (parentTextAlign === "right") {
          containerParts.push("margin: 0 0 0 auto");
        }
      }
      
      const containerStyle = containerParts.join("; ") + ";";

      // Build wrapperStyle based on float direction
      let wrapperStyle = "";
      if (effectiveFloat === "left") {
        wrapperStyle = "display: inline-block; float: left; padding-right: 8px;";
      } else if (effectiveFloat === "right") {
        wrapperStyle = "display: inline-block; float: right; padding-left: 8px;";
      } else {
        // No float = block display
        wrapperStyle = "display: flex; margin: 0;";
      }

      img.setAttribute("containerstyle", containerStyle);
      img.setAttribute("wrapperstyle", wrapperStyle);

      // Also ensure width/height are in the style for the plugin's parser
      if (w && !img.style.width) img.style.width = w.includes("%") ? w : `${w}px`;
      if (h && !img.style.height) img.style.height = h.includes("%") ? h : `${h}px`;
    });

    return doc.body.innerHTML;
  }
  return html;
};

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  toolbarClassName?: string;
  hideMediaLinks?: boolean;
}

const PreserveStyles = Extension.create({
  name: "preserveStyles",
  addGlobalAttributes() {
    return [
      {
        types: [
          "textStyle",
          "paragraph",
          "heading",
          "blockquote",
          "bulletList",
          "orderedList",
          "listItem",
          "table",
          "tableRow",
          "tableHeader",
          "tableCell",
          "image",
          "imageResize"
        ],
        attributes: {
          style: {
            default: null,
            parseHTML: (element) => element.getAttribute("style"),
            renderHTML: (attributes) => {
              if (!attributes.style) return {};
              return { style: attributes.style };
            },
          },
          class: {
            default: null,
            parseHTML: (element) => element.getAttribute("class"),
            renderHTML: (attributes) => {
              if (!attributes.class) return {};
              return { class: attributes.class };
            },
          },
        },
      },
    ];
  },
});

const MenuBar = ({ editor, toolbarClassName, hideMediaLinks }: { editor: any, toolbarClassName?: string, hideMediaLinks?: boolean }) => {
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
        editor.chain().focus().setTextSelection(editor.state.selection.to).insertContent('<p></p>').run();
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addYoutubeVideo = () => {
    const url = prompt("YouTube Video URL दर्ज करें:");
    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: Math.max(320, parseInt(editor.view.dom.clientWidth, 10)) || 640,
        height: Math.max(180, parseInt(editor.view.dom.clientWidth, 10) * 0.5625) || 480,
      });
    }
  };

  const toggleButtonClass = (isActive: boolean) =>
    `p-1.5 rounded-md transition-colors ${
      isActive
        ? "bg-[var(--primary)] text-white"
        : "text-[var(--foreground)] hover:bg-[var(--surface-soft)] hover:text-[var(--primary)]"
    }`;

  return (
    <div className={`flex flex-wrap items-center gap-1 border-b border-[var(--line)] bg-[var(--surface)] p-2 shrink-0 ${toolbarClassName || ""}`}>
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
        onClick={() => {
          const currentAlign = editor.isActive({ textAlign: "center" }) ? "center" :
                               editor.isActive({ textAlign: "right" }) ? "right" :
                               editor.isActive({ textAlign: "justify" }) ? "justify" : null;
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          if (currentAlign) editor.chain().focus().setTextAlign(currentAlign).run();
        }}
        className={toggleButtonClass(editor.isActive("heading", { level: 1 }))}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          const currentAlign = editor.isActive({ textAlign: "center" }) ? "center" :
                               editor.isActive({ textAlign: "right" }) ? "right" :
                               editor.isActive({ textAlign: "justify" }) ? "justify" : null;
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          if (currentAlign) editor.chain().focus().setTextAlign(currentAlign).run();
        }}
        className={toggleButtonClass(editor.isActive("heading", { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          const currentAlign = editor.isActive({ textAlign: "center" }) ? "center" :
                               editor.isActive({ textAlign: "right" }) ? "right" :
                               editor.isActive({ textAlign: "justify" }) ? "justify" : null;
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          if (currentAlign) editor.chain().focus().setTextAlign(currentAlign).run();
        }}
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

      {/* Font Family */}
      <select
        onChange={(e) => {
          if (e.target.value === "") {
            editor.chain().focus().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run();
          } else {
            editor.chain().focus().setMark('textStyle', { fontFamily: e.target.value }).run();
          }
        }}
        className="bg-[var(--surface-soft)] text-[var(--foreground)] border border-[var(--line)] rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[var(--primary)] w-24"
        title="Font Style"
        value={editor.getAttributes("textStyle").fontFamily || ""}
      >
        <option value="">Default Font</option>
        <option value="serif">Serif</option>
        <option value="sans-serif">Sans Serif</option>
        <option value="monospace">Monospace</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="'Times New Roman', Times, serif">Times New Roman</option>
        <option value="'Courier New', Courier, monospace">Courier New</option>
      </select>

      {/* Font Size */}
      <div className="flex items-center">
        <input
          type="text"
          list="font-sizes"
          placeholder="Size"
          className="bg-[var(--surface-soft)] text-[var(--foreground)] border border-[var(--line)] rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[var(--primary)] w-16"
          title="Font Size (e.g. 16px)"
          defaultValue={editor.getAttributes("textStyle").fontSize?.replace("px", "") || ""}
          key={editor.getAttributes("textStyle").fontSize || "default-size"}
          onChange={(e) => {
            // If they picked something from the datalist (which contains 'px'), apply it immediately
            if (e.target.value.includes('px')) {
              editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run();
            }
          }}
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (!val) {
               editor.chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
            } else {
               const finalVal = /^\d+$/.test(val) ? `${val}px` : val;
               editor.chain().setMark('textStyle', { fontSize: finalVal }).run();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
              // Restore focus back to editor after they set the size
              setTimeout(() => editor.commands.focus(), 10);
            }
          }}
        />
        <datalist id="font-sizes">
          <option value="12px" />
          <option value="14px" />
          <option value="16px" />
          <option value="18px" />
          <option value="20px" />
          <option value="24px" />
          <option value="30px" />
          <option value="36px" />
        </datalist>
      </div>

      <div className="w-px h-5 bg-[var(--line)] mx-1" />

      <select
        onChange={(e) => {
          if (e.target.value === "normal") {
            editor.chain().focus().unsetLineHeight().run();
          } else {
            editor.chain().focus().setLineHeight(e.target.value).run();
          }
        }}
        className="bg-[var(--surface-soft)] text-[var(--foreground)] border border-[var(--line)] rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[var(--primary)] w-20"
        title="Line Height"
        value={editor.getAttributes("paragraph").lineHeight || editor.getAttributes("heading").lineHeight || "normal"}
      >
        <option value="normal">Normal</option>
        <option value="1">1</option>
        <option value="1.15">1.15</option>
        <option value="1.5">1.5</option>
        <option value="2">2</option>
        <option value="2.5">2.5</option>
      </select>

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

      {!hideMediaLinks && (
        <>
          <div className="w-px h-5 bg-[var(--line)] mx-1" />
          <button
            type="button"
            onClick={setLink}
            className={toggleButtonClass(editor.isActive("link"))}
            title="Add/Edit Link"
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
          <button
            type="button"
            onClick={addYoutubeVideo}
            className={toggleButtonClass(false)}
            title="Insert YouTube Video"
          >
            <VideoIcon className="w-4 h-4" />
          </button>
        </>
      )}

      <div className="w-px h-5 bg-[var(--line)] mx-1" />

      {/* Color Picker */}
      <div className="flex items-center gap-1 bg-[var(--surface-soft)] p-1 rounded-md border border-[var(--line)]">
        <span className="text-[10px] text-[var(--muted)] font-semibold mx-1">TEXT</span>
        {["#000000", "#9f171b", "#1d4ed8", "#15803d"].map(color => (
          <button
            key={color}
            type="button"
            onClick={() => editor.chain().focus().setColor(color).run()}
            className="w-5 h-5 rounded-sm border border-black/20"
            style={{ backgroundColor: color }}
            title={`Set color to ${color}`}
          />
        ))}
        <div className="relative w-5 h-5 overflow-hidden rounded-sm border border-[var(--line)] cursor-pointer" title="More Colors">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 pointer-events-none" />
          <input
            type="color"
            onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
            value={editor.getAttributes("textStyle").color || "#000000"}
            className="absolute -top-2 -left-2 w-10 h-10 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Highlight Color Picker (Background) */}
      <div className="flex items-center gap-1 bg-[var(--surface-soft)] p-1 rounded-md border border-[var(--line)]">
        <span className="text-[10px] text-[var(--muted)] font-semibold mx-1">BG</span>
        {["#fef08a", "#fbcfe8", "#bfdbfe", "#bbf7d0"].map(color => (
          <button
            key={color}
            type="button"
            onClick={() => {
              if (editor.isActive('blockquote')) {
                editor.chain().focus().updateAttributes('blockquote', { backgroundColor: color }).run();
              } else {
                editor.chain().focus().setHighlight({ color }).run();
              }
            }}
            className="w-5 h-5 rounded-sm border border-black/20"
            style={{ backgroundColor: color }}
            title={`Set background to ${color}`}
          />
        ))}
        <div className="relative w-5 h-5 overflow-hidden rounded-sm border border-[var(--line)] cursor-pointer" title="More Colors">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-pink-300 to-cyan-300 pointer-events-none" />
          <input
            type="color"
            onInput={(event: any) => {
              const color = event.target.value;
              if (editor.isActive('blockquote')) {
                editor.chain().focus().updateAttributes('blockquote', { backgroundColor: color }).run();
              } else {
                editor.chain().focus().setHighlight({ color }).run();
              }
            }}
            value={editor.isActive('blockquote') ? (editor.getAttributes("blockquote").backgroundColor || "#ffffff") : (editor.getAttributes("highlight").color || "#ffffff")}
            className="absolute -top-2 -left-2 w-10 h-10 opacity-0 cursor-pointer"
          />
        </div>
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

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
  placeholder,
  className = "h-[400px]",
  toolbarClassName,
  hideMediaLinks,
}) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Keep track of the last few HTML outputs we generated.
  // This allows us to ignore debounced "echos" from the parent that arrive late while the user is still typing.
  const recentOutputsRef = useRef<string[]>([]);



  const editorExtensions = React.useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    LineHeight,
    PreventImageDelete,
    BlockBackgroundColor,
    TabIndent,
    TextStyle,
    FontSize,
    FontFamily,
    LegacySpan,
    Underline,
    TextAlign.configure({
      types: ["heading", "paragraph", "blockquote", "listItem"],
    }),
    TextStyle,
    PreserveStyles,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    ImageResize.configure({
      inline: true,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    Placeholder.configure({
      placeholder: placeholder || "यहाँ टाइप करें...",
    }),
    Youtube.configure({
      inline: false,
      allowFullscreen: true,
    }),
    GenericIframe,
  ], [placeholder]);

  const sanitizedValue = convertQuillHtmlToStandard(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: sanitizedValue,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      recentOutputsRef.current.push(html);
      if (recentOutputsRef.current.length > 30) {
        recentOutputsRef.current.shift(); // keep bounded
      }
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
      const html = editor.getHTML();
      recentOutputsRef.current.push(html);
      if (recentOutputsRef.current.length > 30) {
        recentOutputsRef.current.shift();
      }
      onChangeRef.current(html);
    },
    editorProps: {
      attributes: {
        class: `article-body ql-editor prose max-w-none focus:outline-none p-4 text-[var(--foreground)] min-h-full`,
      },
    },
  });

  const toggleButtonClass = (isActive: boolean) =>
    `p-1.5 rounded-md transition-colors ${
      isActive
        ? "bg-[var(--primary)] text-white"
        : "text-[var(--foreground)] hover:bg-[var(--surface-soft)] hover:text-[var(--primary)]"
    }`;

  useEffect(() => {
    if (!editor) return;
    
    if (sanitizedValue !== editor.getHTML()) {
      // If the incoming value is one we recently generated, it's just a delayed echo from the parent. Ignore it.
      if (recentOutputsRef.current.includes(sanitizedValue)) {
        return;
      }
      
      // It's a genuinely new value from the outside (e.g. DB load or article switch).
      editor.commands.setContent(sanitizedValue, { emitUpdate: false });
      recentOutputsRef.current = [sanitizedValue]; // Reset queue with the new external baseline
      
      // Place cursor at the end to ensure smooth UX when loading drafts
      setTimeout(() => {
        if (!editor.isDestroyed && !editor.isFocused) {
          editor.commands.setTextSelection(editor.state.doc.content.size);
        }
      }, 10);
    }
  }, [sanitizedValue, editor]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Inject a Center button into the image-resize plugin's popup alignment menu.
  // The plugin renders a div[data-resize-image-ui="position-controller"] with
  // <img> icons for Left and Right when inline=true. We inject a Center icon
  // between them so the user can center-align images.
  useEffect(() => {
    if (!editor) return;

    const ICON_SIZE = '24px';
    // The plugin's own center icon (base64 Material Symbols)
    const CENTER_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjAiPjxwYXRoIGQ9Ik0xNDQtMTQ0di03Mmg2NzJ2NzJIMTQ0Wm0xNDQtMTUwdi03MmgzODR2NzJIMjg4Wk0xNDQtNDQ0di03Mmg2NzJ2NzJIMTQ0Wm0xNDQtMTUwdi03MmgzODR2NzJIMjg4Wk0xNDQtNzQ0di03Mmg2NzJ2NzJIMTQ0WiIvPjwvc3ZnPg==';

    const observer = new MutationObserver(() => {
      // Find all position-controller popups rendered by the plugin
      const controllers = document.querySelectorAll('[data-resize-image-ui="position-controller"]');
      controllers.forEach(controller => {
        // Skip if we already injected a center icon
        if (controller.querySelector('.custom-center-icon')) return;

        const icons = controller.querySelectorAll('img');
        // The plugin renders exactly 2 icons (Left, Right) when inline=true
        if (icons.length === 2) {
          const centerIcon = document.createElement('img');
          centerIcon.className = 'custom-center-icon';
          centerIcon.setAttribute('src', CENTER_ICON);
          centerIcon.setAttribute('style', `width: ${ICON_SIZE}; height: ${ICON_SIZE}; cursor: pointer;`);
          centerIcon.addEventListener('mouseover', () => { centerIcon.style.opacity = '0.6'; });
          centerIcon.addEventListener('mouseout', () => { centerIcon.style.opacity = '1'; });
          centerIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Find the container (the resizable image wrapper) - it's the parent of the controller
            const container = controller.parentElement;
            if (container) {
              // Clear any inline float styles and center via margin (same as plugin's handleCenterClick)
              container.style.float = '';
              container.style.display = '';
              container.style.paddingLeft = '';
              container.style.paddingRight = '';
              container.style.margin = '0 auto';
              // Also clear the wrapper (grandparent)
              const wrapper = container.parentElement;
              if (wrapper) {
                wrapper.style.float = '';
                wrapper.style.display = 'flex';
                wrapper.style.paddingLeft = '';
                wrapper.style.paddingRight = '';
              }
              // Dispatch the node view update to persist the style change
              // We trigger a ProseMirror transaction by finding the node position
              const { state: editorState, view: editorView } = editor;
              editorState.doc.descendants((node, pos) => {
                if (node.type.name === 'imageResize') {
                  const dom = editorView.nodeDOM(pos);
                  if (dom && (dom === wrapper || dom === container || (dom as HTMLElement).contains?.(container))) {
                    const containerStyle = container.getAttribute('style') || '';
                    const wrapperStyle = wrapper ? wrapper.getAttribute('style') || '' : '';
                    const tr = editorView.state.tr.setNodeMarkup(pos, null, {
                      ...node.attrs,
                      containerStyle,
                      wrapperStyle,
                    });
                    editorView.dispatch(tr);
                    return false; // stop iterating
                  }
                }
                return true;
              });
            }
          });

          // Insert between the Left (first) and Right (second) icons
          controller.insertBefore(centerIcon, icons[1]);

          // Widen the controller to fit 3 icons instead of 2
          const currentWidth = parseInt(controller.style.width) || 66;
          controller.style.width = `${currentWidth + 30}px`;
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [editor]);

  return (
    <div className={`flex flex-col bg-[var(--surface)] text-[var(--foreground)] w-full ${className}`}>
      <style>{`
        .prose .image-resizer[style*="float: left"],
        .prose div[style*="float: left"]:has(> div > img) {
          margin-right: 0.75rem !important;
          margin-bottom: 0.5rem !important;
        }
        .prose .image-resizer[style*="float: right"],
        .prose div[style*="float: right"]:has(> div > img) {
          margin-left: 0.75rem !important;
          margin-bottom: 0.5rem !important;
        }
        .prose div[style*="margin: 0 auto"]:has(> img),
        .prose div[style*="margin: 0px auto"]:has(> img) {
          display: block !important;
          float: none !important;
          clear: both !important;
        }
        .prose div[style*="display: flex"]:has(> div[style*="margin: 0 auto"]),
        .prose div[style*="display: flex"]:has(> div[style*="margin: 0px auto"]) {
          float: none !important;
          display: flex !important;
          justify-content: center !important;
        }
      `}</style>

      <MenuBar editor={editor} toolbarClassName={toolbarClassName} hideMediaLinks={hideMediaLinks} />
      <div 
        className="flex-grow overflow-y-auto relative cursor-text bg-[var(--surface)] min-h-[120px]" 
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
