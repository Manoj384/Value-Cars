'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ConnectionStatus } from '../../components/ConnectionStatus';
import { apiClient } from '../../services/api';
import { CheckCircle2, AlertCircle, Calculator, Sparkles, UploadCloud, ImagePlus, Trash2, Loader2, Star } from 'lucide-react';

interface PendingImage {
  id: string;
  file: File | null;
  preview: string;
  url?: string;
  tag: string;
  is_cover: boolean;
}

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
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');

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
        image_urls: pendingImages
          .filter((img) => img.url)
          .sort((a, b) => Number(b.is_cover) - Number(a.is_cover))
          .map((img) => img.url as string),
      });
      setSubmittedStatus(res.status);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadError('');
    const next: PendingImage[] = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      tag: 'EXTERIOR',
      is_cover: false,
    }));
    setPendingImages((prev) => {
      const combined = [...prev, ...next];
      if (combined.every((img) => !img.is_cover) && combined.length > 0) {
        combined[0].is_cover = true;
      }
      return combined;
    });
    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setPendingImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      const next = prev.filter((img) => img.id !== id);
      if (next.length > 0 && next.every((img) => !img.is_cover)) {
        next[0].is_cover = true;
      }
      return next;
    });
  };

  const handleToggleCover = (id: string) => {
    setPendingImages((prev) =>
      prev.map((img) => ({ ...img, is_cover: img.id === id })),
    );
  };

  const handleTagChange = (id: string, tag: string) => {
    setPendingImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, tag } : img)),
    );
  };

  const handleUploadImages = async () => {
    const files = pendingImages
      .filter((img) => !img.url && img.file)
      .map((img) => img.file as File);
    if (files.length === 0) return;
    setUploadingImages(true);
    setUploadError('');
    try {
      const urls = await apiClient.uploadImages(files);
      const urlById = new Map<string, string>();
      let idx = 0;
      for (const img of pendingImages) {
        if (!img.url && img.file) urlById.set(img.id, urls[idx++] ?? '');
      }
      setPendingImages((prev) =>
        prev.map((img) => {
          if (img.url) return img;
          const url = urlById.get(img.id);
          if (url) {
            URL.revokeObjectURL(img.preview);
            return { ...img, url };
          }
          return img;
        }),
      );
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImages(false);
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

            {/* Asking Price */}
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

            {/* Car Photos (Upload) */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Car Photos</label>
                <span className="text-[10px] text-slate-400 font-bold">
                  {pendingImages.filter((i) => i.url).length} uploaded · {pendingImages.length} added
                </span>
              </div>

              {uploadError && (
                <div className="mb-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-2" /> {uploadError}
                </div>
              )}

              {/* Selected image previews */}
              {pendingImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                  {pendingImages.map((img) => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url || img.preview} alt="car preview" className="w-full h-24 object-cover" />
                      {img.is_cover && (
                        <span className="absolute top-1 left-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center">
                          <Star className="w-2.5 h-2.5 mr-1" /> DISPLAY
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-slate-900/70 text-white rounded flex items-center justify-center hover:bg-red-600 transition"
                        aria-label="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="p-2 flex items-center justify-between gap-1">
                        <select
                          value={img.tag}
                          onChange={(e) => handleTagChange(img.id, e.target.value)}
                          className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1 py-0.5 outline-none"
                        >
                          <option>EXTERIOR</option>
                          <option>INTERIOR</option>
                          <option>TRUNK</option>
                          <option>DETAILS</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleToggleCover(img.id)}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${img.is_cover ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500 hover:text-rose-600'}`}
                        >
                          Cover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:border-rose-500 hover:text-rose-600 cursor-pointer transition">
                  <ImagePlus className="w-4 h-4" />
                  Add Photos (jpg, png, webp)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleAddImages}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleUploadImages}
                  disabled={uploadingImages || !pendingImages.some((img) => !img.url && img.file)}
                  className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {uploadingImages ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 mr-2" /> Upload {pendingImages.filter((i) => !i.url && i.file).length || ''} Image(s)
                    </>
                  )}
                </button>
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
      <Footer />
      <ConnectionStatus />
    </div>
  );
}
