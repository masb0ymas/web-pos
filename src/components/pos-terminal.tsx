"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import { useActionState } from "react";
import { checkout, type CheckoutState } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type PosProduct = {
  id: number;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  categoryId: number | null;
};

type CartLine = {
  productId: number;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  lineDiscount: number;
};

const initialState: CheckoutState = { status: "idle" };

export function PosTerminal({
  products,
  categories,
  taxEnabledDefault,
  taxRate,
  lowStockThreshold,
}: {
  products: PosProduct[];
  categories: { id: number; name: string }[];
  taxEnabledDefault: boolean;
  taxRate: number;
  lowStockThreshold: number;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<CheckoutState, string>(
    checkout,
    initialState
  );
  const [isSubmitting, startTransition] = useTransition();
  const isBusy = isPending || isSubmitting;

  useEffect(() => {
    if (state.status === "success" && state.transactionId) {
      router.push(`/transaksi/${state.transactionId}`);
    }
  }, [state, router]);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [transactionDiscount, setTransactionDiscount] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(taxEnabledDefault);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "CARD">("CASH");
  const [amountPaid, setAmountPaid] = useState(0);

  /* ---------- Filter produk ---------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId !== null && p.categoryId !== categoryId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku ? p.sku.toLowerCase().includes(q) : false)
      );
    });
  }, [products, search, categoryId]);

  /* ---------- Kalkulasi (mirror aturan PRD §7.2) ---------- */
  const subtotal = cart.reduce(
    (s, l) => s + l.price * l.quantity - l.lineDiscount,
    0
  );
  const txDiscount =
    discountMode === "percent"
      ? Math.round((subtotal * Math.min(transactionDiscount, 100)) / 100)
      : Math.min(transactionDiscount, subtotal);
  const taxAmount = taxEnabled
    ? Math.round(((subtotal - txDiscount) * taxRate) / 100)
    : 0;
  const total = Math.max(subtotal - txDiscount + taxAmount, 0);
  const change = amountPaid - total;
  const cashShort = paymentMethod === "CASH" && amountPaid < total;
  const canSubmit = cart.length > 0 && !cashShort && !isBusy;

  /* ---------- Keranjang ---------- */
  const addToCart = (product: PosProduct) => {
    if (product.stock <= 0) {
      toast.error(`Stok "${product.name}" habis.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Stok "${product.name}" hanya ${product.stock}.`);
          return prev;
        }
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          quantity: 1,
          lineDiscount: 0,
        },
      ];
    });
  };

  const setQuantity = (productId: number, quantity: number) => {
    setCart((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? { ...l, quantity: Math.min(Math.max(quantity, 1), l.stock) }
          : l
      )
    );
  };

  const setLineDiscount = (productId: number, value: number) => {
    setCart((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? { ...l, lineDiscount: Math.max(0, Math.min(value, l.price * l.quantity)) }
          : l
      )
    );
  };

  const removeLine = (productId: number) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };

  const submit = () => {
    const payload = JSON.stringify({
      items: cart.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        lineDiscount: l.lineDiscount,
      })),
      transactionDiscount,
      discountMode,
      taxEnabled,
      paymentMethod,
      amountPaid,
    });
    startTransition(() => {
      formAction(payload);
    });
  };

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6">
      <h1 className="sr-only">Kasir</h1>
      {state.status === "error" && state.message && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        {/* ---------- Grid produk ---------- */}
        <section className="flex min-w-0 flex-1 flex-col" aria-label="Daftar produk">
          <div className="relative mb-3">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk (nama / SKU)…"
              className="pl-9"
              aria-label="Cari produk"
            />
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter kategori">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                categoryId === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              Semua
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id === categoryId ? null : c.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                  categoryId === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
            {filtered.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                Tidak ada produk yang cocok.
              </p>
            )}
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                aria-label={`Tambah ${p.name}, ${formatRupiah(p.price)}`}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-colors duration-150",
                  "hover:bg-accent focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <span className="line-clamp-2 text-sm font-medium">{p.name}</span>
                <span className="text-sm font-semibold text-brand tabular-nums">
                  {formatRupiah(p.price)}
                </span>
                <span className="mt-auto text-xs text-muted-foreground">
                  Stok{" "}
                  <span className={p.stock <= lowStockThreshold ? "font-semibold text-brand" : ""}>
                    {p.stock}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ---------- Panel keranjang ---------- */}
        <section
          className="flex w-full flex-col rounded-lg border bg-card lg:w-96 lg:shrink-0"
          aria-label="Keranjang"
        >
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <ShoppingBag className="size-4" aria-hidden="true" />
            <h2 className="font-heading font-semibold">Keranjang</h2>
            {cart.length > 0 && (
              <Badge variant="secondary" aria-live="polite">
                {cart.reduce((s, l) => s + l.quantity, 0)} item
              </Badge>
            )}
          </div>

          <div className="max-h-72 flex-1 overflow-y-auto lg:max-h-none">
            {cart.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Klik produk di kiri untuk menambah ke keranjang.
              </p>
            ) : (
              <ul className="divide-y">
                {cart.map((l) => (
                  <li key={l.productId} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{l.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => removeLine(l.productId)}
                        aria-label={`Hapus ${l.name} dari keranjang`}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => setQuantity(l.productId, l.quantity - 1)}
                          disabled={l.quantity <= 1}
                          aria-label={`Kurangi ${l.name}`}
                        >
                          <Minus className="size-3" aria-hidden="true" />
                        </Button>
                        <Input
                          type="number"
                          value={l.quantity}
                          min={1}
                          max={l.stock}
                          onChange={(e) =>
                            setQuantity(l.productId, Number(e.target.value) || 1)
                          }
                          className="h-7 w-14 px-1 text-center text-sm"
                          aria-label={`Jumlah ${l.name}`}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => setQuantity(l.productId, l.quantity + 1)}
                          disabled={l.quantity >= l.stock}
                          aria-label={`Tambah ${l.name}`}
                        >
                          <Plus className="size-3" aria-hidden="true" />
                        </Button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatRupiah(l.price * l.quantity - l.lineDiscount)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Label
                        htmlFor={`disc-${l.productId}`}
                        className="text-xs text-muted-foreground"
                      >
                        Diskon Rp
                      </Label>
                      <Input
                        id={`disc-${l.productId}`}
                        type="number"
                        min={0}
                        value={l.lineDiscount || ""}
                        placeholder="0"
                        onChange={(e) =>
                          setLineDiscount(l.productId, Number(e.target.value) || 0)
                        }
                        className="h-6 w-24 px-2 text-xs"
                        inputMode="numeric"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t p-4">
            {/* Ringkasan */}
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatRupiah(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Diskon transaksi</dt>
                <dd className="tabular-nums text-destructive">
                  −{formatRupiah(txDiscount)}
                </dd>
              </div>
              {taxEnabled && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">PPN {taxRate}%</dt>
                  <dd className="tabular-nums">{formatRupiah(taxAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-1.5 font-heading text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums" aria-live="polite">
                  {formatRupiah(total)}
                </dd>
              </div>
            </dl>

            {/* Diskon transaksi */}
            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded-md border" role="group" aria-label="Mode diskon">
                <button
                  type="button"
                  onClick={() => setDiscountMode("amount")}
                  aria-pressed={discountMode === "amount"}
                  className={cn(
                    "cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors",
                    discountMode === "amount" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  Rp
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountMode("percent")}
                  aria-pressed={discountMode === "percent"}
                  className={cn(
                    "cursor-pointer border-l px-3 py-1.5 text-xs font-medium transition-colors",
                    discountMode === "percent" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  %
                </button>
              </div>
              <Input
                type="number"
                min={0}
                value={transactionDiscount || ""}
                placeholder="0"
                onChange={(e) => setTransactionDiscount(Number(e.target.value) || 0)}
                className="h-8 flex-1"
                aria-label="Nominal atau persentase diskon transaksi"
                inputMode="numeric"
              />
            </div>

            {/* PPN */}
            <div className="flex items-center justify-between">
              <Label htmlFor="tax-toggle" className="text-sm">
                PPN {taxRate}%
              </Label>
              <Switch
                id="tax-toggle"
                checked={taxEnabled}
                onCheckedChange={setTaxEnabled}
              />
            </div>

            {/* Metode pembayaran */}
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
              className="grid grid-cols-3 gap-1.5"
              aria-label="Metode pembayaran"
            >
              {(
                [
                  { value: "CASH", label: "Tunai", icon: Banknote },
                  { value: "QRIS", label: "QRIS", icon: QrCode },
                  { value: "CARD", label: "Kartu", icon: CreditCard },
                ] as const
              ).map((m) => (
                <Label
                  key={m.value}
                  htmlFor={`pay-${m.value}`}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1 rounded-md border p-2 text-xs font-medium transition-colors",
                    paymentMethod === m.value
                      ? "border-primary bg-primary/10"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <RadioGroupItem id={`pay-${m.value}`} value={m.value} className="sr-only" />
                  <m.icon className="size-4" aria-hidden="true" />
                  {m.label}
                </Label>
              ))}
            </RadioGroup>

            {/* Bayar tunai */}
            {paymentMethod === "CASH" && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="amount-paid" className="text-sm">
                    Bayar
                  </Label>
                  <Input
                    id="amount-paid"
                    type="number"
                    min={0}
                    value={amountPaid || ""}
                    placeholder="0"
                    onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                    className="h-8 flex-1"
                    inputMode="numeric"
                    aria-invalid={cashShort}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setAmountPaid(total)}
                    >
                      Uang pas
                    </Button>
                    {[50000, 100000].map((v) => (
                      <Button
                        key={v}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setAmountPaid(Math.ceil(total / v) * v)}
                      >
                        +{v / 1000}rb
                      </Button>
                    ))}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      cashShort ? "text-destructive" : "text-brand"
                    )}
                    aria-live="polite"
                  >
                    {cashShort
                      ? `Kurang ${formatRupiah(total - amountPaid)}`
                      : `Kembali ${formatRupiah(Math.max(change, 0))}`}
                  </span>
                </div>
              </div>
            )}

            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={!canSubmit}
              onClick={submit}
            >
              {isBusy && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isBusy ? "Menyimpan…" : "Bayar"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
