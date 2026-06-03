const express = require("express");
const router = express.Router();
const {
  createDocument,
  getDocument,
  saveDocument,
  deleteDocument,
} = require("../controllers/documentController");
const versionRoutes = require("./versionRoutes");
const { createDocLimiter } = require("../middleware/rateLimiter");

router.post("/", createDocLimiter, createDocument);
router.get("/:docId", getDocument);
router.put("/:docId", saveDocument);
router.delete("/:docId", deleteDocument);

router.use("/:docId/versions", versionRoutes);

module.exports = router;
