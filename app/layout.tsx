import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code to Webflow",
  description: "Convert HTML/CSS to Webflow clipboard format",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
