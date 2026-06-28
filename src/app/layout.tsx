import type { Metadata } from "next";
import { Nunito_Sans, Inter } from "next/font/google"; // Using Inter as a placeholder for Poligon
import "./globals.css";
import CrushITAI from "@/components/CrushITAI";

const nunitoSans = Nunito_Sans({
  variable: "--font-secondary", // Mapped to Secondary
  subsets: ["latin"],
  display: "swap",
});

// TODO: Replace this with localFont when you have the Poligon font files
// import localFont from 'next/font/local'
// const poligon = localFont({
//   src: './fonts/Poligon.woff2',
//   variable: '--font-primary',
// })
const poligon = Inter({
  variable: "--font-primary", // Mapped to Primary
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Goal Hyke",
  description: "Goal Hyke Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poligon.variable} ${nunitoSans.variable} antialiased font-primary`}
        suppressHydrationWarning
      >
        {children}
        <CrushITAI />
      </body>
    </html>
  );
}
