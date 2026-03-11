const Document = require("../models/Document");
const { v4: uuidv4 } = require("uuid");


// POST /api/documents — Create new document
const createDocument = async (req, res, next) => {
  try {
    const docId = uuidv4().split("-")[0] + uuidv4().split("-")[0]; // e.g. abc123def456
    const { title } = req.body;

    const doc = await Document.create({
      docId,
      title: title || "Untitled Document",
    });

    res.status(201).json({
      success: true,
      docId: doc.docId,
      title: doc.title,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/documents/:docId — Get document
const getDocument = async (req, res, next) => {
  try {
    const { docId } = req.params;

    // Validate docId format (alphanumeric, 8-32 chars)
    if (!/^[a-zA-Z0-9-]{6,64}$/.test(docId)) {
      return res.status(400).json({ error: "Invalid document ID format" });
    }

    const doc = await Document.getOrCreate(docId);

    res.status(200).json({
      success: true,
      docId: doc.docId,
      title: doc.title,
      content: doc.content,
      version: doc.version,
      lastSavedAt: doc.lastSavedAt,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/documents/:docId — Save document
const saveDocument = async (req, res, next) => {
  try {
    const { docId } = req.params;
    const { content, title } = req.body;

    if (content === undefined) {
      return res.status(400).json({ error: "Content is required" });
    }

    const doc = await Document.findOneAndUpdate(
      { docId },
      {
        $set: {
          content,
          ...(title && { title }),
          lastSavedAt: new Date(),
        },
        $inc: { version: 1 },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      docId: doc.docId,
      version: doc.version,
      lastSavedAt: doc.lastSavedAt,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// DELETE /api/documents/:docId — Delete document
const deleteDocument = async (req, res, next) => {
  try {
    const { docId } = req.params;
    const deleted = await Document.findOneAndDelete({ docId });

    if (!deleted) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.status(200).json({ success: true, message: "Document deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { createDocument, getDocument, saveDocument, deleteDocument };
