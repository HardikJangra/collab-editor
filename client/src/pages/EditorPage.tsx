import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@/components/Editor";
import Preview from "@/components/Preview";
import Toolbar from "@/components/Toolbar";
import UserList from "@/components/UserList";
import StatusBar from "@/components/StatusBar";
import { useSocket } from "@/hooks/useSocket";
import { useDebounce } from "@/hooks/useDebounce";
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const username = useRef(getStoredUsername()).current;
  const isRemoteUpdate = useRef(false);
  const autosaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!docId) {
    navigate("/");
    return null;
  }

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Socket Events ──────────────────────────────────────────────────────────
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
      isRemoteUpdate.current = true;
      setContent(c);
    },
    onTitleUpdate: ({ title: t }) => setTitle(t),
    onUsersUpdate: (u) => setUsers(u),
    onDocumentSaved: ({ timestamp }) => {
      setSaveStatus("saved");
      setLastSaved(new Date(timestamp));
      setTimeout(() => setSaveStatus("idle"), 2000);
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

  // ── Content Change ─────────────────────────────────────────────────────────
  const handleContentChange = useCallback(
    (newContent: string) => {
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
      }
      setContent(newContent);
      setSaveStatus("saving");
      emitChange(newContent);
    },
    [emitChange]
  );

  // ── Title Change ───────────────────────────────────────────────────────────
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      emitTitleChange(newTitle);
    },
    [emitTitleChange]
  );

  // ── Autosave ───────────────────────────────────────────────────────────────
  const performSave = useCallback(() => {
    if (!content) return;
    emitSave(content, title);
    setSaveStatus("saving");
  }, [content, title, emitSave]);

  useEffect(() => {
    autosaveTimer.current = setInterval(performSave, 5000);
    return () => {
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
    };
  }, [performSave]);

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
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

  // ── Share Link ─────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    showNotification("Link copied to clipboard!");
  }, []);

  // ── Toolbar Insert ─────────────────────────────────────────────────────────
  const handleToolbarInsert = useCallback((prefix: string, suffix = "") => {
    const textarea = document.querySelector<HTMLTextAreaElement>(".editor-textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const newContent =
      content.slice(0, start) + prefix + selected + suffix + content.slice(end);

    setContent(newContent);
    emitChange(newContent);

    // Restore cursor position after state update
    requestAnimationFrame(() => {
      const newPos = start + prefix.length + selected.length + suffix.length;
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    });
  }, [content, emitChange]);

  return (
    <div className={styles.layout}>
      {/* Notification */}
      {notification && (
        <div className={styles.notification}>
          <span>{notification}</span>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate("/")} className={styles.logoBtn}>
            <span className={styles.logoIcon}>◈</span>
          </button>
          <div className={styles.titleWrapper}>
            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") {
                    setIsEditingTitle(false);
                  }
                }}
                className={styles.titleInput}
              />
            ) : (
              <button
                className={styles.titleButton}
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename"
              >
                <span className={styles.titleText}>{title}</span>
                <span className={styles.editIcon}>✏️</span>
              </button>
            )}
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Connection */}
          <div className={`${styles.connectionBadge} ${isConnected ? styles.connected : styles.disconnected}`}>
            <span className={styles.connectionDot} />
            <span>{isConnecting ? "Connecting..." : isConnected ? "Live" : "Offline"}</span>
          </div>

          {/* View toggle */}
          <div className={styles.viewToggle}>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`${styles.toggleBtn} ${showPreview ? styles.active : ""}`}
              title="Toggle Preview"
            >
              Preview
            </button>
          </div>

          {/* Users */}
          <button
            onClick={() => setShowUsers(!showUsers)}
            className={styles.usersBtn}
            title="Toggle Users Panel"
          >
            <span className={styles.usersBtnDot} />
            {users.length} online
          </button>

          {/* Share */}
          <button onClick={handleShare} className={styles.shareBtn}>
            Share ↗
          </button>

          {/* Save */}
          <button onClick={performSave} className={styles.saveBtn} disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? (
              <><span className={styles.spinner} /> Saving</>
            ) : saveStatus === "saved" ? (
              <><span className={styles.savedDot} /> Saved</>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </header>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <Toolbar onInsert={handleToolbarInsert} />

      {/* ── Editor Body ───────────────────────────────────────────────────── */}
      <div className={styles.body}>
        <div className={`${styles.editorPane} ${!showPreview ? styles.fullWidth : ""}`}>
          {isConnecting ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <p>Loading document...</p>
            </div>
          ) : (
            <Editor
              content={content}
              onChange={handleContentChange}
              placeholder="Start typing your markdown..."
              docId={docId}
            />
          )}
        </div>

        {showPreview && (
          <div className={styles.previewPane}>
            <Preview content={content} />
          </div>
        )}

        {showUsers && (
          <aside className={styles.sidebar}>
            <UserList users={users} currentUsername={username} />
          </aside>
        )}
      </div>

      {/* ── Status Bar ────────────────────────────────────────────────────── */}
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
