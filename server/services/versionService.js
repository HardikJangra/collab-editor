const crypto = require("crypto");
const Document = require("../models/Document");
const Version = require("../models/Version");

const hashContent = (content = "") =>
  crypto.createHash("sha256").update(content || "").digest("hex");

const getLatestVersion = async (documentId) =>
  Version.findOne({ documentId }).sort({ versionNumber: -1 }).lean();

const createVersionEntry = async ({
  documentId,
  content,
  title,
  createdBy = "Anonymous",
  action = "autosave",
  note = "",
}) => {
  const normalizedContent = typeof content === "string" ? content : "";
  const normalizedTitle = typeof title === "string" ? title : "";
  const contentHash = hashContent(`${normalizedTitle}:${normalizedContent}`);

  const existingDocument = await Document.findOne({ docId: documentId });
  const isDuplicate =
    existingDocument &&
    existingDocument.lastVersionHash === contentHash &&
    action !== "restore";

  if (isDuplicate) {
    return null;
  }

  const updateFields = {
    content: normalizedContent,
    lastSavedAt: new Date(),
    lastVersionHash: contentHash,
  };

  if (normalizedTitle !== undefined) {
    updateFields.title = normalizedTitle || "Untitled Document";
  }

  const updatedDocument = await Document.findOneAndUpdate(
    { docId: documentId },
    {
      $set: updateFields,
      $inc: { version: 1 },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  const versionNumber = updatedDocument.version;
  const version = await Version.create({
    documentId,
    versionNumber,
    content: normalizedContent,
    createdBy: createdBy || "Anonymous",
    action,
    note,
  });

  return { version, document: updatedDocument };
};

const restoreVersionEntry = async ({ versionId, createdBy = "Anonymous" }) => {
  const version = await Version.findById(versionId).lean();
  if (!version) {
    return null;
  }

  const note = `Restored from version ${version.versionNumber}`;
  const result = await createVersionEntry({
    documentId: version.documentId,
    content: version.content,
    createdBy,
    action: "restore",
    note,
  });

  return {
    restoredVersion: result ? result.version : null,
    originalVersion: version,
    document: result ? result.document : null,
  };
};

const getDocumentVersions = async (documentId, limit = 50) =>
  Version.find({ documentId })
    .sort({ versionNumber: -1, createdAt: -1 })
    .limit(limit)
    .lean();

const getDocumentVersion = async (documentId, versionId) =>
  Version.findOne({ _id: versionId, documentId }).lean();

const ensureInitialVersionRecord = async (document) => {
  if (!document || typeof document.docId !== "string" || document.docId.trim() === "") {
    return false;
  }

  const existingVersion = await Version.findOne({ documentId: document.docId });
  if (existingVersion) {
    return null;
  }

  if (typeof document.content !== "string" || document.content.length === 0) {
    return false;
  }

  const contentHash = hashContent(document.content);
  const initialVersionNumber = document.version > 0 ? document.version : 1;

  await Version.create({
    documentId: document.docId,
    versionNumber: initialVersionNumber,
    content: document.content,
    createdBy: "System",
    action: "init",
    note: "Initial version created during migration",
  });

  await Document.updateOne(
    { docId: document.docId },
    { $set: { lastVersionHash: contentHash, version: initialVersionNumber } }
  );

  return true;
};

module.exports = {
  createVersionEntry,
  restoreVersionEntry,
  getDocumentVersions,
  getDocumentVersion,
  getLatestVersion,
  ensureInitialVersionRecord,
};
