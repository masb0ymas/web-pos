import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "My POS",
    template: "%s · My POS",
  },
  description: "Aplikasi kasir (Point of Sale) untuk satu toko",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="antialiased">
        <AppSidebar>{children}</AppSidebar>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
