const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    docId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      default: "Untitled Document",
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      default: "# Welcome to Collab Editor\n\nStart typing your markdown here...",
      maxlength: [500000, "Document content is too large"],
    },
    version: {
      type: Number,
      default: 1,
    },
    activeUsers: {
      type: Number,
      default: 0,
    },
    lastSavedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

documentSchema.index({ updatedAt: -1 });

documentSchema.statics.findByDocId = function (docId) {
  return this.findOne({ docId });
};

documentSchema.statics.getOrCreate = async function (docId) {
  let doc = await this.findOne({ docId });
  if (!doc) {
    doc = await this.create({ docId });
  }
  return doc;
};

const Document = mongoose.model("Document", documentSchema);
module.exports = Document;
