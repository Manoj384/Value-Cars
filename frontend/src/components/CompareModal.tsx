'use client';

import React from 'react';
import Link from 'next/link';
import { X, ShieldCheck, Check, Trash2, Fuel, Cog, Gauge, Calendar, MapPin, Sparkles } from 'lucide-react';
import { Car } from '../types/car';
import { resolveMediaUrl } from '../services/api';

interface CompareModalProps {
  cars: Car[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveCar: (carId: string) => void;
  onClearAll: () => void;
  onBookTestDrive: (car: Car) => void;
  onReserve: (car: Car) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  cars,
  isOpen,
  onClose,
  onRemoveCar,
  onClearAll,
  onBookTestDrive,
  onReserve,
}) => {
  if (!isOpen || cars.length === 0) return null;

  const formatPriceLakhs = (price: number) => (price / 100000).toFixed(2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Compare Cars Side-by-Side
              </h2>
              <p className="text-xs text-slate-500">
                Evaluating {cars.length} verified vehicle{cars.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClearAll}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition"
              aria-label="Close compare modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comparison Table / Grid Body */}
        <div className="p-6 overflow-y-auto overflow-x-auto flex-1">
          <div className={`grid ${cars.length === 1 ? 'grid-cols-1' : cars.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'} gap-4 min-w-[320px] sm:min-w-[600px]`}>
            {cars.map((car) => {
              const coverImg = resolveMediaUrl(
                car.images?.find((i) => i.is_cover)?.image_url ||
                car.images?.[0]?.image_url ||
                'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
              );

              return (
                <div
                  key={car.id}
                  className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between relative shadow-sm hover:shadow-md transition"
                >
                  <button
                    onClick={() => onRemoveCar(car.id)}
                    className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 text-slate-400 hover:text-rose-600 shadow-sm flex items-center justify-center transition"
                    title="Remove from comparison"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Top: Image & Title */}
                  <div>
                    <div className="relative h-36 rounded-xl overflow-hidden bg-slate-200 mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImg}
                        alt={car.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs flex items-center">
                        <MapPin className="w-2.5 h-2.5 mr-1 text-rose-400" /> {car.city}
                      </div>
                    </div>

                    <Link href={`/cars?id=${car.id}`} className="block group">
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-rose-600 line-clamp-1">
                        {car.year} {car.make} {car.model}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">{car.variant}</p>
                    </Link>

                    <div className="mt-2 mb-4">
                      <span className="text-xl font-black text-slate-900">
                        ₹{formatPriceLakhs(car.price)}{' '}
                        <span className="text-xs font-bold text-slate-500">Lakh</span>
                      </span>
                    </div>

                    {/* Comparison Specifications Table */}
                    <div className="space-y-2 text-xs border-t border-slate-200/80 pt-3">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" /> Kilometers
                        </span>
                        <span className="font-bold text-slate-800">
                          {car.kilometers_driven.toLocaleString()} km
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Fuel className="w-3.5 h-3.5 text-slate-400" /> Fuel Type
                        </span>
                        <span className="font-bold text-slate-800">{car.fuel_type}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Cog className="w-3.5 h-3.5 text-slate-400" /> Transmission
                        </span>
                        <span className="font-bold text-slate-800">{car.transmission}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Year
                        </span>
                        <span className="font-bold text-slate-800">{car.year}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Ownership</span>
                        <span className="font-bold text-slate-800">{car.ownership} Owner</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Body Type</span>
                        <span className="font-bold text-slate-800">{car.body_type}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Inspection Score</span>
                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          ★ {car.inspection_score.toFixed(1)}/10
                        </span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 font-medium">Warranty</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {car.warranty_months || 12} Mos Warranty
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-200 flex gap-2">
                    <button
                      onClick={() => onBookTestDrive(car)}
                      className="flex-1 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition text-center"
                    >
                      Test Drive
                    </button>
                    <button
                      onClick={() => onReserve(car)}
                      className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-rose-600 rounded-xl transition text-center shadow-sm"
                    >
                      Reserve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
