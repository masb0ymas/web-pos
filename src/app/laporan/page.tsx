import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import { resolvePeriod, getReport } from "@/lib/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PeriodPicker } from "@/components/period-picker";
import { ExportCsvButton } from "@/components/export-csv-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laporan" };

type SearchParams = { periode?: string; dari?: string; sampai?: string };

export default async function LaporanPage(props: PageProps<"/laporan">) {
  const sp = (await props.searchParams) as SearchParams;
  const period = sp.periode ?? "hari";
  const { from, to } = resolvePeriod(period, sp.dari, sp.sampai);
  const { summary, transactions, byMethod } = await getReport({ from, to });

  const csvRows: (string | number)[][] = [
    ["No. Invoice", "Waktu", "Metode", "Total"],
    ...transactions.map((t) => [
      t.invoiceNumber,
      formatTanggal(t.createdAt),
      PAYMENT_METHODS[t.paymentMethod as keyof typeof PAYMENT_METHODS] ?? t.paymentMethod,
      t.total,
    ]),
  ];

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Laporan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatTanggal(from).split(",")[0]} — {formatTanggal(to).split(",")[0]}
          </p>
        </div>
        {transactions.length > 0 && (
          <ExportCsvButton rows={csvRows} filename="laporan-penjualan.csv" />
        )}
      </div>

      <div className="mb-6">
        <PeriodPicker period={period} from={sp.dari} to={sp.sampai} />
      </div>

      {/* Ringkasan */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Pendapatan", value: formatRupiah(summary.totalRevenue), highlight: true },
          { label: "Jumlah Transaksi", value: String(summary.transactionCount) },
          { label: "Item Terjual", value: String(summary.itemsSold) },
          { label: "Rata-rata per Transaksi", value: formatRupiah(summary.avgTransaction) },
        ].map((s) => (
          <Card key={s.label} className={s.highlight ? "border-brand/50" : undefined}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={
                  "font-heading tabular-nums " +
                  (s.highlight ? "text-2xl font-bold text-brand" : "text-xl font-semibold")
                }
              >
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Per metode */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Per Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {byMethod.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada transaksi pada periode ini.
              </p>
            ) : (
              <ul className="space-y-2">
                {byMethod.map((m) => (
                  <li key={m.method} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {PAYMENT_METHODS[m.method as keyof typeof PAYMENT_METHODS] ?? m.method}
                      </Badge>
                      <span className="text-muted-foreground">{m.count} trx</span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatRupiah(m.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Rincian transaksi */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rincian Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada transaksi pada periode ini.
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Invoice</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.invoiceNumber}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTanggal(t.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {PAYMENT_METHODS[t.paymentMethod as keyof typeof PAYMENT_METHODS] ??
                              t.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatRupiah(t.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
