# PRD — Aplikasi POS "My-POS"

| | |
|---|---|
| **Status** | Draft v1.0 |
| **Tanggal** | 12 September 2026 |
| **Versi** | 1.0 (rilis awal) |
| **Platform** | Web application (desktop/tablet-first) |

---

## 1. Ringkasan Produk

My-POS adalah aplikasi Point of Sale berbasis web untuk **satu toko** yang digunakan oleh **satu pengguna tanpa login**. Aplikasi membantu pemilik toko mencatat penjualan harian secara cepat, mengelola produk dan stok, mencetak invoice/struk untuk pelanggan, serta memantau total pendapatan pada periode tertentu.

- **Bahasa antarmuka:** Indonesia
- **Mata uang:** Rupiah (IDR)
- **Pengguna target:** Pemilik kasir tunggal (UMKM / toko ritel kecil)
- **Nilai utama:** alur kasir yang cepat (pilih produk → bayar → cetak struk), data transaksi tersimpan rapi dan dapat ditelusuri kembali

## 2. Ruang Lingkup

### 2.1 In Scope (v1.0)

1. Dashboard ringkasan hari ini
2. Manajemen produk & kategori (CRUD)
3. Layar kasir (transaksi penjualan) dengan 3 metode pembayaran
4. Invoice bernomor otomatis dengan tampilan cetak
5. Riwayat transaksi dengan filter
6. Laporan penjualan dasar per periode
7. Pengaturan toko (identitas pada invoice/struk)

### 2.2 Out of Scope (tidak dikerjakan di v1.0)

| Fitur | Alasan | Kandidat |
|---|---|---|
| Login & peran pengguna | Keputusan requirement: single user | v2 |
| Multi-outlet / multi-cabang | Di luar kebutuhan satu toko | v2 |
| Manajemen pembelian & supplier | Fokus v1 adalah penjualan | v2 |
| Grafik laporan | Keputusan requirement: laporan dasar | v2 |
| Refund / pembatalan (void) transaksi | Menambah kompleksitas alur | v2 |
| Dukungan offline (PWA) | Kompleksitas tinggi | v3 |
| Harga modal & laporan laba | Disiapkan di skema data, UI menyusul | v2 |
| Manajemen pelanggan (CRM) | Tidak dibutuhkan | v3 |

## 3. Tech Stack

| Lapisan | Teknologi | Catatan |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | Server Components untuk halaman data, Server Actions untuk mutasi |
| Bahasa | TypeScript (strict) | |
| Styling | Tailwind CSS v4 | Konfigurasi CSS-first via `globals.css` |
| Komponen UI | shadcn/ui + lucide-react | Konsisten, cepat dikembangkan |
| Database | Turso (libSQL, SQLite terkelola) via `@prisma/adapter-libsql`; mode file lokal `prisma/dev.db` untuk pengembangan | Terkelola, dapat diakses dari mana saja; pemilihan otomatis dari `DATABASE_URL` |
| ORM | Prisma | Migrasi & Prisma Studio untuk inspeksi data |
| Format angka/tanggal | `Intl` dengan locale `id-ID` | Rupiah tanpa desimal, tanggal `dd MMMM yyyy` |

> **Catatan implementasi:** Next.js 16 memiliki perubahan API dibanding versi sebelumnya (konvensi `proxy` menggantikan `middleware`, model caching `use cache`, typed route props). Sebelum menulis kode, baca panduan di `node_modules/next/dist/docs/01-app/`.

## 4. Kebutuhan Fungsional

Nomor FR digunakan sebagai acuan penguji (acceptance test).

### 4.1 Dashboard (`/`)

| ID | Kebutuhan |
|---|---|
| FR-1.1 | Menampilkan ringkasan hari ini: total pendapatan, jumlah transaksi, jumlah item terjual |
| FR-1.2 | Menampilkan daftar maks. 5 produk dengan stok paling rendah (ambang dari pengaturan) |
| FR-1.3 | Tombol pintasan "Mulai Transaksi" menuju `/kasir` |
| FR-1.4 | Menampilkan 5 transaksi terakhir |

### 4.2 Manajemen Produk (`/produk`)

