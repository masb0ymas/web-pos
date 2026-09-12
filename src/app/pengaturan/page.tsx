import { getStoreSetting } from "@/lib/store";
import { SettingForm } from "@/components/setting-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan" };

export default async function PengaturanPage() {
  const setting = await getStoreSetting();

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identitas toko dan preferensi default — tampil pada invoice/struk.
        </p>
      </div>
      <SettingForm setting={setting} />
    </div>
  );
}
