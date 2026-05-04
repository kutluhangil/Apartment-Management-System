// Aidat ödemelerine 'amount' sütunu ekle
// Kullanım: node src/db/migrate_add_amount_to_payments.js
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const { db } = require("./database");

async function migrate() {
  try {
    console.log("⚙️  Migration başlatılıyor...");

    // Check if column already exists
    const result = await db.execute("PRAGMA table_info(aidat_payments)");
    const hasAmountColumn = result.rows.some((row) => row.name === "amount");

    if (hasAmountColumn) {
      console.log('✅ "amount" sütunu zaten mevcut.');
      process.exit(0);
    }

    console.log('📝 "amount" sütunu ekleniyor...');
    await db.execute(
      "ALTER TABLE aidat_payments ADD COLUMN amount REAL NOT NULL DEFAULT 1000",
    );

    console.log('✅ Migration başarılı! "amount" sütunu eklendi.');
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration başarısız:", error.message);
    process.exit(1);
  }
}

migrate();
