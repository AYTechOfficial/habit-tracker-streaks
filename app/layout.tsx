import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scaffold",
  description: "A frictionless, psychology-aware daily routine tool that replaces manual logging with automated nudges and forgiving streak mechanics to solve the abandonment problem plaguing existing trackers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
