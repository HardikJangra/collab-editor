import styles from "./StatusBar.module.css";

interface StatusBarProps {
  docId: string;
  lastSaved: Date | null;
  wordCount: number;
  charCount: number;
  lineCount: number;
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function StatusBar({
  docId,
  lastSaved,
  wordCount,
  charCount,
  lineCount,
}: StatusBarProps) {
  return (
    <footer className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.docId}>doc/{docId}</span>
        {lastSaved && (
          <span className={styles.saved}>
            Saved at {formatTime(lastSaved)}
          </span>
        )}
      </div>
      <div className={styles.right}>
        <span className={styles.stat}>{lineCount} lines</span>
        <span className={styles.sep}>·</span>
        <span className={styles.stat}>{wordCount} words</span>
        <span className={styles.sep}>·</span>
        <span className={styles.stat}>{charCount} chars</span>
        <span className={styles.sep}>·</span>
        <span className={styles.markdown}>Markdown</span>
      </div>
    </footer>
  );
}
