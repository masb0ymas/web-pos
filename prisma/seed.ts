import { prisma } from "../src/lib/prisma";

const categories = [
  "Makanan",
  "Minuman",
  "Snack",
  "Kebersihan",
  "Alat Tulis",
];

type SeedProduct = {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

const products: SeedProduct[] = [
  { sku: "MKN-001", name: "Indomie Goreng", category: "Makanan", price: 3500, stock: 120 },
  { sku: "MKN-002", name: "Indomie Kari Ayam", category: "Makanan", price: 3500, stock: 80 },
  { sku: "MKN-003", name: "Sarden Kaleng ABC 155g", category: "Makanan", price: 12500, stock: 24 },
  { sku: "MKN-004", name: "Beras Pandan Wangi 5kg", category: "Makanan", price: 72000, stock: 10 },
  { sku: "MKN-005", name: "Telur Ayam 1kg", category: "Makanan", price: 29000, stock: 15 },
  { sku: "MNM-001", name: "Aqua Botol 600ml", category: "Minuman", price: 4000, stock: 96 },
  { sku: "MNM-002", name: "Teh Pucuk Harum 350ml", category: "Minuman", price: 4000, stock: 72 },
  { sku: "MNM-003", name: "Kopi Kapal Api Special", category: "Minuman", price: 2000, stock: 150 },
  { sku: "MNM-004", name: "Susu Ultra Milk 250ml", category: "Minuman", price: 6500, stock: 48 },
  { sku: "MNM-005", name: "Coca Cola 390ml", category: "Minuman", price: 7000, stock: 36 },
  { sku: "SNK-001", name: "Chitato Sapi Panggang 68g", category: "Snack", price: 12000, stock: 40 },
  { sku: "SNK-002", name: "Oreo Original 133g", category: "Snack", price: 9500, stock: 32 },
  { sku: "SNK-003", name: "Beng-Beng", category: "Snack", price: 2500, stock: 100 },
  { sku: "SNK-004", name: "Taro Net Seaweed 75g", category: "Snack", price: 8500, stock: 4 },
  { sku: "SNK-005", name: "SilverQueen Chunky Bar 65g", category: "Snack", price: 18000, stock: 20 },
  { sku: "KBR-001", name: "Sabun Lifebuoy 110g", category: "Kebersihan", price: 5500, stock: 60 },
  { sku: "KBR-002", name: "Pepsodent 190g", category: "Kebersihan", price: 17500, stock: 30 },
  { sku: "KBR-003", name: "Rinso Anti Noda 770g", category: "Kebersihan", price: 24500, stock: 18 },
  { sku: "ATK-001", name: "Pulpen Standard AE7", category: "Alat Tulis", price: 3000, stock: 90 },
  { sku: "ATK-002", name: "Buku Tulis Sidu 38", category: "Alat Tulis", price: 4500, stock: 3 },
  { sku: "ATK-003", name: "Pensil 2B Faber Castell", category: "Alat Tulis", price: 4000, stock: 55 },
];

async function main() {
  console.log("Membersihkan data lama...");
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storeSetting.deleteMany();

  console.log("Membuat kategori...");
  const categoryMap = new Map<string, number>();
  for (const name of categories) {
    const c = await prisma.category.create({ data: { name } });
    categoryMap.set(name, c.id);
  }

  console.log("Membuat produk...");
  const createdProducts = [];
  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        price: p.price,
        stock: p.stock,
        categoryId: categoryMap.get(p.category),
      },
    });
    createdProducts.push(product);
  }

  console.log("Membuat pengaturan toko...");
  await prisma.storeSetting.create({
    data: {
      id: 1,
      storeName: "Toko Sejahtera",
      address: "Jl. Merdeka No. 123, Bandung",
      phone: "0812-3456-7890",
      invoiceFooter: "Terima kasih atas kunjungan Anda",
      taxEnabled: false,
      taxRate: 11,
      lowStockThreshold: 5,
    },
  });

  console.log("Membuat contoh transaksi 3 hari terakhir...");
  const methods = ["CASH", "QRIS", "CARD"] as const;
  for (let dayOffset = 2; dayOffset >= 0; dayOffset--) {
    const txCount = 3 + dayOffset; // hari lalu lebih sedikit
    for (let i = 0; i < txCount; i++) {
      const when = new Date();
      when.setDate(when.getDate() - dayOffset);
      when.setHours(9 + i * 2, 15 + i * 7, 0, 0);

      const picks = [createdProducts[(i * 3) % createdProducts.length], createdProducts[(i * 5 + 1) % createdProducts.length]];
      const items = picks.map((p, idx) => {
        const quantity = 1 + ((i + idx) % 3);
        return {
          productId: p.id,
          productName: p.name,
          unitPrice: p.price,
          quantity,
          lineDiscount: 0,
          lineTotal: p.price * quantity,
        };
      });
      const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
      const paymentMethod = methods[(i + dayOffset) % methods.length];
      const amountPaid = paymentMethod === "CASH" ? Math.ceil(subtotal / 10000) * 10000 : subtotal;

      await prisma.transaction.create({
        data: {
          invoiceNumber: `INV-${when.getFullYear()}${String(when.getMonth() + 1).padStart(2, "0")}${String(when.getDate()).padStart(2, "0")}-${String(i + 1).padStart(4, "0")}`,
          createdAt: when,
          subtotal,
          itemDiscountTotal: 0,
          transactionDiscount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: subtotal,
          paymentMethod,
          amountPaid,
          changeDue: amountPaid - subtotal,
          items: { create: items },
        },
      });
    }
  }

  console.log("Seed selesai ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
