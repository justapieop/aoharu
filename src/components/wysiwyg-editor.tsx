"use client";

import { useId, useState } from "react";
import { Button, Label } from "@heroui/react";

interface WysiwygEditorProps {
  name: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
}

type EditorCommand =
  | "bold"
  | "italic"
  | "underline"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "formatBlock"
  | "createLink"
  | "unlink"
  | "removeFormat";

function normalizeHtml(html: string): string {
  const normalized = html.trim();
  if (!normalized || normalized === "<br>" || normalized === "<div><br></div>") {
    return "";
  }

  return normalized;
}

export function WysiwygEditor({ name, label, placeholder = "Nhập nội dung...", initialValue = "" }: WysiwygEditorProps) {
  const editorId = useId();
  const [htmlValue, setHtmlValue] = useState(initialValue);

  const runCommand = (command: EditorCommand, value?: string) => {
    if (command === "createLink") {
      const url = window.prompt("Nhập URL liên kết", "https://");
      if (!url?.trim()) {
        return;
      }
      document.execCommand("createLink", false, url.trim());
      setHtmlValue(normalizeHtml((document.getElementById(editorId)?.innerHTML ?? "")));
      return;
    }

    if (command === "formatBlock" && value) {
      document.execCommand("formatBlock", false, value);
      setHtmlValue(normalizeHtml((document.getElementById(editorId)?.innerHTML ?? "")));
      return;
    }

    document.execCommand(command, false);
    setHtmlValue(normalizeHtml((document.getElementById(editorId)?.innerHTML ?? "")));
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={editorId} className="text-sm font-medium">
        {label}
      </Label>

      <div className="rounded-xl border border-default-200 bg-background">
        <div className="flex flex-wrap items-center gap-2 border-b border-default-200 p-2">
          <Button type="button" size="sm" variant="secondary" onPress={() => runCommand("bold")}>
            B
          </Button>
          <Button type="button" size="sm" variant="secondary" onPress={() => runCommand("italic")}>
            I
          </Button>
          <Button type="button" size="sm" variant="secondary" onPress={() => runCommand("underline")}>
            U
          </Button>
          <Button type="button" size="sm" variant="secondary" onPress={() => runCommand("insertUnorderedList")}>
            • List
          </Button>
          <Button type="button" size="sm" variant="secondary" onPress={() => runCommand("insertOrderedList")}>
            1. List
          </Button>
          <Button type="button" size="sm" variant="secondary" onPress={() => runCommand("formatBlock", "<h3>")}>
            H3
          </Button>
          <Button type="button" size="sm" variant="secondary" onPress={() => runCommand("formatBlock", "<blockquote>")}>
            Quote
          </Button>
          <Button type="button" size="sm" variant="secondary" onPress={() => runCommand("createLink")}>
            Link
          </Button>
          <Button type="button" size="sm" variant="secondary" onPress={() => runCommand("unlink")}>
            Unlink
          </Button>
          <Button type="button" size="sm" variant="secondary" onPress={() => runCommand("removeFormat")}>
            Clear
          </Button>
        </div>

        <div className="relative">
          <div
            id={editorId}
            contentEditable
            suppressContentEditableWarning
            className="min-h-36 w-full px-3 py-3 text-sm leading-6 outline-none"
            onInput={(event) => {
              const html = normalizeHtml((event.currentTarget as HTMLDivElement).innerHTML);
              setHtmlValue(html);
            }}
            dangerouslySetInnerHTML={{ __html: initialValue }}
          />

          {!htmlValue ? (
            <span className="pointer-events-none absolute left-3 top-3 text-sm text-default-400">
              {placeholder}
            </span>
          ) : null}
        </div>
      </div>

      <input type="hidden" name={name} value={htmlValue} />
    </div>
  );
}