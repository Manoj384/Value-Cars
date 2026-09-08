'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';

export interface SortOption {
  value: string;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'km_asc', label: 'Kilometers: Low to High' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'score_desc', label: 'Inspection Score' },
];

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

/**
 * Accessible, self-contained sort dropdown. Works with the existing
 * `sort_by` query param the backend already accepts.
 */
export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange, compact = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:border-rose-400 transition ${
          compact ? 'px-3 py-2' : 'px-4 py-2.5'
        }`}
      >
        <ArrowUpDown className="w-4 h-4 text-rose-600" />
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden">Sort</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-fade-in"
        >
          <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Sort results
          </p>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition ${
                opt.value === value
                  ? 'text-rose-700 bg-rose-50'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label}
              {opt.value === value && <Check className="w-4 h-4 text-rose-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};