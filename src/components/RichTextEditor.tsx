import React from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuillWrapper = dynamic(
  async () => {
    const ReactQuillModule = await import("react-quill-new");
    const { Quill } = ReactQuillModule;
    const { default: ImageResize } = await import("quill-resize-image");
    
    Quill.register("modules/resize", ImageResize);
    
    return function ForwardedRefComponent(props: any) {
      return <ReactQuillModule.default {...props} />;
    };
  },
  { ssr: false, loading: () => <div className="min-h-[250px]" /> }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const modules = {
  resize: {
    locale: {},
  },
  keyboard: {
    bindings: {
      header1: { key: '1', ctrlKey: true, altKey: true, handler: function(this: any) { this.quill.format('header', 1); } },
      header2: { key: '2', ctrlKey: true, altKey: true, handler: function(this: any) { this.quill.format('header', 2); } },
      header3: { key: '3', ctrlKey: true, altKey: true, handler: function(this: any) { this.quill.format('header', 3); } },
      alignCenter: { key: 'e', ctrlKey: true, handler: function(this: any, range: any, context: any) { this.quill.format('align', context.format.align === 'center' ? false : 'center'); } },
      alignRight: { key: 'r', ctrlKey: true, handler: function(this: any, range: any, context: any) { this.quill.format('align', context.format.align === 'right' ? false : 'right'); } },
      alignLeft: { key: 'l', ctrlKey: true, handler: function(this: any) { this.quill.format('align', false); } },
      alignJustify: { key: 'j', ctrlKey: true, handler: function(this: any, range: any, context: any) { this.quill.format('align', context.format.align === 'justify' ? false : 'justify'); } },
      blockquote: { key: 'q', ctrlKey: true, handler: function(this: any, range: any, context: any) { this.quill.format('blockquote', !context.format.blockquote); } },
      clearFormat: { key: '\\', ctrlKey: true, handler: function(this: any, range: any) { this.quill.removeFormat(range.index, range.length); } },
      link: { 
        key: 'k', ctrlKey: true, 
        handler: function(this: any, range: any) { 
          const url = window.prompt('Enter link URL:'); 
          if (url) { this.quill.format('link', url); } 
        } 
      },
      color: {
        key: 'c', ctrlKey: true, shiftKey: true,
        handler: function(this: any) {
          const colorBtn = this.quill.container?.previousElementSibling?.querySelector('.ql-color .ql-picker-label') as HTMLElement;
          if (colorBtn) { colorBtn.click(); }
        }
      }
    }
  },
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: [] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    ["link", "image", "video"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ["clean"],
  ],
};

// We intentionally do not use a strict formats array here. 
// If we restrict formats, custom image attributes like width, height, and inline styles 
// added by quill-resize-image get stripped away when editing an existing article.

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  return (
    <div className={`overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)] [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-[var(--line)] [&_.ql-container]:border-none [&_.ql-editor]:min-h-[250px] [&_.ql-editor]:text-base [&_.ql-editor]:text-[var(--foreground)] [&_.ql-editor.ql-blank::before]:text-[#6b7280] dark:[&_.ql-editor.ql-blank::before]:text-[#9ca3af] [&_.ql-snow_.ql-stroke]:stroke-[var(--foreground)] [&_.ql-snow_.ql-fill]:fill-[var(--foreground)] [&_.ql-snow_.ql-picker]:text-[var(--foreground)] ${className || ""}`}>
      <ReactQuillWrapper
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
};
