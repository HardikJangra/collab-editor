import { useEffect, useState } from "react";

interface Version {
  _id: string;
  content: string;
  editedBy: string;
  createdAt: string;
}

interface Props {
  docId: string;
  onRestore: (content: string) => void;
}

const VersionHistory = ({ docId, onRestore }: Props) => {
  const [versions, setVersions] = useState<Version[]>([]);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await fetch(`/api/documents/${docId}/versions`);
        const data = await res.json();
        setVersions(data.versions || []);
      } catch (err) {
        console.error("Failed to fetch versions", err);
      }
    };

    fetchVersions();
  }, [docId]);

  const restoreVersion = async (versionId: string) => {
    try {
      const res = await fetch(`/api/documents/restore/${versionId}`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.document) {
        onRestore(data.document.content);
      }
    } catch (err) {
      console.error("Restore failed", err);
    }
  };

  return (
    <div
      style={{
        width: "260px",
        borderLeft: "1px solid #ccc",
        padding: "10px",
        overflowY: "auto",
      }}
    >
      <h3>Version History</h3>

      {versions.length === 0 && <p>No versions yet</p>}

      {versions.map((v) => (
        <div
          key={v._id}
          style={{
            marginBottom: "12px",
            padding: "6px",
            borderBottom: "1px solid #eee",
          }}
        >
          <div style={{ fontSize: "12px" }}>
            {new Date(v.createdAt).toLocaleString()}
          </div>

          <button
            onClick={() => restoreVersion(v._id)}
            style={{
              marginTop: "4px",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
};

export default VersionHistory;