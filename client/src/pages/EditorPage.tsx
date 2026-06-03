import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@/components/Editor";
import Preview from "@/components/Preview";
import Toolbar from "@/components/Toolbar";
import UserList from "@/components/UserList";
import VersionHistory from "@/components/VersionHistory";
import StatusBar from "@/components/StatusBar";
import { useSocket } from "@/hooks/useSocket";
import { getStoredUsername } from "@/utils/username";
import type { User, SaveStatus } from "@/types/editorTypes";
import styles from "./EditorPage.module.css";

export default function EditorPage() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Untitled Document");
  const [users, setUsers] = useState<User[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showUsers, setShowUsers] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [versionHistoryStale, setVersionHistoryStale] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const username = useRef(getStoredUsername()).current;
  const autosaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const localUser = useMemo(
    () => ({
      socketId: "local-user",
      username,
      color: "#242421",
      joinedAt: new Date().toISOString(),
    }),
    [username]
  );
  const visibleUsers = useMemo(() => {
    const hasCurrentUser = users.some((user) => user.username === username);
    return hasCurrentUser ? users : [localUser, ...users];
  }, [localUser, users, username]);

  if (!docId) {
    navigate("/");
    return null;
  }

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const { emitChange, emitTitleChange, emitSave } = useSocket({
    docId,
    username,
    onDocumentLoaded: ({ content: c, title: t, lastSavedAt }) => {
      setContent(c);
      setTitle(t);
      setIsConnecting(false);
      if (lastSavedAt) setLastSaved(new Date(lastSavedAt));
    },
    onEditorUpdate: ({ content: c }) => {
      setContent(c);
    },
    onTitleUpdate: ({ title: t }) => setTitle(t),
    onUsersUpdate: (u) => setUsers(u),
    onDocumentSaved: ({ timestamp }) => {
      setSaveStatus("saved");
      setLastSaved(new Date(timestamp));
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onDocumentRestored: ({ content: restoredContent, restoredBy }) => {
      setContent(restoredContent);
      setSaveStatus("saved");
      showNotification(`Restored by ${restoredBy}`);
    },
    onVersionHistoryUpdated: () => {
      setVersionHistoryStale(true);
    },
    onConnected: () => {
      setIsConnected(true);
      setIsConnecting(false);
    },
    onDisconnected: () => {
      setIsConnected(false);
      setIsConnecting(true);
    },
    onError: (msg) => showNotification(msg),
  });

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setSaveStatus("saving");
      emitChange(newContent);
    },
    [emitChange]
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      emitTitleChange(newTitle);
    },
    [emitTitleChange]
  );

  const performSave = useCallback(() => {
    emitSave(content, title);
    setSaveStatus("saving");
  }, [content, title, emitSave]);

  useEffect(() => {
    autosaveTimer.current = setInterval(performSave, 5000);
    return () => {
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
    };
  }, [performSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        performSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [performSave]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    showNotification("Link copied to clipboard!");
  }, []);

  const handleToolbarInsert = useCallback(
    (prefix: string, suffix = "") => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        ".editor-textarea"
      );
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.slice(start, end);

      const newContent =
        content.slice(0, start) +
        prefix +
        selected +
        suffix +
        content.slice(end);

      setContent(newContent);
      emitChange(newContent);

      requestAnimationFrame(() => {
        const newPos =
          start + prefix.length + selected.length + suffix.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
      });
    },
    [content, emitChange]
  );

  

  return (
    <div className={styles.layout}>
      {notification && (
        <div className={styles.notification}>
          <span>{notification}</span>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate("/")} className={styles.logoBtn}>
            <span className={styles.logoMark} aria-hidden="true">
              <span className={styles.logoLine} />
              <span className={styles.logoLine} />
            </span>
          </button>

          <div className={styles.titleWrapper}>
            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                className={styles.titleInput}
              />
            ) : (
              <button
                className={styles.titleButton}
                onClick={() => setIsEditingTitle(true)}
              >
                <span className={styles.titleText}>{title}</span>
              </button>
            )}
          </div>
        </div>

        <div className={styles.headerRight}>
          <span
            className={`${styles.connectionBadge} ${
              isConnected ? styles.connected : styles.disconnected
            }`}
          >
            <span className={styles.connectionDot} />
            {isConnected ? "Live" : isConnecting ? "Connecting" : "Offline"}
          </span>

          <button onClick={handleShare} className={styles.shareBtn}>
            Share
          </button>

          <button
            onClick={performSave}
            className={styles.saveBtn}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <Toolbar
        onInsert={handleToolbarInsert}
        onOpenHistory={() => setShowHistory((prev) => !prev)}
      />

      <div className={styles.body}>
        <div
          className={`${styles.editorPane} ${
            !showPreview ? styles.fullWidth : ""
          }`}
        >
          <Editor
            content={content}
            onChange={handleContentChange}
            placeholder="Start typing your markdown..."
            docId={docId}
          />
        </div>

        {showPreview && (
          <div className={styles.previewPane}>
            <Preview content={content} />
          </div>
        )}

        <aside className={styles.sidebar}>
          {showHistory ? (
            <VersionHistory
              docId={docId}
              currentContent={content}
              currentUsername={username}
              isStale={versionHistoryStale}
              onRefresh={() => setVersionHistoryStale(false)}
              onClose={() => {
                setShowHistory(false);
                setVersionHistoryStale(false);
              }}
              onRestore={(restoredContent: string) => {
                setContent(restoredContent);
                showNotification("Version restored successfully");
              }}
            />
          ) : (
            <UserList users={visibleUsers} currentUsername={username} />
          )}

          
        </aside>
      </div>

      <StatusBar
        docId={docId}
        lastSaved={lastSaved}
        wordCount={content.split(/\s+/).filter(Boolean).length}
        charCount={content.length}
        lineCount={content.split("\n").length}
      />
    </div>
  );
}
