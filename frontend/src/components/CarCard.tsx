'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ShieldCheck, Gauge, Fuel, Cog, MapPin, Heart, Share2, Scale, Sparkles, MessageCircle } from 'lucide-react';
import { Car } from '../types/car';
import { useAuth } from '../context/auth';
import { subscribe, getSnapshot, getServerSnapshot, toggleFavorite } from '../services/favoritesStore';
import {
  subscribeCompare,
  getCompareSnapshot,
  getCompareServerSnapshot,
  toggleCompareCar,
} from '../services/compareStore';
import { resolveMediaUrl } from '../services/api';

interface CarCardProps {
  car: Car;
  isAdmin?: boolean;
  onBookTestDrive: (car: Car) => void;
  onReserve: (car: Car) => void;
  onEditCar?: (car: Car) => void;
  onMarkSold?: (car: Car) => void;
  onDeleteCar?: (car: Car) => void;
}

export const CarCard: React.FC<CarCardProps> = ({
  car,
  isAdmin = false,
  onBookTestDrive,
  onReserve,
  onEditCar,
  onMarkSold,
  onDeleteCar,
}) => {
  const { openAuth } = useAuth();
  const favoriteIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isFav = favoriteIds.has(car.id);
  const isSold = car.status === 'SOLD';

  const compareList = useSyncExternalStore(
    subscribeCompare,
    getCompareSnapshot,
    getCompareServerSnapshot
  );
  const isCompared = compareList.some((c) => c.id === car.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleFavorite(car.id);
    } catch (err) {
      openAuth();
    }
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompareCar(car);
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/cars?id=${car.id}` : '';
    const text = encodeURIComponent(
      `🚗 Check out this verified ${car.year} ${car.make} ${car.model} (${car.variant}) on Value Cars for ₹${(car.price / 100000).toFixed(2)} Lakh!\n${currentUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const coverImage = resolveMediaUrl(
    car.images?.find((img) => img.is_cover)?.image_url ||
    car.images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
  );

  const formatPriceLakhs = (price: number) => {
    return (price / 100000).toFixed(2);
  };

  // Smart Best Value calculation
  const savings = car.original_price && car.original_price > car.price ? car.original_price - car.price : 0;
  const isTopScore = car.inspection_score >= 9.2;
  const isBestValue = (savings >= 25000 || isTopScore) && !isSold;

  return (
    <div className={`bg-white rounded-2xl border ${isSold ? 'border-amber-300' : isCompared ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-200'} overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative`}>
      {/* Image Container */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={car.title}
          width={800}
          height={416}
          loading="lazy"
          fetchPriority="low"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isSold ? 'grayscale-[30%]' : ''}`}
        />

        {/* Sold Overlay Banner */}
        {isSold && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
            <span className="bg-rose-600 text-white font-black text-sm uppercase px-4 py-1.5 rounded-full shadow-xl tracking-widest border-2 border-white transform -rotate-6">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Certified Badge */}
        {car.is_spinny_certified && !isSold && (
          <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> VALUE CERTIFIED
          </div>
        )}

        {isSold && (
          <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center">
            ● SOLD SESSION
          </div>
        )}

        {/* Smart Best Deal Badge */}
        {isBestValue && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 animate-pulse">
            <Sparkles className="w-3 h-3" />
            <span>{savings >= 25000 ? `₹${(savings / 1000).toFixed(0)}k OFF` : '★ BEST VALUE'}</span>
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

        {/* Action icons: Share, Compare, Favorite */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {/* Compare Toggle */}
          <button
            onClick={handleToggleCompare}
            aria-label={isCompared ? 'Remove from compare' : 'Add to compare'}
            className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition shadow-md ${
              isCompared ? 'bg-rose-600 text-white' : 'bg-black/60 text-white hover:bg-slate-900'
            }`}
            title={isCompared ? 'Comparing' : 'Compare with other cars'}
          >
            <Scale className="w-4 h-4" />
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={handleWhatsAppShare}
            aria-label="Share on WhatsApp"
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-emerald-600 text-white backdrop-blur-md flex items-center justify-center transition shadow-md"
            title="Share on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Favorite Heart */}
          <button
            onClick={handleToggleFavorite}
            aria-label={isFav ? `Remove ${car.title} from saved` : `Save ${car.title}`}
            className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition shadow-md active:scale-90 ${
              isFav ? 'bg-rose-600 text-white' : 'bg-black/60 text-white hover:bg-rose-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <Link href={`/cars?id=${car.id}`} className="block">
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

        {/* Admin Action Bar if Admin */}
        {isAdmin && (
          <div className="mb-3 py-2 px-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-1 text-xs">
            <span className="font-bold text-amber-900 text-[11px]">Admin:</span>
            <div className="flex items-center gap-1.5">
              {onEditCar && (
                <button
                  onClick={() => onEditCar(car)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] transition"
                  title="Edit car details"
                >
                  Edit
                </button>
              )}
              {!isSold && onMarkSold && (
                <button
                  onClick={() => onMarkSold(car)}
                  className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition"
                  title="Mark as Sold"
                >
                  Sold
                </button>
              )}
              {onDeleteCar && (
                <button
                  onClick={() => onDeleteCar(car)}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition"
                  title="Delete car"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Price and CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xl font-black text-slate-900">₹{formatPriceLakhs(car.price)} <span className="text-xs font-bold text-slate-400">Lakh</span></span>
            {car.original_price && (
              <span className="block text-[11px] text-slate-400 line-through">₹{formatPriceLakhs(car.original_price)} L</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isSold ? (
              <>
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
              </>
            ) : (
              <span className="px-3 py-1.5 text-xs font-black text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
                SOLD OUT
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
