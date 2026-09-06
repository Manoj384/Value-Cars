'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { BrandGrid } from '../components/BrandGrid';
import { FilterSidebar } from '../components/FilterSidebar';
import { CarCard } from '../components/CarCard';
import { TestDriveModal } from '../components/TestDriveModal';
import { ReserveModal } from '../components/ReserveModal';
import { apiClient, CarFilterOptions } from '../services/api';
import { Car } from '../types/car';
import { ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

export default function HomePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<CarFilterOptions>({
    city: 'Bangalore',
    page: 1,
    page_size: 12,
  });

  const [selectedBrand, setSelectedBrand] = useState('');
  const [testDriveCar, setTestDriveCar] = useState<Car | null>(null);
  const [reserveCar, setReserveCar] = useState<Car | null>(null);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getCars({
        ...filters,
        make: selectedBrand || filters.make,
      });
      setCars(data.items);
      setTotalCount(data.total);
    } catch (err) {
      console.error('Error fetching cars:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedBrand]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleFilterChange = (newFilters: Partial<CarFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setFilters((prev) => ({ ...prev, make: brand || undefined, page: 1 }));
  };

  const handleResetFilters = () => {
    setSelectedBrand('');
    setFilters({ city: 'Bangalore', page: 1, page_size: 12 });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        selectedCity={filters.city}
        onCityChange={(city) => setFilters((prev) => ({ ...prev, city }))}
        onSearchChange={(model) => setFilters((prev) => ({ ...prev, model }))}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Hero Tagline */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1 text-xs font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Certified Pre-Owned Platform</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Find Your Perfect Quality Car
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Every car verified with a 200-point inspection, 1-year warranty, and fixed transparent pricing.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Showing <strong className="text-rose-600">{totalCount}</strong> Verified Cars</span>
          </div>
        </div>

        {/* 12-Brand Visual Selector */}
        <BrandGrid selectedBrand={selectedBrand} onSelectBrand={handleBrandSelect} />

        {/* Main Grid: Sidebar + Cars */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Cars Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin mb-3" />
                <p className="text-sm font-bold text-slate-600">Loading verified inventory...</p>
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">
                  🚗
                </div>
                <h3 className="text-xl font-black text-slate-900">No cars found</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  Try adjusting your budget slider, fuel type, or clear the active brand filter.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-rose-600 text-white font-bold rounded-xl transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    onBookTestDrive={(c) => setTestDriveCar(c)}
                    onReserve={(c) => setReserveCar(c)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <TestDriveModal car={testDriveCar} onClose={() => setTestDriveCar(null)} />
      <ReserveModal car={reserveCar} onClose={() => setReserveCar(null)} />
    </div>
  );
}
