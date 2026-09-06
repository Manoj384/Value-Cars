'use client';

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { CarFilterOptions } from '../services/api';

interface FilterSidebarProps {
  filters: CarFilterOptions;
  onFilterChange: (newFilters: Partial<CarFilterOptions>) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-rose-600" />
          <h3 className="font-black text-slate-900 text-sm">Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center transition"
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
        </button>
      </div>

      {/* Budget Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-slate-700">Max Budget</label>
          <span className="text-xs font-black text-rose-600">
            {filters.max_price ? `₹${(filters.max_price / 100000).toFixed(1)} Lakh` : 'Any'}
          </span>
        </div>
        <input
          type="range"
          min="300000"
          max="3500000"
          step="50000"
          value={filters.max_price || 3500000}
          onChange={(e) => onFilterChange({ max_price: Number(e.target.value) })}
          aria-label="Max Budget Range"
          className="w-full accent-rose-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
          <span>₹3L</span>
          <span>₹15L</span>
          <span>₹35L+</span>
        </div>
      </div>

      {/* Fuel Type */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-2">Fuel Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {['', 'PETROL', 'DIESEL', 'CNG', 'ELECTRIC'].map((fuel) => (
            <button
              key={fuel || 'ALL'}
              onClick={() => onFilterChange({ fuel_type: fuel || undefined })}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold text-center border transition ${
                (filters.fuel_type || '') === fuel
                  ? 'border-rose-600 bg-rose-50 text-rose-700'
                  : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
              }`}
            >
              {fuel || 'All Fuels'}
            </button>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-2">Transmission</label>
        <div className="grid grid-cols-2 gap-1.5">
          {['', 'MANUAL', 'AUTOMATIC'].map((trans) => (
            <button
              key={trans || 'ALL'}
              onClick={() => onFilterChange({ transmission: trans || undefined })}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold text-center border transition ${
                (filters.transmission || '') === trans
                  ? 'border-rose-600 bg-rose-50 text-rose-700'
                  : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
              }`}
            >
              {trans || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Body Type */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-2">Body Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {['', 'SUV', 'SEDAN', 'HATCHBACK', 'LUXURY'].map((body) => (
            <button
              key={body || 'ALL'}
              onClick={() => onFilterChange({ body_type: body || undefined })}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold text-center border transition ${
                (filters.body_type || '') === body
                  ? 'border-rose-600 bg-rose-50 text-rose-700'
                  : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
              }`}
            >
              {body || 'All Bodies'}
            </button>
          ))}
        </div>
      </div>

      {/* Min Inspection Rating */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-2">Min Inspection Rating</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 8.5, 9.0].map((score) => (
            <button
              key={score}
              onClick={() => onFilterChange({ min_score: score || undefined })}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center border transition ${
                (filters.min_score || 0) === score
                  ? 'border-rose-600 bg-rose-50 text-rose-700'
                  : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
              }`}
            >
              {score === 0 ? 'Any' : `★ ${score}+`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
