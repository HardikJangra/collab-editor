import type { User } from "@/types/editorTypes";
import styles from "./UserList.module.css";

interface UserListProps {
  users: User[];
  currentUsername: string;
}

export default function UserList({ users, currentUsername }: UserListProps) {
  const formatJoinTime = (joinedAt: string) => {
    const diff = Date.now() - new Date(joinedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just joined";
    if (mins === 1) return "1 min ago";
    return `${mins} mins ago`;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Collaborators</span>
        <span className={styles.count}>{users.length}</span>
      </div>

      <div className={styles.list}>
        {users.length === 0 ? (
          <div className={styles.empty}>
            <p>No one else is here</p>
            <p className={styles.emptyHint}>Share the link to collaborate</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.socketId}
              className={`${styles.userItem} ${
                user.username === currentUsername ? styles.self : ""
              }`}
            >
              <div
                className={styles.avatar}
                style={{ background: user.color }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className={styles.info}>
                <span className={styles.name}>
                  {user.username}
                  {user.username === currentUsername && (
                    <span className={styles.youTag}> (you)</span>
                  )}
                </span>
                <span className={styles.joinTime}>
                  {formatJoinTime(user.joinedAt)}
                </span>
              </div>
              <div
                className={styles.activeDot}
                style={{ background: user.color }}
              />
            </div>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.shareSection}>
          <p className={styles.shareLabel}>Share this document</p>
          <button
            className={styles.shareBtn}
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            Copy link ↗
          </button>
        </div>
      </div>
    </div>
  );
}
