'use client';

import React from 'react';
import { X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { CarFilterOptions } from '../services/api';

interface MobileFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: CarFilterOptions;
  onFilterChange: (newFilters: Partial<CarFilterOptions>) => void;
  onReset: () => void;
}

const chip = (active: boolean) =>
  active ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-600';

/**
 * Full-height bottom sheet with the essential filters, optimised for
 * touch on small screens. Rendered only on mobile widths.
 */
export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  open,
  onClose,
  filters,
  onFilterChange,
  onReset,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 max-h-[88vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-black text-slate-900">Filters</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {/* Budget */}
          <div>
            <div className="flex justify-between mb-2">
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
              aria-label="Max Budget"
              className="w-full accent-rose-600"
            />
          </div>

          {/* Fuel */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Fuel Type</label>
            <div className="flex flex-wrap gap-2">
              {[
                ['', 'Any'],
                ['PETROL', 'Petrol'],
                ['DIESEL', 'Diesel'],
                ['CNG', 'CNG'],
                ['ELECTRIC', 'Electric'],
              ].map(([key, label]) => (
                <button
                  key={key || 'any'}
                  onClick={() => onFilterChange({ fuel_type: key || undefined })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${chip(
                    filters.fuel_type === key
                  )}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Transmission */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Transmission</label>
            <div className="flex flex-wrap gap-2">
              {[
                ['', 'Any'],
                ['MANUAL', 'Manual'],
                ['AUTOMATIC', 'Automatic'],
              ].map(([key, label]) => (
                <button
                  key={key || 'any'}
                  onClick={() => onFilterChange({ transmission: key || undefined })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${chip(
                    filters.transmission === key
                  )}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Body type */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Body Type</label>
            <div className="flex flex-wrap gap-2">
              {[
                ['', 'All'],
                ['SUV', 'SUV'],
                ['SEDAN', 'Sedan'],
                ['HATCHBACK', 'Hatch'],
                ['LUXURY', 'Luxury'],
              ].map(([key, label]) => (
                <button
                  key={key || 'all'}
                  onClick={() => onFilterChange({ body_type: key || undefined })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${chip(
                    filters.body_type === key
                  )}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Min inspection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Min Inspection Rating</label>
            <div className="flex flex-wrap gap-2">
              {[0, 8.5, 9.0].map((score) => (
                <button
                  key={score}
                  onClick={() => onFilterChange({ min_score: score || undefined })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${chip(
                    (filters.min_score || 0) === score
                  )}`}
                >
                  {score === 0 ? 'Any' : `✦ ${score}+`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={onClose}
            className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
};