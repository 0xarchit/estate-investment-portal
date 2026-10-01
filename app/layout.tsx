import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const headings = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "EstatePortal — A share in something real",
    template: "%s | EstatePortal",
  },
  description:
    "Explore fractional property ownership. Discover properties, understand your investment, and manage your portfolio.",
  icons: { icon: "/logo.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${headings.variable} min-h-screen font-sans antialiased`}
      >
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
