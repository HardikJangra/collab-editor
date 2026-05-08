const Document = require("../models/Document");

// In-memory store: docId -> Map<socketId, userInfo>
const documentRooms = new Map();
const liveDocuments = new Map();
const saveTimers = new Map();

const DOC_ID_PATTERN = /^[a-zA-Z0-9-]{6,64}$/;
const SERVER_AUTOSAVE_DELAY_MS = 1500;

const getUsersInRoom = (docId) => {
  const room = documentRooms.get(docId);
  if (!room) return [];
  return Array.from(room.values());
};

const isValidDocId = (docId) => typeof docId === "string" && DOC_ID_PATTERN.test(docId);

const persistDocument = async (docId, liveDoc = liveDocuments.get(docId)) => {
  if (!isValidDocId(docId) || !liveDoc) return null;

  const set = {
    lastSavedAt: new Date(),
  };

  if (Object.prototype.hasOwnProperty.call(liveDoc, "content")) {
    set.content = liveDoc.content;
  }

  if (Object.prototype.hasOwnProperty.call(liveDoc, "title")) {
    set.title = liveDoc.title || "Untitled Document";
  }

  return Document.findOneAndUpdate(
    { docId },
    {
      $set: set,
      $inc: { version: 1 },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
};

const schedulePersist = (docId) => {
  const existingTimer = saveTimers.get(docId);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(async () => {
    try {
      const doc = await persistDocument(docId);
      if (doc) {
        ioSafeEmit(docId, "document-saved", {
          timestamp: doc.lastSavedAt.toISOString(),
          version: doc.version,
        });
      }
    } catch (err) {
      console.error("autosave error:", err);
      ioSafeEmit(docId, "document-save-error", {
        message: "Failed to autosave document",
      });
    } finally {
      saveTimers.delete(docId);
    }
  }, SERVER_AUTOSAVE_DELAY_MS);

  saveTimers.set(docId, timer);
};

let activeIo = null;
const ioSafeEmit = (docId, event, payload) => {
  if (activeIo) activeIo.to(docId).emit(event, payload);
};

const socketHandler = (io) => {
  activeIo = io;

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    let currentDocId = null;
    let currentUser = null;

    // ── JOIN DOCUMENT ────────────────────────────────────────────────────────
    socket.on("join-document", async ({ docId, username }) => {
      try {
        if (!isValidDocId(docId)) {
          socket.emit("error", { message: "Invalid document ID" });
          return;
        }

        // Leave previous room if any
        if (currentDocId) {
          socket.leave(currentDocId);
          const prevRoom = documentRooms.get(currentDocId);
          if (prevRoom) {
            prevRoom.delete(socket.id);
            io.to(currentDocId).emit("users-update", getUsersInRoom(currentDocId));
          }
        }

        currentDocId = docId;
        currentUser = {
          socketId: socket.id,
          username: username || "Anonymous",
          color: generateUserColor(socket.id),
          joinedAt: new Date().toISOString(),
        };

        // Join socket room
        socket.join(docId);

        // Update room map
        if (!documentRooms.has(docId)) {
          documentRooms.set(docId, new Map());
        }
        documentRooms.get(docId).set(socket.id, currentUser);

        // Fetch doc from DB, then overlay any unsaved live room state.
        const doc = await Document.getOrCreate(docId);
        const liveDoc = liveDocuments.get(docId);

        // Send current document state to the joining user
        socket.emit("document-loaded", {
          docId: doc.docId,
          title: liveDoc?.title ?? doc.title,
          content: liveDoc?.content ?? doc.content,
          version: doc.version,
          lastSavedAt: doc.lastSavedAt,
        });

        Document.updateOne(
          { docId },
          { $set: { activeUsers: getUsersInRoom(docId).length } }
        ).catch((err) => console.error("activeUsers update error:", err));

        // Broadcast updated user list to everyone in room
        io.to(docId).emit("users-update", getUsersInRoom(docId));

        // Notify others
        socket.to(docId).emit("user-joined", {
          username: currentUser.username,
          color: currentUser.color,
        });

        console.log(`📄 ${currentUser.username} joined doc: ${docId}`);
      } catch (err) {
        console.error("join-document error:", err);
        socket.emit("error", { message: "Failed to load document" });
      }
    });

    // ── EDITOR CHANGE ────────────────────────────────────────────────────────
    socket.on("editor-change", ({ docId, content, cursorPosition }) => {
      if (!isValidDocId(docId) || typeof content !== "string") return;

      const liveDoc = liveDocuments.get(docId) || {};
      liveDocuments.set(docId, {
        ...liveDoc,
        content,
        updatedAt: new Date().toISOString(),
      });
      schedulePersist(docId);

      // Broadcast to all OTHER clients in the room (not sender)
      socket.to(docId).emit("editor-update", {
        content,
        cursorPosition,
        userId: socket.id,
      });
    });

    // ── TITLE CHANGE ─────────────────────────────────────────────────────────
    socket.on("title-change", ({ docId, title }) => {
      if (!isValidDocId(docId) || typeof title !== "string") return;

      const liveDoc = liveDocuments.get(docId) || {};
      liveDocuments.set(docId, {
        ...liveDoc,
        title,
        updatedAt: new Date().toISOString(),
      });
      schedulePersist(docId);

      socket.to(docId).emit("title-update", { title });
    });

    // ── CURSOR POSITION ──────────────────────────────────────────────────────
    socket.on("cursor-move", ({ docId, position, username }) => {
      if (!isValidDocId(docId)) return;

      socket.to(docId).emit("cursor-update", {
        socketId: socket.id,
        username,
        position,
        color: currentUser?.color,
      });
    });

    // ── SAVE DOCUMENT ────────────────────────────────────────────────────────
    socket.on("save-document", async ({ docId, content, title }) => {
      try {
        if (!isValidDocId(docId) || typeof content !== "string") {
          socket.emit("error", { message: "Invalid document data" });
          return;
        }

        const existingTimer = saveTimers.get(docId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          saveTimers.delete(docId);
        }

        liveDocuments.set(docId, {
          content,
          ...(typeof title === "string" ? { title } : {}),
          updatedAt: new Date().toISOString(),
        });

        const doc = await persistDocument(docId);
        io.to(docId).emit("document-saved", {
          timestamp: doc.lastSavedAt.toISOString(),
          version: doc.version,
        });
      } catch (err) {
        console.error("save-document error:", err);
        socket.emit("error", { message: "Failed to save document" });
      }
    });

    // ── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      if (currentDocId && currentUser) {
        const room = documentRooms.get(currentDocId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            documentRooms.delete(currentDocId);
            persistDocument(currentDocId)
              .catch((err) => console.error("disconnect save error:", err))
              .finally(() => {
                liveDocuments.delete(currentDocId);
                const existingTimer = saveTimers.get(currentDocId);
                if (existingTimer) clearTimeout(existingTimer);
                saveTimers.delete(currentDocId);
                Document.updateOne(
                  { docId: currentDocId },
                  { $set: { activeUsers: 0 } }
                ).catch((err) => console.error("activeUsers update error:", err));
              });
          } else {
            io.to(currentDocId).emit("users-update", getUsersInRoom(currentDocId));
            Document.updateOne(
              { docId: currentDocId },
              { $set: { activeUsers: getUsersInRoom(currentDocId).length } }
            ).catch((err) => console.error("activeUsers update error:", err));
          }
        }

        socket.to(currentDocId).emit("user-left", {
          username: currentUser.username,
        });

        console.log(`🔌 ${currentUser.username} disconnected from doc: ${currentDocId}`);
      }
    });
  });
};

// Generate deterministic color from socket ID
const generateUserColor = (socketId) => {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#82E0AA", "#F8C471",
  ];
  const index = socketId.charCodeAt(0) % colors.length;
  return colors[index];
};

module.exports = socketHandler;