| ID | Kebutuhan |
|---|---|
| FR-2.1 | Daftar produk dalam tabel: nama, SKU, kategori, harga jual, stok, status aktif |
| FR-2.2 | Pencarian nama/SKU dan filter berdasarkan kategori |
| FR-2.3 | Tambah produk: nama (wajib), SKU (opsional, unik), kategori (opsional), harga jual (wajib, > 0), harga modal (opsional), stok awal (wajib, ≥ 0) |
| FR-2.4 | Edit produk; perubahan stok melalui edit langsung menetapkan nilai stok baru |
| FR-2.5 | Nonaktifkan produk: produk tidak lagi tampil di layar kasir, tetap tampil di daftar produk (dengan penanda) dan tetap terhubung ke riwayat transaksi |
| FR-2.6 | Hapus permanen hanya diizinkan untuk produk **tanpa** riwayat transaksi; jika sudah ada riwayat, tawarkan nonaktifkan |
| FR-2.7 | CRUD kategori (nama unik) dari halaman produk |
| FR-2.8 | Indikator visual stok rendah (stok ≤ ambang pengaturan) |

### 4.3 Kasir / Transaksi (`/kasir`)

| ID | Kebutuhan |
|---|---|
| FR-3.1 | Grid kartu produk aktif (nama + harga), dapat dicari cepat dan difilter kategori |
| FR-3.2 | Klik kartu produk menambah produk ke keranjang; klik berulang menambah qty |
| FR-3.3 | Keranjang: ubah qty, hapus item; qty melebihi stok diblokir dengan pesan |
| FR-3.4 | Diskon per item: nominal rupiah per baris keranjang |
| FR-3.5 | Diskon transaksi: nominal rupiah atau persen (%), diterapkan setelah subtotal item |
| FR-3.6 | PPN 11% dapat diaktifkan/nonaktifkan per transaksi (default dari pengaturan) |
| FR-3.7 | Metode pembayaran: **Tunai** (input nominal diterima → tampilkan kembalian), **QRIS**, **Kartu** |
| FR-3.8 | Tombol "Bayar": validasi (keranjang tidak kosong, tunai ≥ total), simpan transaksi, kurangi stok secara atomik, arahkan ke halaman invoice |
| FR-3.9 | Setelah simpan, keranjang dikosongkan dan siap untuk transaksi berikutnya |
| FR-3.10 | Tampilkan rincian hitung real-time: subtotal, total diskon, PPN, total bayar |

### 4.4 Invoice (`/transaksi/[id]`)

| ID | Kebutuhan |
|---|---|
| FR-4.1 | Nomor invoice otomatis format `INV-YYYYMMDD-XXXX` (urutan harian, 4 digit, unik) |
| FR-4.2 | Menampilkan header toko (nama, alamat, telepon) dari pengaturan |
| FR-4.3 | Rincian: daftar item (nama snapshot, qty, harga satuan snapshot, diskon, per baris), subtotal, diskon transaksi, PPN, total, metode bayar, nominal bayar & kembalian, waktu transaksi |
| FR-4.4 | Tombol **Cetak** dengan dua mode tampilan cetak: struk thermal (58/80 mm) dan A4 — diimplementasikan via print CSS `@media print`, tanpa library PDF |
| FR-4.5 | Footer struk dapat dikustomisasi dari pengaturan (mis. "Terima kasih atas kunjungan Anda") |

### 4.5 Riwayat Transaksi (`/transaksi`)

| ID | Kebutuhan |
|---|---|
| FR-5.1 | Daftar transaksi terbaru: nomor invoice, waktu, jumlah item, total, metode bayar |
| FR-5.2 | Filter rentang tanggal dan metode pembayaran; pencarian nomor invoice |
| FR-5.3 | Klik baris membuka detail invoice (FR-4.x) |

### 4.6 Laporan (`/laporan`)

| ID | Kebutuhan |
|---|---|
| FR-6.1 | Pemilih periode: Hari ini / Minggu ini / Bulan ini / Rentang kustom |
| FR-6.2 | Ringkasan: total pendapatan, jumlah transaksi, jumlah item terjual, rata-rata nilai transaksi |
| FR-6.3 | Rincian daftar transaksi pada periode (nomor, waktu, total, metode) |
| FR-6.4 | (Opsional/bonus) Tombol ekspor CSV dari daftar rincian |

### 4.7 Pengaturan (`/pengaturan`)

| ID | Kebutuhan |
|---|---|
| FR-7.1 | Nama toko, alamat, telepon (tampil di invoice/struk) |
| FR-7.2 | Footer invoice/struk kustom |
| FR-7.3 | Default PPN aktif/nonaktif & tarif (default 11%) |
| FR-7.4 | Ambang stok rendah (default 5) |

## 5. Model Data

Semua nominal uang disimpan sebagai **integer rupiah penuh** (tanpa sen) untuk menghindari kesalahan floating-point.

