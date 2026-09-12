"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createProduct,
  updateProduct,
  type FormState,
} from "@/actions/product";
import { idleState } from "@/actions/product";

export type CategoryOption = { id: number; name: string };

function HiddenCategory({ value }: { value?: number }) {
  return value ? <input type="hidden" name="categoryId" value={value} /> : null;
}

export function ProductForm({
  categories,
  product,
}: {
  categories: CategoryOption[];
  product?: {
    id: number;
    name: string;
    sku: string | null;
    categoryId: number | null;
    price: number;
    cost: number | null;
    stock: number;
  };
}) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    idleState
  );

  const categoryValue =
    product?.categoryId != null ? String(product.categoryId) : "";

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {state.status === "error" && state.message && (
        <Alert variant="destructive" role="alert">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nama Produk *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={product?.name}
          required
          aria-invalid={!!state.fieldErrors?.name}
          placeholder="mis. Indomie Goreng"
        />
        {state.fieldErrors?.name?.[0] && (
          <p className="text-sm text-destructive" role="alert">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            name="sku"
            defaultValue={product?.sku ?? ""}
            placeholder="mis. MKN-001 (opsional)"
          />
          {state.fieldErrors?.sku?.[0] && (
            <p className="text-sm text-destructive" role="alert">
              {state.fieldErrors.sku[0]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Kategori</Label>
          {product?.categoryId ? (
            <HiddenCategory value={product.categoryId} />
          ) : null}
          <Select name="categoryId" defaultValue={categoryValue}>
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="Tanpa kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tanpa kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price">Harga Jual (Rp) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={1}
            step={1}
            defaultValue={product?.price}
            required
            inputMode="numeric"
            aria-invalid={!!state.fieldErrors?.price}
          />
          {state.fieldErrors?.price?.[0] && (
            <p className="text-sm text-destructive" role="alert">
              {state.fieldErrors.price[0]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost">Harga Modal (Rp)</Label>
          <Input
            id="cost"
            name="cost"
            type="number"
            min={0}
            step={1}
            defaultValue={product?.cost ?? ""}
            inputMode="numeric"
            aria-invalid={!!state.fieldErrors?.cost}
          />
          {state.fieldErrors?.cost?.[0] && (
            <p className="text-sm text-destructive" role="alert">
              {state.fieldErrors.cost[0]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stok *</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            step={1}
            defaultValue={product?.stock ?? 0}
            required
            inputMode="numeric"
            aria-invalid={!!state.fieldErrors?.stock}
          />
          {state.fieldErrors?.stock?.[0] && (
            <p className="text-sm text-destructive" role="alert">
              {state.fieldErrors.stock[0]}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {product ? "Simpan Perubahan" : "Tambah Produk"}
        </Button>
        <Button type="button" variant="secondary" asChild>
          <Link href="/produk">Batal</Link>
        </Button>
      </div>
    </form>
  );
}
