import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Value Cars | Certified Used Cars Marketplace',
  description: 'Buy and sell inspected used cars with 200-point quality assurance, warranty, and instant valuation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