### 5.1 Entity-Relationship

```
Category 1 ──── * Product
Product  1 ──── * TransactionItem * ──── 1 Transaction
StoreSetting (tunggal)
```

### 5.2 Skema

**Category**

| Field | Tipe | Keterangan |
|---|---|---|
| id | Int PK | autoincrement |
| name | String | unik, wajib |
| createdAt | DateTime | |

**Product**

| Field | Tipe | Keterangan |
|---|---|---|
| id | Int PK | autoincrement |
| sku | String? | unik bila diisi |
| name | String | wajib |
| categoryId | Int? FK → Category | opsional |
| price | Int | harga jual, wajib > 0 |
| cost | Int? | harga modal, opsional (disiapkan untuk laporan laba v2) |
| stock | Int | default 0 |
| isActive | Boolean | default `true` |
| createdAt / updatedAt | DateTime | |

**Transaction**

| Field | Tipe | Keterangan |
|---|---|---|
| id | Int PK | autoincrement |
| invoiceNumber | String | unik, `INV-YYYYMMDD-XXXX` |
| createdAt | DateTime | waktu transaksi (timezone lokal server) |
| subtotal | Int | Σ total baris sebelum diskon transaksi & PPN |
| itemDiscountTotal | Int | Σ diskon level item |
| transactionDiscount | Int | diskon level transaksi (nominal akhir) |
| taxRate | Int | tarif PPN saat transaksi (mis. 11), 0 bila nonaktif |
| taxAmount | Int | PPN dibulatkan ke rupiah terdekat |
| total | Int | `subtotal − transactionDiscount + taxAmount` |
| paymentMethod | Enum | `CASH` / `QRIS` / `CARD` |
| amountPaid | Int | nominal diterima (QRIS/CARD = total) |
| changeDue | Int | kembalian (`amountPaid − total`) |
| note | String? | catatan kasir, opsional |

**TransactionItem**

| Field | Tipe | Keterangan |
|---|---|---|
| id | Int PK | autoincrement |
| transactionId | Int FK → Transaction | cascade delete |
| productId | Int? FK → Product | `SetNull` bila produk dihapus |
| productName | String | snapshot nama saat transaksi |
| unitPrice | Int | snapshot harga jual saat transaksi |
| quantity | Int | |
| lineDiscount | Int | diskon nominal untuk baris ini |
| lineTotal | Int | `unitPrice × quantity − lineDiscount` |

**StoreSetting** (satu baris)

| Field | Tipe | Default |
|---|---|---|
| id | Int PK | 1 |
| storeName | String | "My Store" |
| address | String? | — |
| phone | String? | — |
| invoiceFooter | String? | "Terima kasih atas kunjungan Anda" |
| taxEnabled | Boolean | `false` |
| taxRate | Int | 11 |
| lowStockThreshold | Int | 5 |
| updatedAt | DateTime | |

## 6. Struktur Route & Komponen

```
src/
├── app/
│   ├── layout.tsx                # Root layout + navigasi sidebar atas
│   ├── page.tsx                  # Dashboard
│   ├── produk/
│   │   ├── page.tsx              # Daftar produk + dialog kategori
│   │   ├── baru/page.tsx         # Form produk baru
│   │   └── [id]/page.tsx         # Form edit produk
│   ├── kasir/page.tsx            # Layar kasir (client component)
│   ├── transaksi/
│   │   ├── page.tsx              # Riwayat transaksi
│   │   └── [id]/page.tsx         # Detail + invoice cetak
│   ├── laporan/page.tsx          # Laporan periode
│   └── pengaturan/page.tsx       # Pengaturan toko
├── components/                   # UI bersama (tabel, kartu produk, dsb.)
├── actions/                      # Server Actions (produk, transaksi, pengaturan)
├── lib/
│   ├── prisma.ts                 # Singleton PrismaClient
│   ├── format.ts                 # formatRupiah(), formatTanggal()
│   └── invoice.ts                # generateNomorInvoice()
└── prisma/
    └── schema.prisma
```

## 7. Alur Utama & Aturan Bisnis

### 7.1 Alur Transaksi Kasir

1. Pengguna membuka `/kasir` (keranjang dimulai kosong setiap kali halaman dibuka).
2. Produk ditambahkan ke keranjang via klik kartu / hasil pencarian.
3. (Opsional) diskon per baris, diskon transaksi, toggle PPN.
4. Pilih metode pembayaran:
   - **Tunai** → input nominal diterima → sistem menampilkan kembalian (validasi: bayar ≥ total).
   - **QRIS / Kartu** → nominal dianggap setara total.
