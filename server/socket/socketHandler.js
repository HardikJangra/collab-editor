const Document = require("../models/Document");

// In-memory store: docId -> Map<socketId, userInfo>
const documentRooms = new Map();

const getUsersInRoom = (docId) => {
  const room = documentRooms.get(docId);
  if (!room) return [];
  return Array.from(room.values());
};

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    let currentDocId = null;
    let currentUser = null;

    // ── JOIN DOCUMENT ────────────────────────────────────────────────────────
    socket.on("join-document", async ({ docId, username }) => {
      try {
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

        // Fetch doc from DB
        const doc = await Document.getOrCreate(docId);

        // Send current document state to the joining user
        socket.emit("document-loaded", {
          docId: doc.docId,
          title: doc.title,
          content: doc.content,
          version: doc.version,
          lastSavedAt: doc.lastSavedAt,
        });

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
      // Broadcast to all OTHER clients in the room (not sender)
      socket.to(docId).emit("editor-update", {
        content,
        cursorPosition,
        userId: socket.id,
      });
    });

    // ── TITLE CHANGE ─────────────────────────────────────────────────────────
    socket.on("title-change", ({ docId, title }) => {
      socket.to(docId).emit("title-update", { title });
    });

    // ── CURSOR POSITION ──────────────────────────────────────────────────────
    socket.on("cursor-move", ({ docId, position, username }) => {
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
        await Document.findOneAndUpdate(
          { docId },
          {
            $set: { content, ...(title && { title }), lastSavedAt: new Date() },
            $inc: { version: 1 },
          },
          { upsert: true }
        );
        io.to(docId).emit("document-saved", { timestamp: new Date().toISOString() });
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
          } else {
            io.to(currentDocId).emit("users-update", getUsersInRoom(currentDocId));
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
