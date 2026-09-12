import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Package,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStoreSetting } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const setting = await getStoreSetting();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const todayWhere = { createdAt: { gte: startOfToday, lt: endOfToday } };

  const [todayAgg, itemsAgg, lowStockProducts, recentTransactions] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: todayWhere,
        _sum: { total: true },
        _count: { _all: true },
      }),
      prisma.transactionItem.aggregate({
        where: { transaction: todayWhere },
        _sum: { quantity: true },
      }),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: setting.lowStockThreshold } },
        orderBy: { stock: "asc" },
        take: 5,
        select: { id: true, name: true, stock: true },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          createdAt: true,
          total: true,
          paymentMethod: true,
        },
      }),
    ]);

  const revenue = todayAgg._sum.total ?? 0;
  const txCount = todayAgg._count._all;
  const itemsSold = itemsAgg._sum.quantity ?? 0;

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Selamat datang di {setting.storeName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan penjualan hari ini
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/kasir">
            <ShoppingCart aria-hidden="true" /> Mulai Transaksi
          </Link>
        </Button>
      </div>

      {/* Ringkasan hari ini */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-brand/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" aria-hidden="true" /> Pendapatan Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-brand tabular-nums">
              {formatRupiah(revenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ReceiptText className="size-4" aria-hidden="true" /> Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-semibold tabular-nums">
              {txCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="size-4" aria-hidden="true" /> Item Terjual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-semibold tabular-nums">
              {itemsSold}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stok rendah */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-brand" aria-hidden="true" />
              Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Semua produk berstok aman (di atas {setting.lowStockThreshold}).
              </p>
            ) : (
              <ul className="space-y-2">
                {lowStockProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{p.name}</span>
                    <Badge variant="outline" className="text-brand">
                      sisa {p.stock}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="ghost" size="sm" asChild className="mt-3 -ml-2">
              <Link href="/produk">
                Kelola Produk <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Transaksi terakhir */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4" aria-hidden="true" />
              Transaksi Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada transaksi. Mulai dari tombol &ldquo;Mulai
                Transaksi&rdquo;.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentTransactions.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <Link
                      href={`/transaksi/${t.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {t.invoiceNumber}
                    </Link>
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {PAYMENT_METHODS[
                          t.paymentMethod as keyof typeof PAYMENT_METHODS
                        ] ?? t.paymentMethod}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatRupiah(t.total)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="ghost" size="sm" asChild className="mt-3 -ml-2">
              <Link href="/transaksi">
                Lihat Semua <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
