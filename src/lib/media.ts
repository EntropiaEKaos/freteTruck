import { pool } from "@/db";

export async function ensureMediaUploadsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS media_uploads (
      id serial PRIMARY KEY,
      filename varchar(160) NOT NULL UNIQUE,
      mime_type varchar(60) NOT NULL,
      data_base64 text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
  `;
  try {
    await pool.query(sql);
  } catch (e) {
    console.error("Error creating media_uploads table:", e);
  }
}
