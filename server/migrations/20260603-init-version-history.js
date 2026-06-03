require("dotenv").config();
const connectDB = require("../config/db");
const Document = require("../models/Document");
const { ensureInitialVersionRecord } = require("../services/versionService");

const runMigration = async () => {
  try {
    await connectDB();
    const documents = await Document.find({}).lean();
    console.log(`Found ${documents.length} documents to inspect for version initialization.`);

    let migratedCount = 0;
    let skippedCount = 0;
    const skippedDocumentIds = [];

    for (const document of documents) {
      try {
        const created = await ensureInitialVersionRecord(document);
        if (created) {
          migratedCount += 1;
          console.log(`✓ created initial version for ${document.docId}`);
          continue;
        }

        if (created === false) {
          skippedCount += 1;
          skippedDocumentIds.push(document.docId || "<missing-docId>");
          console.warn(`⚠️ skipped invalid document ${document.docId || "<missing-docId>"}`);
        }
      } catch (error) {
        skippedCount += 1;
        const docId = document?.docId || "<missing-docId>";
        skippedDocumentIds.push(docId);
        console.error(`⚠️ skipped document ${docId}:`, error.message || error);
      }
    }

    console.log(`Migration complete.`);
    console.log(`Migrated count: ${migratedCount}`);
    console.log(`Skipped count: ${skippedCount}`);
    console.log(`Skipped document IDs: ${skippedDocumentIds.join(", ")}`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
