'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ConnectionStatus } from '../../components/ConnectionStatus';
import { TestDriveModal } from '../../components/TestDriveModal';
import { ReserveModal } from '../../components/ReserveModal';
import { apiClient } from '../../services/api';
import { Car, InspectionReport } from '../../types/car';
import { ShieldCheck, ArrowLeft, Award, Loader2 } from 'lucide-react';

function CarDetailContent() {
  const searchParams = useSearchParams();
  const carId = searchParams.get('id');

  const [car, setCar] = useState<Car | null>(null);
  const [inspection, setInspection] = useState<InspectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');

  const [showTestDrive, setShowTestDrive] = useState(false);
  const [showReserve, setShowReserve] = useState(false);

  useEffect(() => {
    if (!carId) {
      setLoading(false);
      return;
    }
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [carData, inspData] = await Promise.all([
          apiClient.getCarById(carId),
          apiClient.getCarInspection(carId).catch(() => null),
        ]);
        setCar(carData);
        setInspection(inspData);
        if (carData.images && carData.images.length > 0) {
          setActiveImage(carData.images[0].image_url);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [carId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <p className="text-slate-600 font-bold mb-4">Vehicle not found or no ID provided.</p>
        <Link href="/" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Back Link */}
      <Link href="/" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-rose-600 mb-6 transition">
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to All Cars
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Image Gallery + Inspection Scorecard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery View */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm overflow-hidden">
            <div className="relative h-96 sm:h-[420px] rounded-2xl overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage || car.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'}
                alt={car.title}
                className="w-full h-full object-cover"
              />

              {car.is_spinny_certified && (
                <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1.5" /> 200-POINT CERTIFIED
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {car.images && car.images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {car.images.map((img) => (
                  <button
                    key={img.id || img.image_url}
                    onClick={() => setActiveImage(img.image_url)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                      activeImage === img.image_url ? 'border-rose-600 ring-2 ring-rose-600/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.image_url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 200-Point Digital Inspection Scorecard */}
          {inspection && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center">
                    <Award className="w-4 h-4 mr-1" /> Quality Assurance
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-0.5">200-Point Digital Inspection Report</h2>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-600">{inspection.overall_score.toFixed(1)}</span>
                  <span className="text-xs font-bold text-slate-400 block">/ 10 Rating</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 block">Engine & Transmission</span>
                  <span className="text-base font-black text-slate-800">{inspection.engine_score}/10</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 block">Body & Exterior</span>
                  <span className="text-base font-black text-slate-800">{inspection.exterior_score}/10</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 block">Interior & Electrical</span>
                  <span className="text-base font-black text-slate-800">{inspection.interior_score}/10</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 block">Suspension & Brakes</span>
                  <span className="text-base font-black text-slate-800">{inspection.suspension_score}/10</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 block">Air Conditioning</span>
                  <span className="text-base font-black text-slate-800">{inspection.ac_score}/10</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 block">Documentation</span>
                  <span className="text-base font-black text-emerald-600">Verified 100%</span>
                </div>
              </div>

              {inspection.summary_notes && (
                <div className="mt-4 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-slate-700">
                  <strong>Inspector Remarks:</strong> {inspection.summary_notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Booking Action Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-28 space-y-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">{car.make} • {car.city}</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                {car.year} {car.make} {car.model}
              </h1>
              <p className="text-sm font-semibold text-slate-500">{car.variant}</p>
            </div>

            {/* Price */}
            <div className="pb-4 border-b border-slate-100">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900">
                  ₹{(car.price / 100000).toFixed(2)} <span className="text-base font-bold text-slate-400">Lakh</span>
                </span>
                {car.original_price && (
                  <span className="text-sm text-slate-400 line-through">
                    ₹{(car.original_price / 100000).toFixed(2)} L
                  </span>
                )}
              </div>
              <span className="text-[11px] text-emerald-600 font-bold block mt-1">
                ✓ Fixed Price • No Hidden Dealership Fees
              </span>
            </div>

            {/* Overview Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Kilometers</span>
                <strong className="text-slate-800 text-sm">{car.kilometers_driven.toLocaleString()} km</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Ownership</span>
                <strong className="text-slate-800 text-sm">{car.ownership} Owner</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Fuel & Gear</span>
                <strong className="text-slate-800 text-sm">{car.fuel_type} • {car.transmission}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Warranty</span>
                <strong className="text-slate-800 text-sm">{car.warranty_months} Months Comprehensive</strong>
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowTestDrive(true)}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-xl shadow-lg shadow-rose-600/30 transition transform active:scale-98"
              >
                Book Free Home Test Drive
              </button>
              <button
                onClick={() => setShowReserve(true)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl transition"
              >
                Reserve Car (₹10,000 Refundable)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TestDriveModal car={showTestDrive ? car : null} onClose={() => setShowTestDrive(false)} />
      <ReserveModal car={showReserve ? car : null} onClose={() => setShowReserve(false)} />
    </main>
  );
}

export default function CarDetailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        </div>
      }>
        <CarDetailContent />
      </Suspense>
      <Footer />
      <ConnectionStatus />
    </div>
  );
}
