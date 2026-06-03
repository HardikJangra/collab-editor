const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  listVersions,
  getVersion,
  saveVersion,
  restoreVersion,
} = require("../controllers/versionController");

router.get("/", listVersions);
router.get("/:versionId", getVersion);
router.post("/", saveVersion);
router.post("/:versionId/restore", restoreVersion);

module.exports = router;
