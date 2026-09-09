import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HandyMan - Find Nearby Technicians",
  description: "Connect with skilled professionals near you",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              success: {
                duration: 4000,
                style: {
                  background: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  fontSize: "14px",
                  fontWeight: "500",
                },
                iconTheme: {
                  primary: "#16a34a",
                  secondary: "#f0fdf4",
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  fontSize: "14px",
                  fontWeight: "500",
                },
                iconTheme: {
                  primary: "#dc2626",
                  secondary: "#fef2f2",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}