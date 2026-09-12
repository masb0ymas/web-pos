import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

/**
 * Menerapkan skema Prisma ke database Turso.
 *
 * Prisma Migrate tidak mendukung URL libsql://, jadi DDL digenerate dari
 * schema.prisma (prisma migrate diff) lalu dieksekusi langsung via libSQL.
 *
 * Jalankan: pnpm db:push-turso [--force]
 */
async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const force = process.argv.includes("--force");

  if (!url || !url.startsWith("libsql://")) {
    throw new Error('DATABASE_URL harus berupa URL libsql:// Turso.');
  }
  if (!authToken) {
    throw new Error("TURSO_AUTH_TOKEN belum diisi di .env");
  }

  const client = createClient({ url, authToken });

  const existing = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='Product'"
  );
  if (existing.rows.length > 0 && !force) {
    console.log("Skema sudah ada di Turso. Gunakan --force untuk menerapkan ulang.");
    return;
  }

  console.log("Menggenerate DDL dari prisma/schema.prisma…");
  const ddl = execSync(
    "pnpm exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
    { encoding: "utf8" }
  );

  console.log("Menerapkan skema ke Turso…");
  await client.executeMultiple(ddl);
  console.log("Skema berhasil diterapkan ke Turso ✔");
}

main().catch((e) => {
  console.error("GAGAL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
