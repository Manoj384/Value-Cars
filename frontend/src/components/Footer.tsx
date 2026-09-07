import Link from 'next/link';
import { Car as CarIcon, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white font-black">
              <CarIcon className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">VALUE<span className="text-rose-500">CARS</span></span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            India&apos;s certified used-car marketplace. Every car passes a rigorous
            200-point inspection backed by quality and transparency.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Explore</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/" className="hover:text-rose-400 transition">Browse Cars</Link></li>
            <li><Link href="/sell" className="hover:text-rose-400 transition">Sell / Add Your Car</Link></li>
            <li><Link href="/admin" className="hover:text-rose-400 transition">Admin Hub</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Why Value Cars</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center"><ShieldCheck className="w-4 h-4 text-emerald-400 mr-2" /> 200-Point Inspection</li>
            <li className="flex items-center"><ShieldCheck className="w-4 h-4 text-emerald-400 mr-2" /> 1-Year Warranty</li>
            <li className="flex items-center"><ShieldCheck className="w-4 h-4 text-emerald-400 mr-2" /> 5-Day Money-Back Guarantee</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Contact</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center"><Phone className="w-4 h-4 text-rose-400 mr-2" /> 1800-200-VALUE</li>
            <li className="flex items-center"><Mail className="w-4 h-4 text-rose-400 mr-2" /> support@valuecars.com</li>
            <li className="flex items-start"><MapPin className="w-4 h-4 text-rose-400 mr-2 mt-0.5" /> 24th Main, HSR Layout, Bangalore 560102</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © {year} Value Cars Marketplace. All rights reserved. Built with 🚗 for a trusted pre-owned car experience.
      </div>
    </footer>
  );
}