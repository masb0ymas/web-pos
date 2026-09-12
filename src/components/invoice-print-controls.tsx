"use client";

import { Printer, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function InvoicePrintControls() {
  const router = useRouter();

  const print = (mode: "a4" | "thermal") => {
    document.body.classList.remove("print-a4", "print-thermal");
    document.body.classList.add(`print-${mode}`);
    window.print();
  };

  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={() => router.push("/kasir")}>
        <PlusCircle aria-hidden="true" /> Transaksi Baru
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Printer aria-hidden="true" /> Cetak
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => print("a4")}>
            Cetak A4 (laporan)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => print("thermal")}>
            Cetak Struk Thermal 80mm
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
