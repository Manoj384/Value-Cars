'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, RotateCcw, Truck, Car as CarIcon, PlusCircle, LayoutDashboard, Search, MapPin, Phone, Menu, X, UserCircle2 } from 'lucide-react';

interface NavbarProps {
  onCityChange?: (city: string) => void;
  onSearchChange?: (term: string) => void;
  selectedCity?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onCityChange, onSearchChange, selectedCity = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const navLinks = (
    <>
      <Link href="/" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-rose-600 transition flex items-center">
        <CarIcon className="w-4 h-4 mr-1.5" /> Browse Cars
      </Link>
      <Link href="/sell" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-rose-600 transition flex items-center">
        <PlusCircle className="w-4 h-4 mr-1.5" /> Add / Sell Car
      </Link>
      <Link href="/sell/my-listings" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-rose-600 transition flex items-center">
        <UserCircle2 className="w-4 h-4 mr-1.5" /> My Listings
      </Link>
      <Link href="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-amber-600 transition flex items-center">
        <LayoutDashboard className="w-4 h-4 mr-1.5" /> Admin Hub
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5" /> 200-Point Inspection Guaranteed</span>
          <span className="hidden md:flex items-center"><RotateCcw className="w-3.5 h-3.5 text-amber-400 mr-1.5" /> 5-Day Money Back Guarantee</span>
          <span className="hidden lg:flex items-center"><Truck className="w-3.5 h-3.5 text-sky-400 mr-1.5" /> Free Home Test Drive</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-400 hidden sm:flex items-center"><Phone className="w-3 h-3 mr-1" /> Support: <strong className="text-white ml-1">1800-200-VALUE</strong></span>
          <Link href="/admin" className="text-amber-400 hover:text-amber-300 font-semibold flex items-center">
            <LayoutDashboard className="w-3 h-3 mr-1" /> Admin Hub
          </Link>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white text-xl font-black shadow-md shadow-rose-500/30">
              <CarIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900">VALUE<span className="text-rose-600">CARS</span></span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">Certified Marketplace</span>
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
        <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by Make, Model (e.g. Creta, Thar, Swift)..."
            className="w-full bg-slate-100 border border-transparent focus:border-rose-500 focus:bg-white pl-10 pr-4 py-2.5 rounded-full text-sm outline-none transition"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        </div>

        {/* Action Links (desktop) */}
        <div className="hidden md:flex items-center space-x-3">
          {navLinks}
          <Link
            href="/sell"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            + Add / Sell Car
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
          <Link
            href="/sell"
            onClick={() => setMobileOpen(false)}
            className="block mt-2 text-center px-4 py-2.5 rounded-full text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
          >
            + Add / Sell Car
          </Link>
        </div>
      )}
    </header>
  );
};
