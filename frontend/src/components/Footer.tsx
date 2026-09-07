import Link from 'next/link';
import { ShieldCheck, Phone, Mail, MapPin, MessageCircle, ExternalLink } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();
  const mapsUrl = "https://maps.google.com/?q=Near+Bangalore+university,+Kengunte,+Mallathahalli,+Bengaluru,+Karnataka+560056";

  return (
    <footer className="bg-slate-950 text-slate-300 mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand & Logo */}
        <div>
          <Link href="/" className="inline-block mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-black border border-amber-500/30 overflow-hidden flex items-center justify-center p-1 shadow-lg shadow-amber-500/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="./logo-dark.jpeg"
                  alt="Value Cars Logo"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    // Fallback to logo-light if needed
                    (e.target as HTMLImageElement).src = './logo-light.jpeg';
                  }}
                />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white">
                  VALUE<span className="text-amber-400">CARS</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                  Pre-Owned Vehicles
                </span>
              </div>
            </div>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            Quality • Trust • Great Deals. Certified pre-owned cars with transparent pricing, 200-point inspection, and instant dealer connect.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <a
              href="https://wa.me/918050966025?text=Hi%20Value%20Cars,%20I%20am%20interested%20in%20buying/viewing%20a%20car"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-900/30"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp: 8050966025
            </a>
          </div>
        </div>

        {/* Explore */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Explore</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/" className="hover:text-rose-400 transition">Browse Cars</Link></li>
            <li><Link href="/sell" className="hover:text-rose-400 transition">Sell / Add Your Car</Link></li>
            <li><Link href="/sell/my-listings" className="hover:text-rose-400 transition">My Listings</Link></li>
            <li><Link href="/admin" className="hover:text-amber-400 transition">Admin Hub</Link></li>
          </ul>
        </div>

        {/* Value Guarantee */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Why Value Cars</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center"><ShieldCheck className="w-4 h-4 text-emerald-400 mr-2" /> 200-Point Inspection</li>
            <li className="flex items-center"><ShieldCheck className="w-4 h-4 text-emerald-400 mr-2" /> 1-Year Comprehensive Warranty</li>
            <li className="flex items-center"><ShieldCheck className="w-4 h-4 text-emerald-400 mr-2" /> Free Home Test Drives</li>
            <li className="flex items-center"><ShieldCheck className="w-4 h-4 text-emerald-400 mr-2" /> Verified Direct Seller Deals</li>
          </ul>
        </div>

        {/* Contact & Location */}
        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Contact & Hub Location</h4>
          <ul className="space-y-3 text-xs">
            <li>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Call / WhatsApp Hotlines:</span>
              <div className="flex flex-col gap-1 mt-1">
                <a href="tel:8050966025" className="text-white font-bold hover:text-amber-400 transition flex items-center">
                  <Phone className="w-3.5 h-3.5 text-amber-400 mr-1.5" /> +91 80509 66025
                </a>
                <a href="tel:8310166040" className="text-white font-bold hover:text-amber-400 transition flex items-center">
                  <Phone className="w-3.5 h-3.5 text-amber-400 mr-1.5" /> +91 83101 66040
                </a>
              </div>
            </li>
            <li className="pt-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Bangalore Experience Hub:</span>
              <div className="mt-1 text-slate-300 leading-relaxed">
                Near Bangalore university, Kengunte, Mallathahalli, Bengaluru, Karnataka 560056
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center text-amber-400 hover:text-amber-300 font-bold text-xs transition underline decoration-amber-400/50 underline-offset-2"
              >
                <MapPin className="w-3.5 h-3.5 mr-1 text-rose-400" />
                View on Google Maps <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © {year} Value Cars Marketplace. All rights reserved. Quality • Trust • Great Deals.
      </div>
    </footer>
  );
}