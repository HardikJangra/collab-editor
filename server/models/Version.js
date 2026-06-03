const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      default: "Anonymous",
      trim: true,
      maxlength: 100,
    },
    action: {
      type: String,
      enum: ["autosave", "manual", "restore", "init"],
      default: "autosave",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

versionSchema.index({ documentId: 1, versionNumber: -1 }, { unique: true });
versionSchema.index({ documentId: 1, createdAt: -1 });

module.exports = mongoose.model("Version", versionSchema);