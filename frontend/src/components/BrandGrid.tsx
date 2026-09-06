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
  logo: string;
}

const BRANDS: BrandItem[] = [
  {
    name: 'Maruti',
    displayName: 'Maruti Suzuki',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/maruti-suzuki.svg',
  },
  {
    name: 'Hyundai',
    displayName: 'Hyundai',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/hyundai.svg',
  },
  {
    name: 'Tata',
    displayName: 'Tata',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/tata.svg',
  },
  {
    name: 'Mahindra',
    displayName: 'Mahindra',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/mahindra.svg',
  },
  {
    name: 'Toyota',
    displayName: 'Toyota',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/toyota.svg',
  },
  {
    name: 'Kia',
    displayName: 'Kia',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/kia.svg',
  },
  {
    name: 'Honda',
    displayName: 'Honda',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/honda.svg',
  },
  {
    name: 'Skoda',
    displayName: 'Skoda',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/skoda.svg',
  },
  {
    name: 'Volkswagen',
    displayName: 'Volkswagen',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/volkswagen.svg',
  },
  {
    name: 'Nissan',
    displayName: 'Nissan',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/nissan.svg',
  },
  {
    name: 'Renault',
    displayName: 'Renault',
    logo: 'https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/renault.svg',
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
              <div className="w-10 h-10 flex items-center justify-center mb-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.logo}
                  alt={b.displayName}
                  className="max-h-8 max-w-8 object-contain"
                  onError={(e) => {
                    // Fallback to text initials if svg fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className={`text-[11px] font-bold text-center truncate w-full ${isSelected ? 'text-rose-700' : 'text-slate-700'}`}>
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
              ? 'border-rose-300 bg-rose-50/50'
              : 'border-slate-300 bg-slate-50 hover:bg-white'
          }`}
        >
          <div className="w-10 h-10 flex items-center justify-center mb-1.5 text-slate-500">
            <Layers className="w-6 h-6 text-rose-600" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 text-center truncate w-full">
            All Brands
          </span>
        </button>
      </div>
    </div>
  );
};
