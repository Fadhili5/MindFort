import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "MindVault — Privacy-First Adaptive Tutoring",
  description:
    "Personalised, pedagogically rigorous learning without transmitting raw student data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <header className="border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="font-semibold text-lg">MindVault</span>
          </div>
          <nav className="flex gap-6 text-sm">
            <a href="/tutor" className="text-[var(--foreground)] hover:text-brand-500 transition-colors">
              Tutor
            </a>
            <a href="/dashboard" className="text-[var(--muted)] hover:text-brand-500 transition-colors">
              Dashboard
            </a>
          </nav>
          <div className="flex items-center gap-2 text-xs text-[var(--success)]">
            <span className="h-2 w-2 rounded-full bg-[var(--success)] animate-pulse" />
            On-Device
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
