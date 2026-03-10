import { useRef, useEffect, useCallback } from "react";
import styles from "./Editor.module.css";

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  docId: string;
}

export default function Editor({ content, onChange, placeholder, docId }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Tab Key Support ────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (e.key === "Tab") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.slice(0, start) + "  " + content.slice(end);
        onChange(newContent);
        requestAnimationFrame(() => {
          textarea.setSelectionRange(start + 2, start + 2);
        });
      }

      // Auto-close markdown pairs
      const pairs: Record<string, string> = {
        "*": "*",
        "`": "`",
        "[": "]",
        "(": ")",
        "_": "_",
      };

      if (pairs[e.key] && textarea.selectionStart !== textarea.selectionEnd) {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = content.slice(start, end);
        const newContent =
          content.slice(0, start) + e.key + selected + pairs[e.key] + content.slice(end);
        onChange(newContent);
        requestAnimationFrame(() => {
          textarea.setSelectionRange(start + 1, end + 1);
        });
      }
    },
    [content, onChange]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, textarea.clientHeight)}px`;
  }, [content]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.editorHeader}>
        <span className={styles.label}>Markdown</span>
        <span className={styles.docId} title="Document ID">
          # {docId}
        </span>
      </div>
      <div className={styles.editorBody}>
        <div className={styles.lineNumbers} aria-hidden="true">
          {content.split("\n").map((_, i) => (
            <span key={i} className={styles.lineNum}>
              {i + 1}
            </span>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className={`${styles.textarea} editor-textarea`}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          data-gramm="false"
          aria-label="Markdown editor"
        />
      </div>
    </div>
  );
}
