import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <header className="bg-navy-900 text-white border-b-4 border-gold-500" role="banner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-2 sm:gap-3 no-underline text-white">
                <div className="text-xl sm:text-2xl font-bold tracking-tight">
                  <span className="text-white">RICHARDS</span>
                  <span className="text-gold-400 mx-1">&</span>
                  <span className="text-white">LAW</span>
                </div>
                <div className="hidden sm:block h-8 w-px bg-navy-600 mx-2 lg:mx-3" />
                <span className="hidden sm:block text-navy-300 text-sm font-medium">
                  AI Intake Portal
                </span>
              </a>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-navy-300" aria-label="System status: Active">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" aria-hidden="true" />
                <span className="hidden xs:inline">System</span> Active
              </div>
            </div>
          </div>
        </header>
        <main
          id="main-content"
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          role="main"
        >
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-auto" role="contentinfo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs sm:text-sm text-gray-400">
            Richards & Law Automated Intake System &middot; Powered by AI
          </div>
        </footer>
      </body>
    </html>
  );
}
