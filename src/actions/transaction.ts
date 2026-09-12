"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateNomorInvoice } from "@/lib/invoice";
import { getStoreSetting } from "@/lib/store";

export type CheckoutState = {
  status: "idle" | "error" | "success";
  message?: string;
  transactionId?: number;
};

const itemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  lineDiscount: z.number().int().nonnegative(),
});

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1, "Keranjang masih kosong"),
  transactionDiscount: z.number().int().nonnegative().default(0),
  discountMode: z.enum(["amount", "percent"]),
  taxEnabled: z.boolean(),
  paymentMethod: z.enum(["CASH", "QRIS", "CARD"]),
  amountPaid: z.number().int().nonnegative().default(0),
  note: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

/**
 * Menyimpan transaksi secara atomik: validasi ulang stok & harga dari DB,
 * generate nomor invoice harian, insert transaksi + item, kurangi stok.
 */
export async function checkout(
  _prev: CheckoutState,
  payloadJson: string
): Promise<CheckoutState> {
  let raw: unknown;
  try {
    raw = JSON.parse(payloadJson);
  } catch {
    return { status: "error", message: "Data keranjang tidak valid." };
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const first = z.flattenError(parsed.error).fieldErrors;
    const firstMsg =
      Object.values(first).flat()[0] ?? "Data transaksi tidak valid.";
    return { status: "error", message: firstMsg };
  }
  const input = parsed.data;

  const setting = await getStoreSetting();

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      // Ambil harga & stok terkini dari DB (sumber kebenaran).
      const productIds = input.items.map((i) => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const byId = new Map(dbProducts.map((p) => [p.id, p]));

      const lines = [];
      for (const item of input.items) {
        const product = byId.get(item.productId);
        if (!product) {
          throw new Error(
            `Produk dengan id ${item.productId} tidak ditemukan. Muat ulang halaman kasir.`
          );
        }
        if (item.quantity > product.stock) {
          throw new Error(
            `Stok "${product.name}" tidak cukup (tersisa ${product.stock}).`
          );
        }
        const lineTotal = product.price * item.quantity - item.lineDiscount;
        if (lineTotal < 0) {
          throw new Error(`Diskon baris "${product.name}" melebihi harganya.`);
        }
        lines.push({
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: item.quantity,
          lineDiscount: item.lineDiscount,
          lineTotal,
          stock: product.stock,
        });
      }

      const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

      let transactionDiscount: number;
      if (input.discountMode === "percent") {
        transactionDiscount = Math.round(
          (subtotal * Math.min(input.transactionDiscount, 100)) / 100
        );
      } else {
        transactionDiscount = Math.min(input.transactionDiscount, subtotal);
      }

      const taxRate = input.taxEnabled ? setting.taxRate : 0;
      const taxAmount = input.taxEnabled
        ? Math.round(((subtotal - transactionDiscount) * taxRate) / 100)
        : 0;
      const total = subtotal - transactionDiscount + taxAmount;

      let amountPaid = input.amountPaid;
      let changeDue = 0;
      if (input.paymentMethod === "CASH") {
        if (amountPaid < total) {
          throw new Error("Nominal bayar tunai kurang dari total.");
        }
        changeDue = amountPaid - total;
      } else {
        amountPaid = total;
      }

      const now = new Date();
      const invoiceNumber = await generateNomorInvoice(tx, now);

      const created = await tx.transaction.create({
        data: {
          invoiceNumber,
          createdAt: now,
          subtotal,
          itemDiscountTotal: lines.reduce((s, l) => s + l.lineDiscount, 0),
          transactionDiscount,
          taxRate,
          taxAmount,
          total,
          paymentMethod: input.paymentMethod,
          amountPaid,
          changeDue,
          note: input.note,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              productName: l.productName,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              lineDiscount: l.lineDiscount,
              lineTotal: l.lineTotal,
            })),
          },
        },
      });

      for (const line of lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
      }

      return created;
    });

    return { status: "success", transactionId: transaction.id };
  } catch (e) {
    return {
      status: "error",
      message:
        e instanceof Error ? e.message : "Terjadi kesalahan saat menyimpan transaksi.",
    };
  }
}
