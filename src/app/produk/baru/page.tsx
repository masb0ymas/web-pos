import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/product-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Produk Baru" };

export default async function ProdukBaruPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/produk">
            <ArrowLeft aria-hidden="true" /> Kembali
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-semibold">Produk Baru</h1>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
