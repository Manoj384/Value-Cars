'use client';

import React from 'react';
import { Layers } from 'lucide-react';

interface BrandGridProps {
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
}

interface BrandItem {
  name: string;
  displayName: string;
  shortCode: string;
  bgGradient: string;
  textColor: string;
}

const BRANDS: BrandItem[] = [
  {
    name: 'Maruti',
    displayName: 'Maruti Suzuki',
    shortCode: 'MS',
    bgGradient: 'from-blue-600 to-indigo-700',
    textColor: 'text-white',
  },
  {
    name: 'Hyundai',
    displayName: 'Hyundai',
    shortCode: 'HY',
    bgGradient: 'from-sky-700 to-blue-900',
    textColor: 'text-white',
  },
  {
    name: 'Tata',
    displayName: 'Tata',
    shortCode: 'TATA',
    bgGradient: 'from-blue-800 to-slate-900',
    textColor: 'text-white',
  },
  {
    name: 'Mahindra',
    displayName: 'Mahindra',
    shortCode: 'M&M',
    bgGradient: 'from-red-600 to-rose-800',
    textColor: 'text-white',
  },
  {
    name: 'Toyota',
    displayName: 'Toyota',
    shortCode: 'TY',
    bgGradient: 'from-red-700 to-red-900',
    textColor: 'text-white',
  },
  {
    name: 'Kia',
    displayName: 'Kia',
    shortCode: 'KIA',
    bgGradient: 'from-black to-slate-800',
    textColor: 'text-white',
  },
  {
    name: 'Honda',
    displayName: 'Honda',
    shortCode: 'H',
    bgGradient: 'from-slate-800 to-slate-950',
    textColor: 'text-white',
  },
  {
    name: 'Skoda',
    displayName: 'Skoda',
    shortCode: 'SK',
    bgGradient: 'from-emerald-700 to-teal-900',
    textColor: 'text-white',
  },
  {
    name: 'Volkswagen',
    displayName: 'Volkswagen',
    shortCode: 'VW',
    bgGradient: 'from-blue-900 to-slate-900',
    textColor: 'text-white',
  },
  {
    name: 'Nissan',
    displayName: 'Nissan',
    shortCode: 'NIS',
    bgGradient: 'from-red-800 to-zinc-900',
    textColor: 'text-white',
  },
  {
    name: 'Renault',
    displayName: 'Renault',
    shortCode: 'RN',
    bgGradient: 'from-amber-600 to-yellow-800',
    textColor: 'text-white',
  },
];

export const BrandGrid: React.FC<BrandGridProps> = ({ selectedBrand, onSelectBrand }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Select Your Car Brand</h2>
          <p className="text-xs text-slate-500">Instant access to certified inventory by top manufacturers</p>
        </div>
        {selectedBrand && (
          <button
            onClick={() => onSelectBrand('')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full transition"
          >
            Clear Brand Filter ({selectedBrand})
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
        {BRANDS.map((b) => {
          const isSelected = selectedBrand.toLowerCase() === b.name.toLowerCase();
          return (
            <button
              key={b.name}
              onClick={() => onSelectBrand(isSelected ? '' : b.name)}
              className={`brand-card flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-600 ring-opacity-50'
                  : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${b.bgGradient} flex items-center justify-center shadow-sm mb-1.5`}>
                <span className={`text-[10px] font-black tracking-tight ${b.textColor}`}>
                  {b.shortCode}
                </span>
              </div>
              <span className={`text-[11px] font-bold text-center truncate w-full ${isSelected ? 'text-rose-700 font-extrabold' : 'text-slate-700'}`}>
                {b.displayName}
              </span>
            </button>
          );
        })}

        {/* View All Brands / Reset Tile */}
        <button
          onClick={() => onSelectBrand('')}
          className={`brand-card flex flex-col items-center justify-center p-3 rounded-xl border border-dashed transition-all cursor-pointer ${
            !selectedBrand
              ? 'border-rose-400 bg-rose-50/70 shadow-sm'
              : 'border-slate-300 bg-slate-50 hover:bg-white'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center mb-1.5 text-rose-600">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 text-center truncate w-full">
            All Brands
          </span>
        </button>
      </div>
    </div>
  );
};
