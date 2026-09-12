import { Prisma } from "@prisma/client";

/**
 * Nomor invoice format INV-YYYYMMDD-XXXX, urut harian.
 * Harus dipanggil di dalam transaksi database Prisma agar urutan aman.
 */
export async function generateNomorInvoice(
  tx: Prisma.TransactionClient,
  date: Date
): Promise<string> {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const prefix = `INV-${y}${m}${d}-`;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const countToday = await tx.transaction.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } },
  });

  const seq = String(countToday + 1).padStart(4, "0");
  return `${prefix}${seq}`;
}
