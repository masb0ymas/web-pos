import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/product-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Edit Produk" };

export default async function EditProdukPage(
  props: PageProps<"/produk/[id]">
) {
  const { id } = await props.params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/produk">
            <ArrowLeft aria-hidden="true" /> Kembali
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-semibold">
          Edit: {product.name}
        </h1>
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
