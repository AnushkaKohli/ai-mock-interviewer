import type { Metadata } from "next";
import { Spline_Sans_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--spline-mono-font",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prepwise",
  description: "AI-powered mock interview platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${splineSansMono.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
