'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, ExternalLink } from 'lucide-react';
import { Car } from '../types/car';

const STORAGE_KEY = 'valuecars:recent';
const MAX_ITEMS = 6;

/** Persist a viewed car id (deduped, most-recent-first). */
export function rememberRecentCar(carId: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = readRecentCarIds();
    const next = [carId, ...list.filter((id) => id !== carId)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function readRecentCarIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

interface RecentCarsProps {
  cars: Car[];
}

/**
 * Shows the last few cars the user viewed, filtered against the currently
 * loaded inventory so unavailable/reserved cars aren't shown.
 */
export const RecentCars: React.FC<RecentCarsProps> = ({ cars }) => {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readRecentCarIds());
  }, []);

  if (ids.length === 0) return null;

  const byId = new Map(cars.map((c) => [c.id, c]));
  // Preserve viewed order, drop anything not in the current dataset.
  const recent = ids.map((id) => byId.get(id)).filter((c): c is Car => Boolean(c));

  if (recent.length === 0) return null;

  return (
    <section className="mt-12" aria-label="Recently viewed cars">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-rose-600" />
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Recently Viewed</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {recent.map((car) => {
          const cover =
            car.images?.find((img) => img.is_cover)?.image_url ||
            car.images?.[0]?.image_url ||
            'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=70';
          return (
            <Link
              key={car.id}
              href={`/cars?id=${car.id}`}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt={car.title}
                className="h-24 w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-3">
                <p className="text-xs font-bold text-slate-900 line-clamp-1">
                  {car.year} {car.make} {car.model}
                </p>
                <p className="text-sm font-black text-rose-600 mt-0.5">
                  ₹{(car.price / 100000).toFixed(2)} Lakh
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-1">
                  <ExternalLink className="w-3 h-3" /> View
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};