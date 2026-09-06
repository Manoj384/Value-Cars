'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { apiClient } from '../../services/api';
import { CheckCircle2, AlertCircle, Calculator, Sparkles, UploadCloud } from 'lucide-react';

export default function SellCarPage() {
  const [email, setEmail] = useState('');
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Form Fields
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [make, setMake] = useState('Hyundai');
  const [model, setModel] = useState('Creta');
  const [variant, setVariant] = useState('1.5 SX (O)');
  const [year, setYear] = useState(2022);
  const [kilometers, setKilometers] = useState(25000);
  const [fuelType, setFuelType] = useState('PETROL');
  const [transmission, setTransmission] = useState('AUTOMATIC');
  const [ownership, setOwnership] = useState('FIRST');
  const [bodyType, setBodyType] = useState('SUV');
  const [color, setColor] = useState('Polar White');
  const [city, setCity] = useState('Bangalore');
  const [price, setPrice] = useState(1450000);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Valuation
  const [valuation, setValuation] = useState<{ min: number; max: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Live Email Verification Check
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setIsApproved(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await apiClient.checkSellerEmail(email);
        setIsApproved(res.is_approved);
      } catch {
        setIsApproved(false);
      } finally {
        setCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email]);

  const handleCalculateValuation = async () => {
    try {
      const res = await apiClient.calculateValuation({
        make,
        model,
        year,
        fuel_type: fuelType,
        transmission,
        kilometers_driven: kilometers,
        ownership,
        city,
      });
      setValuation({ min: res.estimated_min_price, max: res.estimated_max_price });
      setPrice(res.recommended_procurement_price);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.submitSellerCar({
        title: `${year} ${make} ${model} ${variant}`,
        reg_number: `KA-05-${Math.floor(1000 + Math.random() * 9000)}`,
        make,
        model,
        variant,
        year,
        kilometers_driven: kilometers,
        fuel_type: fuelType,
        transmission,
        ownership,
        body_type: bodyType,
        color,
        city,
        price,
        seller_email: email,
        seller_name: sellerName,
        seller_phone: sellerPhone,
        description,
        image_urls: imageUrl ? [imageUrl] : undefined,
      });
      setSubmittedStatus(res.status);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 w-full flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-1 text-xs font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Online Seller & Inventory Portal</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">List Your Car on Value Cars</h1>
          <p className="text-slate-500 text-sm mt-1">
            Verified seller emails get published live instantly. New sellers are approved by the admin.
          </p>
        </div>

        {submittedStatus ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              submittedStatus === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              {submittedStatus === 'PUBLISHED' ? 'Car Published Live!' : 'Car Submitted for Admin Approval'}
            </h3>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              {submittedStatus === 'PUBLISHED'
                ? 'Your email was recognized as an approved seller. Your car is now live in the marketplace!'
                : 'Thank you! Your car is in PENDING_APPROVAL status. Once the admin verifies your email, it will appear on the catalog.'}
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Link href="/" className="px-6 py-2.5 bg-slate-900 hover:bg-rose-600 text-white font-bold rounded-xl transition">
                View Marketplace
              </Link>
              <button
                onClick={() => setSubmittedStatus(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
              >
                Submit Another Car
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> {error}
              </div>
            )}

            {/* Email Verification Section */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1">
                Seller Email (Approval Verification) *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. dealer@valuecars.com"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500"
                />
                <div className="absolute right-3 top-3 text-xs font-bold">
                  {checkingEmail && <span className="text-slate-400">Checking...</span>}
                  {!checkingEmail && isApproved === true && (
                    <span className="text-emerald-600 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approved Seller (Auto-Publish)
                    </span>
                  )}
                  {!checkingEmail && isApproved === false && (
                    <span className="text-amber-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" /> Unverified (Needs Admin Review)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Seller Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Seller Name *</label>
                <input
                  type="text"
                  required
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="e.g. Manoj Motors"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Make</label>
                <select
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option>Hyundai</option>
                  <option>Tata</option>
                  <option>Mahindra</option>
                  <option>Maruti</option>
                  <option>Toyota</option>
                  <option>Kia</option>
                  <option>Honda</option>
                  <option>Volkswagen</option>
                  <option>Skoda</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Model</label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Variant</label>
                <input
                  type="text"
                  required
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">KM Driven</label>
                <input
                  type="number"
                  value={kilometers}
                  onChange={(e) => setKilometers(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Fuel</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option>PETROL</option>
                  <option>DIESEL</option>
                  <option>CNG</option>
                  <option>ELECTRIC</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gearbox</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option>MANUAL</option>
                  <option>AUTOMATIC</option>
                </select>
              </div>
            </div>

            {/* Valuation Helper */}
            <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-700 block">AI Valuation Engine</span>
                <p className="text-xs text-slate-600">
                  {valuation
                    ? `Estimated Market Range: ₹${(valuation.min / 100000).toFixed(2)}L - ₹${(valuation.max / 100000).toFixed(2)}L`
                    : 'Get an instant fair-market valuation estimate based on depreciation and mileage.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCalculateValuation}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center shrink-0"
              >
                <Calculator className="w-3.5 h-3.5 mr-1.5" /> Estimate Price
              </button>
            </div>

            {/* Asking Price & Image URL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Asking Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Car Condition Notes</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Single owner, full service history at authorized showroom..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center disabled:opacity-50"
            >
              <UploadCloud className="w-5 h-5 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Car Listing'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