5. Klik **Bayar** → Server Action menyimpan dalam **satu transaction database**:
   - validasi ulang stok di server (race condition),
   - generate nomor invoice urut harian,
   - insert `Transaction` + semua `TransactionItem`,
   - kurangi stok setiap produk.
6. Berhasil → redirect ke `/transaksi/[id]` → pengguna dapat mencetak struk → tombol "Transaksi Baru" kembali ke `/kasir`.

### 7.2 Aturan Perhitungan

```
subtotal           = Σ (unitPrice × qty − lineDiscount)   untuk semua baris
transactionDiscount= min(nominal, subtotal)  bila mode rupiah
                    | round(subtotal × persen / 100)       bila mode persen
taxAmount          = round((subtotal − transactionDiscount) × taxRate / 100)  bila PPN aktif
total              = subtotal − transactionDiscount + taxAmount
changeDue          = amountPaid − total                     (hanya CASH)
```

### 7.3 Aturan Bisnis Lain

| Aturan | Perilaku |
|---|---|
| Stok tidak cukup saat server memvalidasi | Transaksi ditolak dengan pesan jelas; stok **tidak** berubah sebagian (atomic) |
| Bayar tunai kurang dari total | Tombol Bayar dinonaktifkan + pesan validasi |
| Nomor invoice per hari reset | `INV-20260912-0001`, `INV-20260913-0001` |
| Produk dinonaktifkan | Tidak muncul di kasir; riwayat tetap utuh (snapshot) |
| Produk dihapus (tanpa riwayat) | Hard delete; dengan riwayat → `productId` menjadi null, item memakai snapshot |
| Nominal uang | Selalu integer ≥ 0; input form memakai angka bulat rupiah |

## 8. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| Responsif | Optimal di desktop/tablet (≥ 768 px); kasir dapat dipakai di layar sentuh (target kartu ≥ 44 px) |
| Performa | Keranjang & kalkulasi berjalan di client (tanpa round-trip per perubahan); grid produk luar halaman memakai pencarian server-side |
| Format | Rupiah `Rp 150.000` (locale `id-ID`, tanpa desimal); tanggal `12 September 2026, 14.30` |
| Keamanan data | Validasi Server Action dengan zod; semua mutasi divalidasi ulang di server |
| Backup | Turso menyimpan backup otomatis (dashboard → *Backups*); ekspor manual via `turso db shell <db> .dump`. Mode file lokal: salin `prisma/dev.db`. Prosedur ada di README |
| State kosong | Setiap daftar (produk, transaksi, laporan) punya empty state dengan aksi jelas |
| Error | Kegagalan Server Action menampilkan pesan yang dapat dipahami, data form tidak hilang |
| Build | `pnpm build` lolos tanpa error TypeScript/ESLint |

## 9. Milestone

| Milestone | Isi | Kriteria Selesai |
|---|---|---|
| **M0 — Fondasi** | Prisma + SQLite, shadcn/ui, layout & navigasi, helper format, seed data contoh (± 20 produk, 5 kategori, beberapa transaksi contoh) | Navigasi antar halaman kosong berfungsi; `pnpm build` lolos |
| **M1 — Produk** | FR-2.1 s.d. FR-2.8 | CRUD produk & kategori utuh dengan validasi |
| **M2 — Kasir & Invoice** | FR-3.1 s.d. FR-4.5 | Transaksi end-to-end: pilih → bayar → invoice tercetak; stok berkurang benar |
| **M3 — Data & Laporan** | FR-1.x, FR-5.x, FR-6.x, FR-7.x | Dashboard, riwayat, laporan periode, pengaturan berfungsi |
| **M4 — Polish & Uji** | Uji end-to-end manual (browser), perbaikan UI, README (cara jalankan + backup) | Seluruh FR terpenuhi; build bersih |

## 10. Kriteria Sukses Rilis v1.0

1. Kasir dapat menyelesaikan transaksi tunai (dengan kembalian), QRIS, dan kartu dalam **≤ 30 detik** untuk 5 item.
2. Struk tercetak rapi pada mode thermal dan A4.
3. Stok selalu konsisten dengan transaksi yang tersimpan (tidak ada selisih).
4. Laporan periode menampilkan angka yang dapat direkonsiliasi dengan penjumlahan manual riwayat transaksi.
5. Aplikasi berjalan dengan `pnpm dev` dan `pnpm build && pnpm start` tanpa konfigurasi tambahan.
