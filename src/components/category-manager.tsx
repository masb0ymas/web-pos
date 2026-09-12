"use client";

import { useState, useTransition } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, deleteCategory } from "@/actions/product";

export function CategoryManager({
  categories,
}: {
  categories: { id: number; name: string; productCount: number }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const add = (formData: FormData) => {
    startTransition(async () => {
      const result = await createCategory(
        { status: "idle" as const },
        formData
      );
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.refresh();
      }
    });
  };

  const remove = (id: number, name: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.status === "error") {
        toast.error(result.message);
      } else {
        toast.success(`Kategori "${name}" dihapus`);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Tags aria-hidden="true" /> Kelola Kategori
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kelola Kategori</DialogTitle>
          <DialogDescription>
            Kategori dengan produk di dalamnya tidak dapat dihapus.
          </DialogDescription>
        </DialogHeader>

        <form action={add} className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="category-name" className="sr-only">
              Nama kategori baru
            </Label>
            <Input
              id="category-name"
              name="name"
              placeholder="Nama kategori baru"
              required
            />
          </div>
          <Button type="submit" disabled={isPending}>
            <Plus aria-hidden="true" /> Tambah
          </Button>
        </form>

        <ul className="max-h-64 space-y-1 overflow-y-auto" aria-label="Daftar kategori">
          {categories.length === 0 && (
            <li className="py-4 text-center text-sm text-muted-foreground">
              Belum ada kategori.
            </li>
          )}
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <span>
                {c.name}{" "}
                <span className="text-muted-foreground">
                  ({c.productCount} produk)
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Hapus kategori ${c.name}`}
                disabled={isPending || c.productCount > 0}
                onClick={() => remove(c.id, c.name)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
