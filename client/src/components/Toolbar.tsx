import styles from "./Toolbar.module.css";

interface ToolbarProps {
  onInsert: (prefix: string, suffix?: string) => void;
}

const tools = [
  { label: "H1", title: "Heading 1", prefix: "# ", suffix: "" },
  { label: "H2", title: "Heading 2", prefix: "## ", suffix: "" },
  { label: "H3", title: "Heading 3", prefix: "### ", suffix: "" },
  { label: "divider" },
  { label: "B", title: "Bold", prefix: "**", suffix: "**" },
  { label: "I", title: "Italic", prefix: "_", suffix: "_" },
  { label: "~~", title: "Strikethrough", prefix: "~~", suffix: "~~" },
  { label: "divider" },
  { label: "• List", title: "Bullet List", prefix: "- ", suffix: "" },
  { label: "1. List", title: "Ordered List", prefix: "1. ", suffix: "" },
  { label: "[ ] Task", title: "Task List", prefix: "- [ ] ", suffix: "" },
  { label: "divider" },
  { label: "</>", title: "Inline Code", prefix: "`", suffix: "`" },
  { label: "Block", title: "Code Block", prefix: "```\n", suffix: "\n```" },
  { label: "divider" },
  { label: "> Quote", title: "Blockquote", prefix: "> ", suffix: "" },
  { label: "---", title: "Horizontal Rule", prefix: "\n---\n", suffix: "" },
  { label: "[Link]", title: "Link", prefix: "[", suffix: "](url)" },
  { label: "![Img]", title: "Image", prefix: "![alt](", suffix: ")" },
] as const;

export default function Toolbar({ onInsert }: ToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Markdown formatting">
      {tools.map((tool, i) => {
        if (tool.label === "divider") {
          return <div key={`div-${i}`} className={styles.divider} aria-hidden="true" />;
        }
        return (
          <button
            key={tool.label}
            onClick={() => onInsert(tool.prefix, tool.suffix || "")}
            className={styles.btn}
            title={tool.title}
            aria-label={tool.title}
          >
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
