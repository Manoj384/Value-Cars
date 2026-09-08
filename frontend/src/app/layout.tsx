import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AppTelemetry } from '../components/AppTelemetry';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';
import { BackToTop } from '../components/BackToTop';

// Self-hosted Google Font (bundled at build time) - no runtime CDN dependency,
// so the site stays fast and robust even if external hosts are slow/unreachable.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Value Cars | Certified Used Cars Marketplace',
  description:
    'Buy and sell inspected used cars with 200-point quality assurance, warranty, and instant valuation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col font-sans">
        <AppTelemetry />
        <ErrorBoundary>
          {children}
          <FloatingWhatsApp />
          <BackToTop />
        </ErrorBoundary>
      </body>
    </html>
  );
}
