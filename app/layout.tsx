import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI2WEBFLOW - From Claude/ChatGPT to Webflow in 1-click",
  description: "From Claude/ChatGPT to Webflow in 1-click. Convert AI-generated HTML/CSS to Webflow clipboard format instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
