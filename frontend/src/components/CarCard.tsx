'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Gauge, Fuel, Cog, MapPin, Calendar } from 'lucide-react';
import { Car } from '../types/car';

interface CarCardProps {
  car: Car;
  onBookTestDrive: (car: Car) => void;
  onReserve: (car: Car) => void;
}

export const CarCard: React.FC<CarCardProps> = ({ car, onBookTestDrive, onReserve }) => {
  const coverImage = car.images?.find((img) => img.is_cover)?.image_url ||
    car.images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';

  const formatPriceLakhs = (price: number) => {
    return (price / 100000).toFixed(2);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Image Container */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={car.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Certified Badge */}
        {car.is_spinny_certified && (
          <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> VALUE CERTIFIED
          </div>
        )}

        {/* Inspection Score Badge */}
        <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md text-white text-xs font-black px-2.5 py-1 rounded-lg border border-slate-700 flex items-center">
          <span className="text-emerald-400 mr-1">★</span> {car.inspection_score.toFixed(1)}/10
        </div>

        {/* City Tag */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center">
          <MapPin className="w-2.5 h-2.5 mr-1 text-rose-400" /> {car.city}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <Link href={`/cars/${car.id}`} className="block">
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-rose-600 transition line-clamp-1">
              {car.year} {car.make} {car.model}
            </h3>
            <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">{car.variant}</p>
          </Link>

          {/* Key Specs Pills */}
          <div className="grid grid-cols-3 gap-2 my-4 bg-slate-50 p-2.5 rounded-xl text-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center">
                <Gauge className="w-2.5 h-2.5 mr-0.5" /> Driven
              </span>
              <span className="text-xs font-black text-slate-700">{(car.kilometers_driven / 1000).toFixed(0)}k km</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center">
                <Fuel className="w-2.5 h-2.5 mr-0.5" /> Fuel
              </span>
              <span className="text-xs font-black text-slate-700">{car.fuel_type}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center">
                <Cog className="w-2.5 h-2.5 mr-0.5" /> Gear
              </span>
              <span className="text-xs font-black text-slate-700">{car.transmission.slice(0, 4)}</span>
            </div>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xl font-black text-slate-900">₹{formatPriceLakhs(car.price)} <span className="text-xs font-bold text-slate-400">Lakh</span></span>
            {car.original_price && (
              <span className="block text-[11px] text-slate-400 line-through">₹{formatPriceLakhs(car.original_price)} L</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onBookTestDrive(car)}
              className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
            >
              Test Drive
            </button>
            <button
              onClick={() => onReserve(car)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-rose-600 rounded-lg transition shadow-sm"
            >
              Reserve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
