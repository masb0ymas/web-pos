import { prisma } from "@/lib/prisma";

/**
 * Mengembalikan baris pengaturan toko (id=1), membuat baris default
 * bila belum ada. Untuk dipakai di Server Component / Server Action.
 */
export async function getStoreSetting() {
  const existing = await prisma.storeSetting.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.storeSetting.create({ data: { id: 1 } });
}
