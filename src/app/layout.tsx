import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Richards & Law — AI Intake Portal",
  description:
    "Automated police report processing and retainer agreement generation for Richards & Law",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-navy-900 text-white border-b-4 border-gold-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold tracking-tight">
                  <span className="text-white">RICHARDS</span>
                  <span className="text-gold-400 mx-1">&</span>
                  <span className="text-white">LAW</span>
                </div>
                <div className="hidden sm:block h-8 w-px bg-navy-600 mx-3" />
                <span className="hidden sm:block text-navy-300 text-sm font-medium">
                  AI Intake Portal
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-navy-300">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                System Active
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-400">
            Richards & Law Automated Intake System &middot; Powered by AI
          </div>
        </footer>
      </body>
    </html>
  );
}
