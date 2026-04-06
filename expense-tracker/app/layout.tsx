import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Expense Tracker & Budget Advisor",
  description: "Minimal mobile-first expense tracker with AI insights",
};

// Inline script that runs BEFORE React hydrates to prevent flash of wrong theme
const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme') || 'dark';
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(saved);
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Flash prevention: apply theme before any paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
