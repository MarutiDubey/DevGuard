import "./globals.css";
import { Outfit, Inter } from "next/font/google";
import Sidebar from "@/components/layout/Sidebar";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${outfit.variable} ${inter.variable}`}>
      <body className="antialiased bg-[#0B0E14] text-slate-50 flex h-screen overflow-hidden selection:bg-[#F5A623] selection:text-black">
        {/* Ambient Top Glow */}
        <div className="absolute top-[-30%] left-[20%] right-[20%] h-[60%] rounded-[100%] bg-blue-600/10 blur-[150px] pointer-events-none animate-breathe" />
        <div className="absolute top-[-20%] left-[40%] right-[40%] h-[40%] rounded-[100%] bg-[#F5A623]/5 blur-[120px] pointer-events-none animate-breathe" style={{ animationDelay: '2s' }} />

        {/* Main Application Shell with Floating Sidebar */}
        <div className="flex w-full h-full p-4 gap-6 z-10 relative">
          <Sidebar />
          <main className="flex-1 overflow-y-auto glass-panel rounded-2xl relative shadow-2xl">
            <div className="p-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
