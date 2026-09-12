# My POS

Aplikasi kasir (Point of Sale) berbasis web untuk satu toko: kelola produk, transaksi kasir, invoice/struk, dan laporan penjualan. Berjalan tanpa login (single user) dengan database SQLite lokal.

Dokumen kebutuhan lengkap ada di [docs/PRD.md](docs/PRD.md). Panduan desain (hasil skill `ui-ux-pro-max`) ada di [design-system/my-pos/MASTER.md](design-system/my-pos/MASTER.md).

## Fitur

- **Dashboard** — ringkasan hari ini (pendapatan, transaksi, item terjual), stok rendah, transaksi terakhir
- **Produk** — CRUD produk & kategori, pencarian/filter, aktif/nonaktif, penjagaan hapus untuk produk beriwayat transaksi
- **Kasir** — grid produk, keranjang, diskon per item & per transaksi (Rp/%), PPN opsional, pembayaran Tunai (dengan kembalian) / QRIS / Kartu
- **Invoice** — nomor otomatis `INV-YYYYMMDD-XXXX`, cetak A4 dan struk thermal 80mm
- **Riwayat** — filter rentang tanggal, metode bayar, dan nomor invoice
- **Laporan** — periode hari ini/minggu/bulan/kustom, ringkasan, rincian per metode bayar, ekspor CSV
- **Pengaturan** — identitas toko, footer invoice, default PPN, ambang stok rendah

## Menjalankan

Prasyarat: Node.js 20.9+, pnpm 10+.

Aplikasi berjalan di atas **Turso** (libSQL, SQLite terkelola di cloud) — atau SQLite file lokal untuk pengembangan. Pemilihan database otomatis dari `DATABASE_URL`: `libsql://…` memakai driver adapter Turso, `file:…` memakai file lokal.

```bash
pnpm install
cp .env.example .env
# isi DATABASE_URL (libsql://… dari dashboard Turso) dan TURSO_AUTH_TOKEN
pnpm db:push-turso          # membuat tabel di database Turso
pnpm db:seed                # data contoh (kategori, 21 produk, transaksi 3 hari)
pnpm dev                    # http://localhost:3000
```

> Token Turso dibuat dengan `turso db tokens create <nama-database>`. Simpan hanya di `.env` (sudah gitignored) — jangan pernah di-commit.

Build produksi:

```bash
pnpm build
pnpm start
```

### Mode lokal (tanpa Turso)

Untuk mengembangkan tanpa koneksi cloud, set `DATABASE_URL="file:./dev.db"` di `.env`, lalu:

```bash
pnpm db:migrate             # membuat prisma/dev.db + tabel dari migrasi
pnpm db:seed
pnpm dev
```

## Script Database

| Perintah | Fungsi |
|---|---|
| `pnpm db:push-turso` | Terapkan skema ke Turso (DDL dari `schema.prisma`, aman diulang; `-- --force` untuk menerapkan ulang) |
| `pnpm db:seed` | Isi ulang data contoh (menghapus data lama) |
| `pnpm db:migrate` | Buat/terapkan migrasi — **hanya untuk mode file lokal** (Prisma Migrate tidak mendukung `libsql://`) |
| `pnpm db:studio` | Buka Prisma Studio (mode file lokal) |
| `pnpm db:reset` | Reset database lokal + migrasi ulang |

**Alur skema ke Turso:** ubah `prisma/schema.prisma` → `pnpm db:migrate` (lokal, untuk mencatat riwayat migrasi) → `pnpm db:push-turso` (terapkan ke Turso).

## Backup

Backup dilakukan di sisi Turso, bukan file lokal:

- **Dashboard Turso** — menu database → *Backups* (Turso menyimpan backup otomatis).
- **Ekspor manual** via Turso CLI: `turso db shell <nama-database> .dump > backup.sql`.

Untuk mode file lokal, backup cukup dengan menyalin `prisma/dev.db`.

## Teknologi

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (radix) — tema gelap "Flat Design" dari skill ui-ux-pro-max
- Prisma 6 + Turso (libSQL) via `@prisma/adapter-libsql`
- Server Actions + zod untuk semua mutasi data
- Font: Rubik (judul) + Nunito Sans (isi), dimuat via Google Fonts

## Struktur

```
src/
├── actions/        # Server Actions (produk, transaksi, pengaturan)
├── app/            # Halaman App Router
├── components/     # Komponen UI (pos-terminal, form, tabel, dll.)
└── lib/            # prisma, format, invoice, report, store
prisma/
├── schema.prisma   # Skema database
├── migrations/     # Riwayat migrasi
└── seed.ts         # Data contoh
```
