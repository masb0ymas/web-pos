import Link from "next/link";
import { PackageOpen, PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStoreSetting } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductFilters } from "@/components/product-filters";
import { CategoryManager } from "@/components/category-manager";
import { ProductRowActions } from "@/components/product-row-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produk" };

type SearchParams = { q?: string; kategori?: string };

export default async function ProdukPage(props: PageProps<"/produk">) {
  const { q, kategori } = (await props.searchParams) as SearchParams;
  const setting = await getStoreSetting();

  const where = {
    AND: [
      q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {},
      kategori ? { categoryId: Number(kategori) } : {},
    ],
  };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        _count: { select: { transactionItems: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Produk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} produk · stok rendah di bawah {setting.lowStockThreshold}
          </p>
        </div>
        <div className="flex gap-2">
          <CategoryManager
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              productCount: c._count.products,
            }))}
          />
          <Button asChild>
            <Link href="/produk/baru">
              <PlusCircle aria-hidden="true" /> Produk Baru
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <ProductFilters categories={categories} />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <PackageOpen className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">
            {q || kategori
              ? "Tidak ada produk yang cocok dengan filter."
              : "Belum ada produk. Tambahkan produk pertama Anda."}
          </p>
          {!q && !kategori && (
            <Button asChild>
              <Link href="/produk/baru">Tambah Produk</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const low = p.stock <= setting.lowStockThreshold;
                return (
                  <TableRow key={p.id} className={p.isActive ? "" : "opacity-60"}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.sku ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.category?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRupiah(p.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={low ? "font-semibold text-brand" : ""}>
                        {p.stock}
                      </span>
                      {low && (
                        <span className="sr-only">
                          {" "}
                          (stok rendah, batas {setting.lowStockThreshold})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.isActive ? (
                        <Badge variant="secondary">Aktif</Badge>
                      ) : (
                        <Badge variant="outline">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <ProductRowActions
                        product={{
                          id: p.id,
                          name: p.name,
                          isActive: p.isActive,
                          hasTransactions: p._count.transactionItems > 0,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
