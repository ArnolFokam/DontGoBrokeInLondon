import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Don't Go Broke in London",
  description: "AI financial audit agent for London life",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#f5fbfa] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
