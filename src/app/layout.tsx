"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/shared/Navbar";
import { Sidebar } from "@/components/shared/Sidebar";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPage = pathname === "/" || pathname === "/login";

  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-50 antialiased`}>
        {isPublicPage ? (
          <div className="min-h-screen w-full">
            <Navbar />
            {children}
          </div>
        ) : (
          <div className="flex h-screen overflow-hidden bg-zinc-50">
            <Sidebar />
            <div className="flex-1 flex flex-col relative overflow-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {children}
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
