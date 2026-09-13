'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { BrandGrid } from '../components/BrandGrid';
import { FilterSidebar } from '../components/FilterSidebar';
import { CarCard } from '../components/CarCard';
import { TestDriveModal } from '../components/TestDriveModal';
import { ReserveModal } from '../components/ReserveModal';
import { EditCarModal } from '../components/EditCarModal';
import { MobileFilterDrawer } from '../components/MobileFilterDrawer';
import { CompareFloatingBar } from '../components/CompareFloatingBar';
import { CompareModal } from '../components/CompareModal';
import {
  subscribeCompare,
  getCompareSnapshot,
  getCompareServerSnapshot,
  removeCompareCar,
  clearCompare,
} from '../services/compareStore';
import { apiClient, CarFilterOptions, isAdminAuthed } from '../services/api';
import { Car } from '../types/car';
import { useAuth } from '../context/auth';
import { track } from '../lib/activity';
import { reportError } from '../lib/errorReporting';
import { loadFilters, saveFilters, getRecentCars, RecentCar } from '../lib/uiState';
import { ShieldCheck, Sparkles, Loader2, SlidersHorizontal, CheckCircle2, Tag, X } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

const BRAND_DISPLAY_MAP: Record<string, string> = {
  maruti: 'Maruti Suzuki',
  hyundai: 'Hyundai',
  tata: 'Tata',
  mahindra: 'Mahindra',
  toyota: 'Toyota',
  kia: 'Kia',
  honda: 'Honda',
  skoda: 'Skoda',
  volkswagen: 'Volkswagen',
  nissan: 'Nissan',
  renault: 'Renault',
  bmw: 'BMW',
  mercedes: 'Mercedes-Benz',
  audi: 'Audi',
  mg: 'MG',
};

function getBrandDisplayName(brandKey: string): string {
  if (!brandKey) return '';
  return BRAND_DISPLAY_MAP[brandKey.toLowerCase()] || brandKey;
}

