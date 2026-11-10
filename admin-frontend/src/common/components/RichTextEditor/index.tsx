"use client";

// src/common/components/RichTextEditor/index.tsx
// TipTap-based rich text editor with a toolbar. Produces/consumes HTML,
// so it drops straight into any string field (blog content, page blocks…).
import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extensions";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconH2,
  IconH3,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconQuote,
  IconStrikethrough
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  /** HTML string */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
};

type ToolbarButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToolbarButton({ icon: Icon, label, active, disabled, onClick }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={active ? "bg-muted text-foreground" : undefined}
    >
      <Icon />
    </Button>
  );
}

const toggleLink = (editor: Editor) => {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run();
    return;
  }
  const url = window.prompt("Link URL (https://…)");
  if (url === null) return;
  if (url.trim() === "") {
    editor.chain().focus().unsetLink().run();
  } else {
    editor.chain().focus().setLink({ href: url.trim() }).run();
  }
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  disabled = false,
  error,
  className
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder })
    ],
    content: value || "",
    editable: !disabled,
    // Next.js SSR safety — the editor mounts on the client only
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => onChange(current.getHTML())
  });

  // Sync when the value is replaced from outside (e.g. dialog opens with a blog)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return <div className={cn("h-44 animate-pulse rounded-lg border border-input bg-muted/40", className)} />;
  }

  const chain = () => editor.chain().focus();

  return (
    <div
      className={cn(
        "rounded-lg border border-input bg-transparent focus-within:border-ring dark:bg-input/30",
        error && "border-destructive focus-within:border-destructive/50",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
        <ToolbarButton icon={IconArrowBackUp} label="Undo" onClick={() => chain().undo().run()} />
        <ToolbarButton icon={IconArrowForwardUp} label="Redo" onClick={() => chain().redo().run()} />

        <span className="mx-1 h-4 w-px bg-border" aria-hidden />

        <ToolbarButton
          icon={IconBold}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => chain().toggleBold().run()}
        />
        <ToolbarButton
          icon={IconItalic}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => chain().toggleItalic().run()}
        />
        <ToolbarButton
          icon={IconStrikethrough}
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => chain().toggleStrike().run()}
        />

        <span className="mx-1 h-4 w-px bg-border" aria-hidden />

        <ToolbarButton
          icon={IconH2}
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => chain().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon={IconH3}
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => chain().toggleHeading({ level: 3 }).run()}
        />

        <span className="mx-1 h-4 w-px bg-border" aria-hidden />

        <ToolbarButton
          icon={IconList}
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => chain().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={IconListNumbers}
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => chain().toggleOrderedList().run()}
        />
        <ToolbarButton
          icon={IconQuote}
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => chain().toggleBlockquote().run()}
        />
        <ToolbarButton
          icon={IconLink}
          label="Link"
          active={editor.isActive("link")}
          onClick={() => toggleLink(editor)}
        />
      </div>

      {/* Editable area */}
      <EditorContent
        editor={editor}
        className={cn(
          "max-h-72 min-h-44 overflow-y-auto px-3 py-2 text-sm",
          // Placeholder
          "[&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          // Typography
          "[&_.tiptap]:outline-none [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3"
        )}
      />

      {error && <p className="px-3 pb-2 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
