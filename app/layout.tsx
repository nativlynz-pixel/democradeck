import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DemocraDeck",
  description: "A fun card game and dashboard for the 2025 Taupō District Council election.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-blue-50 text-gray-800 font-sans">
        {children}
      </body>
    </html>
  );
}
