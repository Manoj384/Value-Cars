'use client';

import React, { useSyncExternalStore } from 'react';
import { Sparkles, X, ArrowRight, Layers } from 'lucide-react';
import {
  subscribeCompare,
  getCompareSnapshot,
  getCompareServerSnapshot,
  removeCompareCar,
  clearCompare,
} from '../services/compareStore';
import { resolveMediaUrl } from '../services/api';

interface CompareFloatingBarProps {
  onOpenCompare: () => void;
}

export const CompareFloatingBar: React.FC<CompareFloatingBarProps> = ({ onOpenCompare }) => {
  const compareList = useSyncExternalStore(
    subscribeCompare,
    getCompareSnapshot,
    getCompareServerSnapshot
  );

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] max-w-xl w-[92%] sm:w-auto bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 overflow-hidden">
          {compareList.map((car) => {
            const img = resolveMediaUrl(
              car.images?.find((i) => i.is_cover)?.image_url ||
              car.images?.[0]?.image_url ||
              ''
            );
            return (
              <div
                key={car.id}
                className="relative inline-block w-9 h-9 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800 shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={car.title} className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCompareCar(car.id);
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition"
                  title="Remove"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            );
          })}
        </div>

        <div>
          <p className="text-xs font-black text-white">
            Comparing ({compareList.length}/3 cars)
          </p>
          <p className="text-[10px] text-slate-400">Side-by-side specs</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={clearCompare}
          className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 transition"
        >
          Clear
        </button>
        <button
          onClick={onOpenCompare}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition transform active:scale-95"
        >
          <span>Compare Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
