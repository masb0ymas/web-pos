"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateStoreSetting } from "@/actions/setting";
import { idleState, type FormState } from "@/actions/product";

type Setting = {
  storeName: string;
  address: string | null;
  phone: string | null;
  invoiceFooter: string | null;
  taxEnabled: boolean;
  taxRate: number;
  lowStockThreshold: number;
};

export function SettingForm({ setting }: { setting: Setting }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    updateStoreSetting,
    idleState
  );

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {state.status === "error" && state.message && (
        <Alert variant="destructive" role="alert">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="storeName">Nama Toko *</Label>
        <Input id="storeName" name="storeName" defaultValue={setting.storeName} required />
        {state.fieldErrors?.storeName?.[0] && (
          <p className="text-sm text-destructive" role="alert">
            {state.fieldErrors.storeName[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Alamat</Label>
        <Textarea id="address" name="address" defaultValue={setting.address ?? ""} rows={2} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telepon</Label>
        <Input id="phone" name="phone" defaultValue={setting.phone ?? ""} inputMode="tel" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoiceFooter">Footer Invoice/Struk</Label>
        <Textarea
          id="invoiceFooter"
          name="invoiceFooter"
          defaultValue={setting.invoiceFooter ?? ""}
          rows={2}
          placeholder="mis. Terima kasih atas kunjungan Anda"
        />
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="taxEnabled">Aktifkan PPN secara default</Label>
            <p className="text-xs text-muted-foreground">
              Kasir baru akan memakai pengaturan ini (tetap bisa diubah per transaksi).
            </p>
          </div>
          <Switch id="taxEnabled" name="taxEnabled" defaultChecked={setting.taxEnabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tarif PPN (%)</Label>
          <Input
            id="taxRate"
            name="taxRate"
            type="number"
            min={0}
            max={100}
            defaultValue={setting.taxRate}
          />
          {state.fieldErrors?.taxRate?.[0] && (
            <p className="text-sm text-destructive" role="alert">
              {state.fieldErrors.taxRate[0]}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lowStockThreshold">Ambang Stok Rendah</Label>
        <Input
          id="lowStockThreshold"
          name="lowStockThreshold"
          type="number"
          min={0}
          defaultValue={setting.lowStockThreshold}
        />
        {state.fieldErrors?.lowStockThreshold?.[0] && (
          <p className="text-sm text-destructive" role="alert">
            {state.fieldErrors.lowStockThreshold[0]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : state.status === "success" ? (
          <CheckCircle2 aria-hidden="true" />
        ) : null}
        Simpan Pengaturan
      </Button>
    </form>
  );
}
