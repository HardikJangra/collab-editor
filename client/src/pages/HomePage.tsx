import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { createDocument } from "@/services/api";
import styles from "./HomePage.module.css";

const EXAMPLE_DOC_ID = "demo-getting-started";

export default function HomePage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [docInput, setDocInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNewDoc = async () => {
    setIsCreating(true);
    try {
      const docId = uuidv4().replace(/-/g, "").slice(0, 12);
      navigate(`/doc/${docId}`);
    } catch {
      setIsCreating(false);
    }
  };

  const handleOpenDoc = () => {
    const trimmed = docInput.trim();
    if (!trimmed) {
      setInputError("Please enter a document ID or URL");
      return;
    }
    // Extract docId from URL or use as-is
    const match = trimmed.match(/\/doc\/([a-zA-Z0-9-]+)/);
    const docId = match ? match[1] : trimmed;

    if (!/^[a-zA-Z0-9-]{6,64}$/.test(docId)) {
      setInputError("Invalid document ID format");
      return;
    }

    navigate(`/doc/${docId}`);
  };

  const features = [
    {
      icon: "⚡",
      title: "Real-Time Sync",
      desc: "Every keystroke synced instantly via WebSockets",
    },
    {
      icon: "👥",
      title: "Live Collaboration",
      desc: "See who's editing with live presence indicators",
    },
    {
      icon: "✍️",
      title: "Markdown Preview",
      desc: "Split-pane live preview with syntax highlighting",
    },
    {
      icon: "💾",
      title: "Auto Save",
      desc: "Continuous autosave keeps your work safe",
    },
    {
      icon: "🔗",
      title: "Instant Sharing",
      desc: "Share any doc with a unique link instantly",
    },
    {
      icon: "🛡️",
      title: "Production Ready",
      desc: "Rate limiting, error handling, reconnection logic",
    },
  ];

  return (
    <div className={`${styles.page} ${mounted ? styles.mounted : ""}`}>
      {/* Background Grid */}
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          <span className={styles.logoText}>Collab</span>
          <span className={styles.logoAccent}>Editor</span>
        </div>
        <nav className={styles.nav}>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className={styles.navLink}
          >
            GitHub
          </a>
          <button
            onClick={handleNewDoc}
            disabled={isCreating}
            className={styles.navCta}
          >
            Open Editor
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Real-Time Collaboration
          </div>

          <h1 className={styles.headline}>
            Write. Collaborate.
            <br />
            <span className={styles.headlineAccent}>Publish together.</span>
          </h1>

          <p className={styles.subheadline}>
            A lightning-fast collaborative markdown editor. Open a document,
            share the link, and write together — no accounts required.
          </p>

          {/* CTA */}
          <div className={styles.ctaGroup}>
            <button
              onClick={handleNewDoc}
              disabled={isCreating}
              className={styles.primaryBtn}
            >
              {isCreating ? (
                <>
                  <span className={styles.spinner} />
                  Creating...
                </>
              ) : (
                <>
                  <span>New Document</span>
                  <span className={styles.btnArrow}>→</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate(`/doc/${EXAMPLE_DOC_ID}`)}
              className={styles.secondaryBtn}
            >
              View Demo
            </button>
          </div>

          {/* Open Existing */}
          <div className={styles.openExisting}>
            <p className={styles.openLabel}>Or open an existing document</p>
            <div className={styles.openForm}>
              <input
                type="text"
                placeholder="Paste document ID or URL..."
                value={docInput}
                onChange={(e) => {
                  setDocInput(e.target.value);
                  setInputError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleOpenDoc()}
                className={`${styles.openInput} ${inputError ? styles.inputError : ""}`}
              />
              <button onClick={handleOpenDoc} className={styles.openBtn}>
                Open →
              </button>
            </div>
            {inputError && (
              <p className={styles.errorMsg}>{inputError}</p>
            )}
          </div>
        </div>

        {/* Editor Preview */}
        <div className={styles.previewContainer}>
          <div className={styles.previewDots}>
            <span style={{ background: "#ff5f57" }} />
            <span style={{ background: "#ffbd2e" }} />
            <span style={{ background: "#28c840" }} />
          </div>
          <div className={styles.previewBody}>
            <div className={styles.previewPane}>
              <div className={styles.previewPaneLabel}>Editor</div>
              <div className={styles.previewCode}>
                <span className={styles.codeLine}>
                  <span className={styles.codeH}># Hello World</span>
                </span>
                <span className={styles.codeLine}> </span>
                <span className={styles.codeLine}>
                  Welcome to{" "}
                  <span className={styles.codeBold}>**Collab Editor**</span>
                </span>
                <span className={styles.codeLine}> </span>
                <span className={styles.codeLine}>
                  - <span className={styles.codeList}>Real-time sync</span>
                </span>
                <span className={styles.codeLine}>
                  - <span className={styles.codeList}>Live preview</span>
                </span>
                <span className={styles.codeCursor} />
              </div>
            </div>
            <div className={styles.previewDivider} />
            <div className={styles.previewPane}>
              <div className={styles.previewPaneLabel}>Preview</div>
              <div className={styles.previewRendered}>
                <h1 className={styles.previewH1}>Hello World</h1>
                <p>
                  Welcome to <strong>Collab Editor</strong>
                </p>
                <ul className={styles.previewList}>
                  <li>Real-time sync</li>
                  <li>Live preview</li>
                </ul>
              </div>
            </div>
          </div>
          {/* Floating user avatars */}
          <div className={styles.floatingUsers}>
            <div className={styles.userAvatar} style={{ background: "#7c3aed" }}>H</div>
            <div className={styles.userAvatar} style={{ background: "#059669" }}>A</div>
            <div className={styles.userAvatar} style={{ background: "#dc2626" }}>S</div>
            <span className={styles.usersLabel}>3 editing now</span>
          </div>
        </div>

        {/* Features Grid */}
        <section className={styles.features}>
          <h2 className={styles.featuresTitle}>Everything you need</h2>
          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <div
                key={f.title}
                className={styles.featureCard}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className={styles.techStack}>
          <p className={styles.techLabel}>Built with</p>
          <div className={styles.techBadges}>
            {["React", "TypeScript", "Node.js", "Socket.io", "MongoDB", "Vite"].map(
              (t) => (
                <span key={t} className={styles.techBadge}>
                  {t}
                </span>
              )
            )}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>Built by Hardik · Real-Time Collaborative Markdown Editor</p>
      </footer>
    </div>
  );
}
