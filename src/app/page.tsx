import Link from "next/link";
import { ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold">My POS</h1>
        <p className="mt-2 text-muted-foreground">
          Dashboard sedang disusun — modul lain sudah bisa diakses.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/kasir">
              <ShoppingCart aria-hidden="true" /> Mulai Transaksi
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/produk">
              <Package aria-hidden="true" /> Kelola Produk
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
