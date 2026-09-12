import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStoreSetting } from "@/lib/store";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { InvoicePrintControls } from "@/components/invoice-print-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice" };

export default async function InvoicePage(props: PageProps<"/transaksi/[id]">) {
  const { id } = await props.params;
  const txId = Number(id);
  if (!Number.isInteger(txId)) notFound();

  const [transaction, setting] = await Promise.all([
    prisma.transaction.findUnique({
      where: { id: txId },
      include: { items: true },
    }),
    getStoreSetting(),
  ]);
  if (!transaction) notFound();

  const method =
    PAYMENT_METHODS[
      transaction.paymentMethod as keyof typeof PAYMENT_METHODS
    ] ?? transaction.paymentMethod;

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/transaksi">
              <ArrowLeft aria-hidden="true" /> Riwayat Transaksi
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-semibold">
            {transaction.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatTanggal(transaction.createdAt)}
          </p>
        </div>
        <InvoicePrintControls />
      </div>

      {/* ---------- Dokumen A4 ---------- */}
      <article className="invoice-a4 mx-auto max-w-2xl rounded-lg border bg-white p-8 text-black shadow-sm print:border-0 print:rounded-none print:shadow-none">
        <header className="border-b pb-4 text-center">
          <h2 className="font-heading text-xl font-bold">{setting.storeName}</h2>
          {setting.address && <p className="text-sm">{setting.address}</p>}
          {setting.phone && <p className="text-sm">Telp: {setting.phone}</p>}
          <h3 className="mt-3 font-heading text-lg font-semibold">
            INVOICE {transaction.invoiceNumber}
          </h3>
          <p className="text-sm">{formatTanggal(transaction.createdAt)}</p>
        </header>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Harga</th>
              <th className="py-2 text-right">Diskon</th>
              <th className="py-2 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((item) => (
              <tr key={item.id} className="border-b align-top">
                <td className="py-2">{item.productName}</td>
                <td className="py-2 text-center tabular-nums">{item.quantity}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatRupiah(item.unitPrice)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {item.lineDiscount > 0
                    ? `−${formatRupiah(item.lineDiscount)}`
                    : "—"}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatRupiah(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatRupiah(transaction.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Diskon transaksi</dt>
            <dd className="tabular-nums">
              {transaction.transactionDiscount > 0
                ? `−${formatRupiah(transaction.transactionDiscount)}`
                : formatRupiah(0)}
            </dd>
          </div>
          {transaction.taxRate > 0 && (
            <div className="flex justify-between">
              <dt>PPN {transaction.taxRate}%</dt>
              <dd className="tabular-nums">
                {formatRupiah(transaction.taxAmount)}
              </dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 font-heading text-base font-bold">
            <dt>TOTAL</dt>
            <dd className="tabular-nums">{formatRupiah(transaction.total)}</dd>
          </div>
          <div className="flex justify-between pt-1">
            <dt>Pembayaran ({method})</dt>
            <dd className="tabular-nums">{formatRupiah(transaction.amountPaid)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Kembalian</dt>
            <dd className="tabular-nums">{formatRupiah(transaction.changeDue)}</dd>
          </div>
        </dl>

        {transaction.note && (
          <p className="mt-4 text-sm">
            <span className="font-semibold">Catatan:</span> {transaction.note}
          </p>
        )}
        {setting.invoiceFooter && (
          <footer className="mt-6 border-t pt-3 text-center text-sm">
            {setting.invoiceFooter}
          </footer>
        )}
      </article>

      {/* ---------- Struk thermal 80mm (hanya muncul saat cetak mode thermal) ---------- */}
      <article className="invoice-thermal mx-auto w-[302px] bg-white p-4 font-mono text-[12px] leading-snug text-black">
        <header className="text-center">
          <h2 className="text-[14px] font-bold uppercase">{setting.storeName}</h2>
          {setting.address && <p>{setting.address}</p>}
          {setting.phone && <p>Telp: {setting.phone}</p>}
        </header>
        <p className="mt-2 border-t border-dashed border-black pt-2">
          {transaction.invoiceNumber}
          <br />
          {formatTanggal(transaction.createdAt)}
        </p>
        <table className="mt-2 w-full">
          <tbody>
            {transaction.items.map((item) => (
              <Fragment key={item.id}>
                <tr>
                  <td colSpan={2} className="pt-1">
                    {item.productName}
                  </td>
                </tr>
                <tr>
                  <td>
                    {item.quantity} x {formatRupiah(item.unitPrice)}
                  </td>
                  <td className="text-right tabular-nums">
                    {formatRupiah(item.lineTotal)}
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
        <table className="mt-2 w-full border-t border-dashed border-black">
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td className="text-right tabular-nums">
                {formatRupiah(transaction.subtotal)}
              </td>
            </tr>
            {transaction.transactionDiscount > 0 && (
              <tr>
                <td>Diskon</td>
                <td className="text-right tabular-nums">
                  −{formatRupiah(transaction.transactionDiscount)}
                </td>
              </tr>
            )}
            {transaction.taxRate > 0 && (
              <tr>
                <td>PPN {transaction.taxRate}%</td>
                <td className="text-right tabular-nums">
                  {formatRupiah(transaction.taxAmount)}
                </td>
              </tr>
            )}
            <tr className="font-bold">
              <td>TOTAL</td>
              <td className="text-right tabular-nums">
                {formatRupiah(transaction.total)}
              </td>
            </tr>
            <tr>
              <td>{method}</td>
              <td className="text-right tabular-nums">
                {formatRupiah(transaction.amountPaid)}
              </td>
            </tr>
            <tr>
              <td>Kembali</td>
              <td className="text-right tabular-nums">
                {formatRupiah(transaction.changeDue)}
              </td>
            </tr>
          </tbody>
        </table>
        {setting.invoiceFooter && (
          <footer className="mt-2 border-t border-dashed border-black pt-2 text-center">
            {setting.invoiceFooter}
          </footer>
        )}
      </article>
    </div>
  );
}
