'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { CarCard } from '../../components/CarCard';
import { apiClient } from '../../services/api';
import { Car } from '../../types/car';
import { setFavorites } from '../../services/favoritesStore';
import { useAuth } from '../../context/auth';
import { Heart, Loader2 } from 'lucide-react';
import { track } from '../../lib/activity';

export default function SavedPage() {
  const { user, openAuth, isLoading: authLoading } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    track('saved', 'view');
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setCars([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const items = await apiClient.listFavorites();
        if (cancelled) return;
        setCars(items);
        setFavorites(items.map((c) => c.id));
      } catch {
        if (!cancelled) setCars([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-600 fill-current" /> Your Saved Cars
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cars you&apos;ve saved can be revisited here anytime.</p>
        </header>

        {!authLoading && !user && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Sign in to see your saved cars</h2>
            <p className="text-sm text-slate-500 mt-2">
              Login with your verified email to view the cars you&apos;ve saved for later.
            </p>
            <button
              onClick={() => openAuth()}
              className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-rose-600 text-white font-bold rounded-xl transition"
            >
              Login / Sign Up
            </button>
          </div>
        )}

        {user && loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-600">Loading your saved cars...</p>
          </div>
        )}

        {user && !loading && cars.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">No saved cars yet</h2>
            <p className="text-sm text-slate-500 mt-2">
              Tap the heart on any car to save it here for quick access later.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block px-6 py-2.5 bg-slate-900 hover:bg-rose-600 text-white font-bold rounded-xl transition"
            >
              Browse Cars
            </Link>
          </div>
        )}

        {user && !loading && cars.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} onBookTestDrive={() => {}} onReserve={() => {}} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}