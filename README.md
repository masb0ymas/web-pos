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

```bash
pnpm install
cp .env.example .env        # atau buat .env berisi: DATABASE_URL="file:./dev.db"
pnpm db:migrate             # membuat prisma/dev.db + tabel
pnpm db:seed                # data contoh (kategori, 21 produk, transaksi 3 hari)
pnpm dev                    # http://localhost:3000
```

Build produksi:

```bash
pnpm build
pnpm start
```

## Script Database

| Perintah | Fungsi |
|---|---|
| `pnpm db:migrate` | Terapkan migrasi skema (membuat `prisma/dev.db`) |
| `pnpm db:seed` | Isi ulang data contoh (menghapus data lama) |
| `pnpm db:studio` | Buka Prisma Studio untuk inspeksi data |
| `pnpm db:reset` | Reset database + jalankan ulang migrasi |

## Backup

Database adalah satu file SQLite: **`prisma/dev.db`**. Untuk backup, cukup salin file tersebut (hentikan server dulu agar konsisten):

```bash
cp prisma/dev.db backup/dev-$(date +%Y%m%d).db
```

Untuk memulihkan, ganti `prisma/dev.db` dengan file backup lalu jalankan `pnpm dev`.

## Teknologi

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (radix) — tema gelap "Flat Design" dari skill ui-ux-pro-max
- Prisma 6 + SQLite
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
