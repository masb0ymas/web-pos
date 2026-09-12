import { prisma } from "@/lib/prisma";
import { getStoreSetting } from "@/lib/store";
import { PosTerminal } from "@/components/pos-terminal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kasir" };

export default async function KasirPage() {
  const [products, categories, setting] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        categoryId: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getStoreSetting(),
  ]);

  return (
    <PosTerminal
      products={products}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      taxEnabledDefault={setting.taxEnabled}
      taxRate={setting.taxRate}
      lowStockThreshold={setting.lowStockThreshold}
    />
  );
}
