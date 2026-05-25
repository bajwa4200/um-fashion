import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OutfitWizard } from "@/components/OutfitWizard";

export const metadata: Metadata = {
  title: "UM Fashion — Future of Style",
  description: "AI-powered fashion marketplace with Make Your Outfit stylist",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-mesh min-h-screen">
        <Providers>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Footer />
          <OutfitWizard />
        </Providers>
      </body>
    </html>
  );
}