export default function HomePage() {
  const { user } = useAuth();
  const [isAdminState, setIsAdminState] = useState(false);

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'SOLD'>('PUBLISHED');
  const [filters, setFilters] = useState<CarFilterOptions>(() => ({
    city: '',
    page: 1,
    page_size: 12,
    ...loadFilters(),
  }));
  const [recentCars, setRecentCars] = useState<RecentCar[]>(() => getRecentCars());

  const [selectedBrand, setSelectedBrand] = useState('');
  const [testDriveCar, setTestDriveCar] = useState<Car | null>(null);
  const [reserveCar, setReserveCar] = useState<Car | null>(null);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const compareList = React.useSyncExternalStore(
    subscribeCompare,
    getCompareSnapshot,
    getCompareServerSnapshot
  );

  // Sync admin state
  useEffect(() => {
    const isAuthedAdmin = !!(user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN')) || isAdminAuthed();
    setIsAdminState(isAuthedAdmin);
  }, [user]);

  // Check URL parameters for initial status or brand
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get('status');
      if (statusParam === 'SOLD') {
        setStatusFilter('SOLD');
      }
      const brandParam = params.get('brand') || params.get('make');
      if (brandParam) {
        setSelectedBrand(brandParam);
      }
    }
  }, []);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getCars({
        ...filters,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        make: selectedBrand || filters.make,
      });
      setCars(data.items);
      setTotalCount(data.total);
      setTotalPages(data.pages || 1);
    } catch (err) {
      reportError(err, { action: 'fetchCars' });
    } finally {
      setLoading(false);
    }
  }, [filters, selectedBrand, statusFilter]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  // Activity: record each marketplace visit once per page load.
  useEffect(() => {
    track('home', 'view');
  }, []);

  // Persist the active marketplace filters across sessions.
  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<CarFilterOptions>) => {
    track('home', 'filter_change', newFilters);
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleBrandSelect = (brand: string) => {
    track('home', 'brand_select', { brand: brand || 'all' });
    setSelectedBrand(brand);
    setFilters((prev) => ({ ...prev, make: brand || undefined, page: 1 }));
    if (brand && typeof document !== 'undefined') {
      setTimeout(() => {
        const target = document.getElementById('cars-catalog');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleResetFilters = () => {
    track('home', 'reset_filters');
    setSelectedBrand('');
    setStatusFilter('PUBLISHED');
    setFilters({ city: '', page: 1, page_size: 12 });
  };

  const handleSoldSectionSelect = () => {
    setStatusFilter('SOLD');
    setFilters((prev) => ({ ...prev, page: 1 }));
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const target = document.getElementById('cars-catalog');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleMarkSoldCar = async (car: Car) => {
    if (!window.confirm(`Mark ${car.title} as SOLD? It will move to the Sold Cars session.`)) return;
    try {
      await apiClient.markCarSold(car.id, true);
      fetchCars();
    } catch (err: any) {
      alert(err?.message || 'Failed to mark vehicle as sold');
    }
  };

  const handleDeleteCar = async (car: Car) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${car.title}"?`)) return;
    try {
      await apiClient.deleteCarManaged(car.id);
      fetchCars();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete vehicle');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar
        selectedCity={filters.city}
        initialSearch={filters.model || ''}
        onCityChange={(city) => setFilters((prev) => ({ ...prev, city, page: 1 }))}
        onSearchChange={(model) => setFilters((prev) => ({ ...prev, model, page: 1 }))}
        onOpenFilters={() => setMobileFiltersOpen(true)}
        onSelectSoldSection={handleSoldSectionSelect}
        activeStatus={statusFilter}
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Showing <strong className="text-rose-600">{totalCount}</strong> Verified Cars</span>
            </div>
            <select
              value={filters.sort_by || 'created_at'}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort_by: e.target.value, page: 1 }))}
              aria-label="Sort cars"
              className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-rose-500 shadow-sm cursor-pointer"
            >
              <option value="created_at">Sort: Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="year_desc">Year: Newest</option>
              <option value="km_asc">KM: Lowest</option>
              <option value="score_desc">Inspection Score</option>
            </select>
          </div>
        </div>

        {/* 12-Brand Visual Selector */}
        <BrandGrid selectedBrand={selectedBrand} onSelectBrand={handleBrandSelect} />

        {/* Recently Viewed (persisted client-side) */}
        {recentCars.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Recently Viewed
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {recentCars.slice(0, 6).map((rc) => (
                <Link
                  href={`/cars?id=${rc.id}`}
                  key={rc.id}
                  onClick={() => track('home', 'recent_click', { carId: rc.id })}
                  className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition"
                >
                  <div className="relative h-24 bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rc.image}
                      alt={rc.title}
                      width={320}
                      height={160}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-bold text-slate-700 line-clamp-1">
                      {rc.year} {rc.make} {rc.model}
                    </p>
                    <p className="text-[11px] font-black text-rose-600">
                      ₹{(rc.price / 100000).toFixed(2)} Lakh
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Catalog Section with Dynamic Brand Heading & Status Tabs */}
        <div id="cars-catalog" className="scroll-mt-28 mb-6 pt-2">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                {selectedBrand && (
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shadow-sm">
                    <BrandLogo brand={selectedBrand} className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {selectedBrand
                      ? `${getBrandDisplayName(selectedBrand)} Certified Cars`
                      : statusFilter === 'SOLD'
                      ? 'Sold Cars Session'
                      : 'All Available Inventory'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedBrand
                      ? `Showing ${totalCount} inspected ${getBrandDisplayName(selectedBrand)} vehicles ready for immediate delivery`
                      : statusFilter === 'SOLD'
                      ? `Browsing ${totalCount} vehicles successfully delivered to happy owners`
                      : `Showing ${totalCount} quality verified cars available right now`}
                  </p>
                </div>
                {selectedBrand && (
                  <button
                    onClick={() => handleBrandSelect('')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full transition ml-1"
                    title="View all brands"
                  >
                    All Brands <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Inventory Status Switcher (Available vs Sold vs All) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
              <button
                onClick={() => {
                  setStatusFilter('PUBLISHED');
                  setFilters((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  statusFilter === 'PUBLISHED'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${statusFilter === 'PUBLISHED' ? 'text-emerald-500' : 'text-slate-400'}`} />
                Available Cars
              </button>
              <button
                onClick={() => {
                  setStatusFilter('SOLD');
                  setFilters((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  statusFilter === 'SOLD'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className={`w-3.5 h-3.5 ${statusFilter === 'SOLD' ? 'text-rose-600' : 'text-slate-400'}`} />
                Sold Cars Session
              </button>
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setFilters((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Sidebar + Cars */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar (Desktop Only - Mobile filters reside inside 3-line hamburger menu) */}
          <div className="hidden lg:block lg:col-span-1">
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
                <h3 className="text-xl font-black text-slate-900">
                  {statusFilter === 'SOLD' ? 'No sold cars found' : 'No cars found'}
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  {selectedBrand
                    ? `No matching ${getBrandDisplayName(selectedBrand)} cars with current filters. Try resetting filters.`
                    : 'Try adjusting your budget slider, fuel type, or clear the active brand filter.'}
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
                    isAdmin={isAdminState}
                    onBookTestDrive={(c) => setTestDriveCar(c)}
                    onReserve={(c) => setReserveCar(c)}
                    onEditCar={(c) => setEditingCar(c)}
                    onMarkSold={handleMarkSoldCar}
                    onDeleteCar={handleDeleteCar}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && cars.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                  disabled={(filters.page || 1) <= 1}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>
                <span className="text-sm font-bold text-slate-600">
                  Page {filters.page || 1} of {totalPages}
                </span>
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
                  disabled={(filters.page || 1) >= totalPages}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      <TestDriveModal car={testDriveCar} onClose={() => setTestDriveCar(null)} />
      <ReserveModal car={reserveCar} onClose={() => setReserveCar(null)} />
      {editingCar && (
        <EditCarModal
          car={editingCar}
          onClose={() => setEditingCar(null)}
          onSaved={fetchCars}
          onDeleted={fetchCars}
        />
      )}
      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />
      <CompareFloatingBar onOpenCompare={() => setCompareModalOpen(true)} />
      <CompareModal
        cars={compareList}
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        onRemoveCar={removeCompareCar}
        onClearAll={clearCompare}
        onBookTestDrive={(c) => {
          setCompareModalOpen(false);
          setTestDriveCar(c);
        }}
        onReserve={(c) => {
          setCompareModalOpen(false);
          setReserveCar(c);
        }}
      />

      <Footer />
      <ConnectionStatus />
    </div>
  );
}
