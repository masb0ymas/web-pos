"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { FormState } from "@/actions/product";

const settingSchema = z.object({
  storeName: z.string().trim().min(1, "Nama toko wajib diisi"),
  address: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  invoiceFooter: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  taxEnabled: z.boolean(),
  taxRate: z.coerce
    .number()
    .int()
    .min(0, "Tarif PPN tidak boleh negatif")
    .max(100, "Tarif PPN maksimal 100"),
  lowStockThreshold: z.coerce
    .number()
    .int()
    .min(0, "Ambang stok tidak boleh negatif"),
});

export async function updateStoreSetting(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = settingSchema.safeParse({
    storeName: formData.get("storeName"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    invoiceFooter: formData.get("invoiceFooter"),
    taxEnabled: formData.get("taxEnabled") === "on",
    taxRate: formData.get("taxRate"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali isian pengaturan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await prisma.storeSetting.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  revalidatePath("/pengaturan");
  revalidatePath("/kasir");
  revalidatePath("/");
  return { status: "success", message: "Pengaturan tersimpan." };
}
