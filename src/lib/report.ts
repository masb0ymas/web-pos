import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";

type ReportSummary = {
  totalRevenue: number;
  transactionCount: number;
  itemsSold: number;
  avgTransaction: number;
};

export type ReportPeriod = { from: Date; to: Date };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function resolvePeriod(
  period: string,
  fromStr?: string,
  toStr?: string
): ReportPeriod {
  const now = new Date();
  switch (period) {
    case "minggu": {
      const day = now.getDay(); // 0=Minggu; mulai Senin
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      return { from: startOfDay(monday), to: endOfDay(now) };
    }
    case "bulan":
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: endOfDay(now),
      };
    case "custom": {
      const from = fromStr ? new Date(`${fromStr}T00:00:00`) : new Date(now.getFullYear(), 0, 1);
      const to = toStr ? new Date(`${toStr}T23:59:59.999`) : endOfDay(now);
      return { from: startOfDay(from), to };
    }
    case "hari":
    default:
      return { from: startOfDay(now), to: endOfDay(now) };
  }
}

export async function getReport(period: ReportPeriod): Promise<{
  summary: ReportSummary;
  transactions: Awaited<ReturnType<typeof fetchTransactions>>;
  byMethod: { method: string; count: number; total: number }[];
}> {
  const where = { createdAt: { gte: period.from, lte: period.to } };
  const [summary, transactions, byMethodRaw] = await Promise.all([
    fetchSummary(where),
    fetchTransactions(where),
    prisma.transaction.groupBy({
      by: ["paymentMethod"],
      where,
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  const byMethod = byMethodRaw.map((g) => ({
    method: g.paymentMethod,
    count: g._count._all,
    total: g._sum.total ?? 0,
  }));

  return { summary, transactions, byMethod };
}

type Where = { createdAt: { gte: Date; lte: Date } };

async function fetchSummary(where: Where): Promise<ReportSummary> {
  const [agg, itemsAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where,
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.transactionItem.aggregate({
      where: { transaction: where },
      _sum: { quantity: true },
    }),
  ]);
  const count = agg._count._all;
  const totalRevenue = agg._sum.total ?? 0;
  return {
    totalRevenue,
    transactionCount: count,
    itemsSold: itemsAgg._sum.quantity ?? 0,
    avgTransaction: count > 0 ? Math.round(totalRevenue / count) : 0,
  };
}

async function fetchTransactions(where: Where) {
  return prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      invoiceNumber: true,
      createdAt: true,
      total: true,
      paymentMethod: true,
    },
  });
}

export function summaryRows(s: ReportSummary): { label: string; value: string }[] {
  return [
    { label: "Total Pendapatan", value: formatRupiah(s.totalRevenue) },
    { label: "Jumlah Transaksi", value: String(s.transactionCount) },
    { label: "Item Terjual", value: String(s.itemsSold) },
    { label: "Rata-rata per Transaksi", value: formatRupiah(s.avgTransaction) },
  ];
}
