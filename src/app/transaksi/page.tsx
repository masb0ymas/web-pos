import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionFilters } from "@/components/transaction-filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "Riwayat Transaksi" };

type SearchParams = { invoice?: string; dari?: string; sampai?: string; metode?: string };

export default async function TransaksiPage(props: PageProps<"/transaksi">) {
  const { invoice, dari, sampai, metode } = (await props.searchParams) as SearchParams;

  const where = {
    AND: [
      invoice ? { invoiceNumber: { contains: invoice } } : {},
      dari ? { createdAt: { gte: new Date(`${dari}T00:00:00`) } } : {},
      sampai ? { createdAt: { lt: new Date(`${sampai}T23:59:59.999`) } } : {},
      metode ? { paymentMethod: metode } : {},
    ],
  };

  const transactions = await prisma.transaction.findMany({
    where,
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold">
          Riwayat Transaksi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Menampilkan {transactions.length} transaksi terbaru
        </p>
      </div>

      <div className="mb-4">
        <TransactionFilters />
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <ReceiptText className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">
            Tidak ada transaksi pada filter ini.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Invoice</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead className="text-right">Item</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => {
                const method =
                  PAYMENT_METHODS[t.paymentMethod as keyof typeof PAYMENT_METHODS] ??
                  t.paymentMethod;
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link
                        href={`/transaksi/${t.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {t.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTanggal(t.createdAt)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t._count.items}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{method}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatRupiah(t.total)}
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
