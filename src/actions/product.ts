"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const idleState: FormState = { status: "idle" };

const productSchema = z.object({
  name: z.string().trim().min(1, "Nama produk wajib diisi"),
  sku: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || Number.isInteger(v), {
      message: "Kategori tidak valid",
    }),
  price: z.coerce
    .number()
    .int("Harga harus bilangan bulat")
    .positive("Harga jual harus lebih dari 0"),
  cost: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().int("Harga modal harus bilangan bulat").nonnegative().optional()
  ),
  stock: z.coerce
    .number()
    .int("Stok harus bilangan bulat")
    .nonnegative("Stok tidak boleh negatif"),
});

function parseProduct(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    cost: formData.get("cost"),
    stock: formData.get("stock"),
  });
}

export async function createProduct(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseProduct(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali isian form.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await prisma.product.create({ data: parsed.data });
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return {
        status: "error",
        message: "SKU sudah digunakan produk lain.",
        fieldErrors: { sku: ["SKU sudah digunakan produk lain."] },
      };
    }
    return { status: "error", message: "Gagal menyimpan produk." };
  }

  revalidatePath("/produk");
  revalidatePath("/kasir");
  return { status: "success", message: `Produk "${parsed.data.name}" ditambahkan.` };
}

export async function updateProduct(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseProduct(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali isian form.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { status: "error", message: "Produk tidak ditemukan." };

  try {
    await prisma.product.update({ where: { id }, data: parsed.data });
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return {
        status: "error",
        message: "SKU sudah digunakan produk lain.",
        fieldErrors: { sku: ["SKU sudah digunakan produk lain."] },
      };
    }
    return { status: "error", message: "Gagal menyimpan perubahan." };
  }

  revalidatePath("/produk");
  revalidatePath("/kasir");
  return { status: "success", message: "Perubahan tersimpan." };
}

export async function setProductActive(id: number, isActive: boolean) {
  await prisma.product.update({ where: { id }, data: { isActive } });
  revalidatePath("/produk");
  revalidatePath("/kasir");
}

export async function deleteProduct(id: number): Promise<FormState> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { transactionItems: true } } },
  });
  if (!product) return { status: "error", message: "Produk tidak ditemukan." };

  if (product._count.transactionItems > 0) {
    return {
      status: "error",
      message:
        "Produk sudah memiliki riwayat transaksi dan tidak dapat dihapus. Nonaktifkan saja.",
    };
  }

  await prisma.product.delete({ where: { id } });
  revalidatePath("/produk");
  revalidatePath("/kasir");
  return { status: "success", message: `Produk "${product.name}" dihapus.` };
}

/* ---------- Kategori ---------- */

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi"),
});

export async function createCategory(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      status: "error",
      message: z.flattenError(parsed.error).fieldErrors.name?.[0],
    };
  }

  try {
    await prisma.category.create({ data: parsed.data });
  } catch {
    return { status: "error", message: "Kategori dengan nama itu sudah ada." };
  }

  revalidatePath("/produk");
  return { status: "success", message: `Kategori "${parsed.data.name}" ditambahkan.` };
}

export async function deleteCategory(id: number): Promise<FormState> {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return {
      status: "error",
      message: `Kategori masih dipakai ${count} produk. Pindahkan produknya dulu.`,
    };
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/produk");
  return { status: "success", message: "Kategori dihapus." };
}
