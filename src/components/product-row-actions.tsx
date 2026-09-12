"use client";

import { useTransition } from "react";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteProduct, setProductActive } from "@/actions/product";

export function ProductRowActions({
  product,
}: {
  product: {
    id: number;
    name: string;
    isActive: boolean;
    hasTransactions: boolean;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      await setProductActive(product.id, !product.isActive);
      toast.success(
        product.isActive
          ? `Produk "${product.name}" dinonaktifkan`
          : `Produk "${product.name}" diaktifkan`
      );
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.refresh();
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label={`Aksi untuk ${product.name}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`/produk/${product.id}`}>
            <Pencil aria-hidden="true" /> Edit
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggle}>
          <Power aria-hidden="true" />
          {product.isActive ? "Nonaktifkan" : "Aktifkan"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              variant="destructive"
              disabled={product.hasTransactions}
            >
              <Trash2 aria-hidden="true" /> Hapus
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus produk?</AlertDialogTitle>
              <AlertDialogDescription>
                Produk &ldquo;{product.name}&rdquo; akan dihapus permanen. Produk
                yang sudah memiliki riwayat transaksi tidak dapat dihapus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
