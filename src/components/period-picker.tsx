"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toInputDate } from "@/lib/format";

const periods = [
  { value: "hari", label: "Hari Ini" },
  { value: "minggu", label: "Minggu Ini" },
  { value: "bulan", label: "Bulan Ini" },
  { value: "custom", label: "Rentang Kustom" },
];

export function PeriodPicker({ period, from, to }: { period: string; from?: string; to?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const apply = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    router.push(`/laporan?${params.toString()}`);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Pilih periode laporan">
        {periods.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={period === p.value}
            onClick={() => {
              if (p.value === "custom" && !from && !to) {
                const today = toInputDate(new Date());
                apply({ periode: "custom", dari: today, sampai: today });
              } else {
                apply({ periode: p.value, dari: undefined, sampai: undefined });
              }
            }}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-150",
              period === p.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="space-y-1">
            <span className="block text-xs text-muted-foreground">Dari</span>
            <input
              type="date"
              defaultValue={from ?? toInputDate(new Date())}
              onChange={(e) => apply({ dari: e.target.value })}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs text-muted-foreground">Sampai</span>
            <input
              type="date"
              defaultValue={to ?? toInputDate(new Date())}
              onChange={(e) => apply({ sampai: e.target.value })}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
        </div>
      )}
    </div>
  );
}
