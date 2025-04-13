"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Placeholder from "@tiptap/extension-placeholder";
import History from "@tiptap/extension-history";
import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { SuggestionProps } from "@tiptap/suggestion";
import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";

interface CommandItem {
  title: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

interface Range {
  from: number;
  to: number;
}

interface CommandsListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
  editor: Editor;
  range: Range;
}

interface SuggestionItem {
  title: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

const CommandsList = ({ items, command }: CommandsListProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const commandsRef = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    },
    [command, items]
  );

  useEffect(() => {
    const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowUp") {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length);
          return true;
        }
        if (e.key === "ArrowDown") {
          setSelectedIndex((selectedIndex + 1) % items.length);
          return true;
        }
        if (e.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [items, selectedIndex, selectItem]);

  return (
    <div
      ref={commandsRef}
      className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={`w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 transition-colors ${
            index === selectedIndex
              ? "bg-gray-100 text-gray-900 font-medium"
              : ""
          }`}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
};

const suggestion = {
  items: ({ query }: { query: string }): CommandItem[] => {
    return [
      {
        title: "Heading 1",
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setHeading({ level: 1 })
            .run();
        },
      },
      {
        title: "Heading 2",
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setHeading({ level: 2 })
            .run();
        },
      },
      {
        title: "Bullet List",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: "Numbered List",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: "Bold",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBold().run();
        },
      },
      {
        title: "Italic",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleItalic().run();
        },
      },
    ].filter((item) =>
      item.title.toLowerCase().startsWith(query.toLowerCase())
    );
  },

  render: () => {
    let component: ReactRenderer | null = null;
    let popup: TippyInstance[] | null = null;

    return {
      onStart: (props: SuggestionProps<CommandItem>) => {
        component = new ReactRenderer(CommandsList, {
          props,
          editor: props.editor,
        });

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          background: "white",
        });
      },

      onUpdate: (props: SuggestionProps<CommandItem>) => {
        component?.updateProps(props);

        popup?.[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown: (props: SuggestionProps<CommandItem>) => {
        if (props.event.key === "Escape") {
          popup?.[0].destroy();
          return true;
        }

        return false;
      },

      onExit: () => {
        popup?.[0].destroy();
        component?.destroy();
      },
    };
  },
};

const SlashCommands = Extension.create({
  name: "slash-commands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: CommandItem;
        }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-3 border-b border-gray-200 bg-gray-50">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          editor.isActive("bold")
            ? "bg-gray-700 text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
        }`}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          editor.isActive("italic")
            ? "bg-gray-700 text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
        }`}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          editor.isActive("strike")
            ? "bg-gray-700 text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
        }`}
      >
        Strike
      </button>
      <div className="w-px h-6 my-auto mx-1 bg-gray-200" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          editor.isActive("heading", { level: 1 })
            ? "bg-gray-700 text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
        }`}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          editor.isActive("heading", { level: 2 })
            ? "bg-gray-700 text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
        }`}
      >
        H2
      </button>
      <div className="w-px h-6 my-auto mx-1 bg-gray-200" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          editor.isActive("bulletList")
            ? "bg-gray-700 text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
        }`}
      >
        Bullet List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          editor.isActive("orderedList")
            ? "bg-gray-700 text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
        }`}
      >
        Ordered List
      </button>
    </div>
  );
};

export default function RichTextEditor() {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Strike,
      History,
      Heading.configure({
        levels: [1, 2],
      }),
      BulletList,
      OrderedList,
      ListItem,
      Placeholder.configure({
        placeholder: "Type / for commands...",
      }),
      SlashCommands.configure({
        suggestion,
      }),
    ],
    content: `
      <h1>Welcome to the Text Editor</h1>
      <p>Try typing / to see available commands!</p>
      <ul>
        <li>Create headings with H1 and H2</li>
        <li>Make lists (both bullet and ordered)</li>
        <li>Apply text formatting like <strong>bold</strong> and <em>italic</em></li>
      </ul>
    `,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none min-h-[500px] p-6 focus:outline-none text-gray-800",
      },
    },
  });

  return (
    <div className="w-full border rounded-lg overflow-hidden bg-white shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
