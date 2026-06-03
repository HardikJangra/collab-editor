import { useEffect, useState, useCallback } from "react";
import styles from "./VersionHistory.module.css";

interface VersionSummary {
  versionId: string;
  documentId: string;
  versionNumber: number;
  createdBy: string;
  action: string;
  note: string;
  createdAt: string;
}

interface VersionDetail extends VersionSummary {
  content: string;
}

interface Props {
  docId: string;
  currentContent: string;
  currentUsername: string;
  isStale: boolean;
  onRefresh: () => void;
  onClose: () => void;
  onRestore: (content: string) => void;
}

const formatRelativeTime = (value: string) => {
  const delta = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (delta < 60) return "just now";
  if (delta < 3600) return `${Math.floor(delta / 60)} minutes ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)} hours ago`;
  return `${Math.floor(delta / 86400)} days ago`;
};

const actionLabels: Record<string, string> = {
  autosave: "Auto-save",
  manual: "Manual save",
  restore: "Restore",
  init: "Initial",
};

const VersionHistory = ({
  docId,
  currentContent,
  currentUsername,
  isStale,
  onRefresh,
  onClose,
  onRestore,
}: Props) => {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<VersionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${docId}/versions`);
      if (!res.ok) throw new Error("Unable to load version history");
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError((err as Error).message || "Failed to load versions");
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  useEffect(() => {
    if (isStale) {
      fetchVersions().then(onRefresh).catch(() => onRefresh());
    }
  }, [fetchVersions, isStale, onRefresh]);

  const loadVersion = async (versionId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/documents/${docId}/versions/${versionId}`);
      if (!res.ok) throw new Error("Unable to fetch version preview");
      const data = await res.json();
      setSelectedVersion(data.version);
    } catch (err) {
      setError((err as Error).message || "Failed to load version preview");
    }
  };

  const restoreVersion = async (versionId: string) => {
    setError(null);
    setIsRunning(true);
    try {
      const res = await fetch(
        `/api/documents/${docId}/versions/${versionId}/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ createdBy: currentUsername }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Restore failed");
      }

      const data = await res.json();
      onRestore(data.document.content);
      await fetchVersions();
      setConfirmRestoreId(null);
      if (selectedVersion?.versionId === versionId) {
        setSelectedVersion((state) =>
          state ? { ...state, content: data.document.content } : state
        );
      }
    } catch (err) {
      setError((err as Error).message || "Restore failed");
    } finally {
      setIsRunning(false);
    }
  };

  const activeContentMatch = selectedVersion
    ? selectedVersion.content === currentContent
    : false;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div>
          <h3 className={styles.title}>Version History</h3>
          <p className={styles.description}>Browse saved revisions and restore safely.</p>
        </div>
        <button className={styles.closeBtn} type="button" onClick={() => onClose()}>
          Close
        </button>
      </div>

      {error ? <div className={styles.smallText}>{error}</div> : null}
      {loading ? <div className={styles.smallText}>Loading versions…</div> : null}

      <div className={styles.versionList}>
        {!loading && versions.length === 0 && (
          <div className={styles.emptyState}>No versions available yet.</div>
        )}

        {versions.map((version) => (
          <div
            key={version.versionId}
            className={`${styles.versionCard} ${
              selectedVersion?.versionId === version.versionId
                ? styles.versionCardActive
                : ""
            }`}
            onClick={() => loadVersion(version.versionId)}
          >
            <div className={styles.row}>
              <strong>Version {version.versionNumber}</strong>
              <span className={styles.badge}>{actionLabels[version.action] || "Saved"}</span>
            </div>
            <div className={styles.meta}>
              {version.createdBy} · {formatRelativeTime(version.createdAt)}
            </div>
            {version.note ? <div className={styles.meta}>{version.note}</div> : null}
          </div>
        ))}
      </div>

      {selectedVersion && (
        <div className={styles.preview}>
          <div className={styles.row}>
            <strong>Preview {selectedVersion.versionNumber}</strong>
            <span className={styles.badge}>{formatRelativeTime(selectedVersion.createdAt)}</span>
          </div>
          <div className={styles.meta}>
            {selectedVersion.createdBy} · {actionLabels[selectedVersion.action]}
          </div>
          {selectedVersion.note ? <div className={styles.meta}>{selectedVersion.note}</div> : null}
          <pre>{selectedVersion.content.slice(0, 1024)}</pre>
          <div className={styles.meta}>
            {activeContentMatch
              ? "This version matches the current editor state."
              : "This version differs from the current document."}
          </div>
          <div className={styles.buttons}>
            <button
              className={styles.refreshBtn}
              type="button"
              onClick={fetchVersions}
            >
              Refresh list
            </button>
            <button
              className={styles.restoreBtn}
              type="button"
              onClick={() => setConfirmRestoreId(selectedVersion.versionId)}
              disabled={isRunning}
            >
              Restore
            </button>
          </div>
          {confirmRestoreId === selectedVersion.versionId && (
            <div className={styles.confirmation}>
              <p>
                Restore this version for all collaborators? This will replace current
                content immediately.
              </p>
              <div className={styles.buttons}>
                <button
                  className={styles.refreshBtn}
                  type="button"
                  onClick={() => setConfirmRestoreId(null)}
                >
                  Cancel
                </button>
                <button
                  className={styles.restoreBtn}
                  type="button"
                  onClick={() => restoreVersion(selectedVersion.versionId)}
                  disabled={isRunning}
                >
                  Confirm restore
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionHistory;