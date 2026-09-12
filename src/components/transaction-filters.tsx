"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toInputDate } from "@/lib/format";

function nextDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function TransactionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = new Date();
  const [invoice, setInvoice] = useState(searchParams.get("invoice") ?? "");
  const [dari, setDari] = useState(
    searchParams.get("dari") ?? toInputDate(nextDays(today, -30))
  );
  const [sampai, setSampai] = useState(
    searchParams.get("sampai") ?? toInputDate(nextDays(today, 1))
  );
  const [metode, setMetode] = useState(searchParams.get("metode") ?? "all");

  const apply = (metodeValue: string) => {
    const params = new URLSearchParams();
    if (invoice.trim()) params.set("invoice", invoice.trim());
    if (dari) params.set("dari", dari);
    if (sampai) params.set("sampai", sampai);
    if (metodeValue !== "all") params.set("metode", metodeValue);
    router.push(params.size ? `/transaksi?${params}` : "/transaksi");
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply(metode);
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <div className="space-y-1.5">
          <Label htmlFor="f-invoice" className="text-xs text-muted-foreground">
            No. Invoice
          </Label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="f-invoice"
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              placeholder="INV-…"
              className="w-44 pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="f-dari" className="text-xs text-muted-foreground">
            Dari
          </Label>
          <Input
            id="f-dari"
            type="date"
            value={dari}
            onChange={(e) => setDari(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="f-sampai" className="text-xs text-muted-foreground">
            Sampai
          </Label>
          <Input
            id="f-sampai"
            type="date"
            value={sampai}
            onChange={(e) => setSampai(e.target.value)}
            className="w-40"
          />
        </div>

        <Select
          value={metode}
          onValueChange={(v) => {
            setMetode(v);
            apply(v);
          }}
        >
          <SelectTrigger className="w-36" aria-label="Filter metode pembayaran">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua metode</SelectItem>
            <SelectItem value="CASH">Tunai</SelectItem>
            <SelectItem value="QRIS">QRIS</SelectItem>
            <SelectItem value="CARD">Kartu</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit" variant="secondary">
          Terapkan
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setInvoice("");
            setDari(toInputDate(nextDays(new Date(), -30)));
            setSampai(toInputDate(nextDays(new Date(), 1)));
            setMetode("all");
            router.push("/transaksi");
          }}
        >
          <X aria-hidden="true" /> Reset
        </Button>
      </form>
    </div>
  );
}
