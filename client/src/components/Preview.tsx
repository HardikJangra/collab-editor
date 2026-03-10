import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import styles from "./Preview.module.css";

interface PreviewProps {
  content: string;
}

export default function Preview({ content }: PreviewProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>Preview</span>
        <span className={styles.renderLabel}>Live Render</span>
      </div>
      <div className={styles.body}>
        {content.trim() ? (
          <div className={styles.markdown}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                // Custom code block rendering
                code({ node, className, children, ...props }) {
                  const isInline = !className;
                  return isInline ? (
                    <code className={styles.inlineCode} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                // Open links in new tab
                a({ href, children, ...props }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>◈</div>
            <p>Your preview will appear here</p>
            <p className={styles.emptyHint}>Start typing markdown on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}
