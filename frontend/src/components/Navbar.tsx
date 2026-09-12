'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, RotateCcw, Truck, PlusCircle, LayoutDashboard, Search, MapPin, Phone, Menu, X, UserCircle2, MessageCircle, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../context/auth';

interface NavbarProps {
  onCityChange?: (city: string) => void;
  onSearchChange?: (term: string) => void;
  selectedCity?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onCityChange, onSearchChange, selectedCity = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, displayName, openAuth, logout } = useAuth();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const authControl = user ? (
    <div className="flex items-center space-x-3">
      <Link
        href="/saved"
        onClick={() => setMobileOpen(false)}
        className="relative inline-flex items-center px-3 py-2 text-sm font-bold text-slate-700 hover:text-rose-600 transition"
      >
        <Heart className="w-4 h-4 mr-1.5 text-rose-500" /> Saved
      </Link>
      <button
        onClick={logout}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-rose-600 transition"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>
      <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full pl-1 pr-3 py-1" title={user.email}>
        <span className="w-7 h-7 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center">
          {(displayName || 'U').slice(0, 1).toUpperCase()}
        </span>
        <span className="text-xs font-bold text-slate-700 max-w-[80px] truncate">{displayName}</span>
      </div>
    </div>
  ) : (
    <button
      onClick={() => openAuth()}
      className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold text-white bg-slate-900 hover:bg-rose-600 transition"
    >
      <UserCircle2 className="w-4 h-4 mr-2 text-amber-400" /> Login / Sign Up
    </button>
  );

  const navLinks = (
    <>
      <Link href="/" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-rose-600 transition flex items-center">
        Browse Cars
      </Link>
      <Link href="/sell" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-rose-600 transition flex items-center">
        <PlusCircle className="w-4 h-4 mr-1.5 text-rose-600" /> Add / Sell Car
      </Link>
      <Link href="/sell/my-listings" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-rose-600 transition flex items-center">
        <UserCircle2 className="w-4 h-4 mr-1.5 text-slate-600" /> My Listings
      </Link>
      <Link href="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-amber-600 transition flex items-center">
        <LayoutDashboard className="w-4 h-4 mr-1.5 text-amber-500" /> Admin Hub
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Banner with Official Numbers */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5" /> 200-Point Inspection</span>
          <span className="hidden md:flex items-center"><RotateCcw className="w-3.5 h-3.5 text-amber-400 mr-1.5" /> Quality • Trust • Great Deals</span>
          <span className="hidden lg:flex items-center"><Truck className="w-3.5 h-3.5 text-sky-400 mr-1.5" /> Free Home Test Drive</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 text-slate-300">
            <a href="tel:8050966025" className="hover:text-amber-400 transition flex items-center">
              <Phone className="w-3 h-3 mr-1 text-amber-400" /> <strong className="text-white">8050966025</strong>
            </a>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <a href="tel:8310166040" className="hover:text-amber-400 transition hidden sm:flex items-center">
              <strong className="text-slate-200">8310166040</strong>
            </a>
            <a
              href="https://wa.me/918050966025?text=Hello%20Value%20Cars,%20I%20am%20interested%20in%20buying/viewing%20a%20car"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold ml-2"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a
              href="https://maps.google.com/?q=Near+Bangalore+university,+Kengunte,+Mallathahalli,+Bengaluru,+Karnataka+560056"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold ml-2"
              title="Near Bangalore university, Kengunte, Mallathahalli, Bengaluru, Karnataka 560056"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-400" /> Mallathahalli (Location)
            </a>
          </div>
          <Link href="/admin" className="text-amber-400 hover:text-amber-300 font-semibold flex items-center border-l border-slate-700 pl-3">
            <LayoutDashboard className="w-3 h-3 mr-1" /> Admin Hub
          </Link>
        </div>
      </div>

      {/* Main Nav with Logo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-5">
          <Link href="/" className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-2xl bg-black border border-amber-500/20 overflow-hidden flex items-center justify-center p-0.5 shadow-md shadow-slate-900/10 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="./logo-dark.jpeg"
                alt="Value Cars"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = './logo-light.jpeg';
                }}
              />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-950">
                VALUE<span className="text-amber-500">CARS</span>
              </span>
              <span className="block text-[9px] uppercase font-black tracking-widest text-slate-500 -mt-1">
                Pre-Owned Vehicles
              </span>
            </div>
          </Link>

          {/* City Selector */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700">
            <MapPin className="w-4 h-4 text-rose-600 mr-1.5" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange && onCityChange(e.target.value)}
              aria-label="Filter cars by city"
              className="bg-transparent border-none outline-none cursor-pointer text-sm font-bold text-slate-800"
            >
              <option value="">All Cities (India)</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Pune">Pune</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Jaipur">Jaipur</option>
              <option value="Chandigarh">Chandigarh</option>
              <option value="Kochi">Kochi</option>
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-md mx-6 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search make, model (e.g. Creta, Thar, Swift)..."
            className="w-full bg-slate-100 border border-transparent focus:border-rose-500 focus:bg-white pl-10 pr-4 py-2.5 rounded-full text-sm outline-none transition"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        </div>

        {/* Action Links (desktop) */}
        <div className="hidden md:flex items-center space-x-3">
          {navLinks}
          {authControl}
          <Link
            href="/sell"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold text-white bg-slate-900 hover:bg-rose-600 shadow-md transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4 mr-2 text-amber-400" />
            + List Your Car
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg">
          <div className="relative mb-2 lg:hidden">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search cars..."
              className="w-full bg-slate-100 border border-transparent focus:border-rose-500 focus:bg-white pl-10 pr-4 py-2.5 rounded-full text-sm outline-none transition"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          </div>
          {navLinks}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            {user ? (
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-rose-600 text-white text-sm font-black flex items-center justify-center">
                    {(displayName || 'U').slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{displayName}</p>
                    <Link
                      href="/saved"
                      onClick={() => setMobileOpen(false)}
                      className="text-xs font-bold text-rose-600 flex items-center gap-1"
                    >
                      <Heart className="w-3 h-3" /> Saved cars
                    </Link>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { openAuth(); setMobileOpen(false); }}
                className="w-full text-center px-4 py-2.5 rounded-full text-sm font-bold text-white bg-slate-900 hover:bg-rose-600 transition"
              >
                Login / Sign Up
              </button>
            )}

            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span>Hotline 1:</span>
                <a href="tel:8050966025" className="font-bold text-slate-900">+91 80509 66025</a>
              </div>
              <div className="flex items-center justify-between">
                <span>Hotline 2:</span>
                <a href="tel:8310166040" className="font-bold text-slate-900">+91 83101 66040</a>
              </div>
            </div>

            <Link
              href="/sell"
              onClick={() => setMobileOpen(false)}
              className="block text-center px-4 py-2.5 rounded-full text-sm font-bold text-white bg-slate-900 hover:bg-rose-600 transition"
            >
              + List Your Car
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
