const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  editedBy: {
    type: String,
    default: "Anonymous"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Version", versionSchema);