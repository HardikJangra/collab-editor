const {
  createVersionEntry,
  getDocumentVersions,
  getDocumentVersion,
  restoreVersionEntry,
} = require("../services/versionService");
const { emitToRoom } = require("../socket/socketEvents");

const listVersions = async (req, res, next) => {
  try {
    const { docId } = req.params;
    const versions = await getDocumentVersions(docId);

    res.status(200).json({
      success: true,
      versions: versions.map((version) => ({
        versionId: version._id,
        documentId: version.documentId,
        versionNumber: version.versionNumber,
        createdBy: version.createdBy,
        action: version.action,
        note: version.note,
        createdAt: version.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getVersion = async (req, res, next) => {
  try {
    const { docId, versionId } = req.params;
    const version = await getDocumentVersion(docId, versionId);

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    res.status(200).json({
      success: true,
      version: {
        versionId: version._id,
        documentId: version.documentId,
        versionNumber: version.versionNumber,
        content: version.content,
        createdBy: version.createdBy,
        action: version.action,
        note: version.note,
        createdAt: version.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const saveVersion = async (req, res, next) => {
  try {
    const { docId } = req.params;
    const { content, createdBy } = req.body;

    if (typeof content !== "string") {
      return res.status(400).json({ error: "Content is required" });
    }

    const result = await createVersionEntry({
      documentId: docId,
      content,
      createdBy: typeof createdBy === "string" ? createdBy : "Anonymous",
      action: "manual",
    });

    if (!result) {
      return res.status(200).json({
        success: true,
        message: "No new version created because content did not change.",
      });
    }

    emitToRoom(docId, "version-history-updated", {
      versionNumber: result.version.versionNumber,
      createdBy: result.version.createdBy,
      action: result.version.action,
      createdAt: result.version.createdAt,
    });

    res.status(201).json({
      success: true,
      version: {
        versionId: result.version._id,
        versionNumber: result.version.versionNumber,
        createdBy: result.version.createdBy,
        action: result.version.action,
        createdAt: result.version.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const restoreVersion = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const createdBy = req.body.createdBy || "Anonymous";

    const result = await restoreVersionEntry({
      versionId,
      createdBy,
    });

    if (!result || !result.document) {
      return res.status(404).json({ error: "Version not found" });
    }

    emitToRoom(result.document.docId, "document-restored", {
      content: result.document.content,
      version: result.document.version,
      restoredBy: createdBy,
      restoredAt: result.restoredVersion.createdAt,
      action: "restore",
    });

    emitToRoom(result.document.docId, "version-history-updated", {
      versionNumber: result.restoredVersion.versionNumber,
      createdBy: result.restoredVersion.createdBy,
      action: result.restoredVersion.action,
      createdAt: result.restoredVersion.createdAt,
    });

    res.status(200).json({
      success: true,
      document: {
        docId: result.document.docId,
        content: result.document.content,
        version: result.document.version,
        lastSavedAt: result.document.lastSavedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listVersions,
  getVersion,
  saveVersion,
  restoreVersion,
};
