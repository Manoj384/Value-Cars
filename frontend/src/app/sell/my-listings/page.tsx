'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';
import { ConnectionStatus } from '../../../components/ConnectionStatus';
import {
  apiClient,
  SellerProfile,
  clearSellerToken,
  getSellerToken,
} from '../../../services/api';
import { Car } from '../../../types/car';
import {
  UserCircle2,
  LogOut,
  Loader2,
  PlusCircle,
  CheckCircle2,
  TagIcon,
  AlertCircle,
  BadgeCheck,
  MapPin,
  Phone,
  Gauge,
  Trash2,
} from 'lucide-react';

type AuthMode = 'login' | 'register';

const STATUS_BADGES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  INSPECTION_PENDING: 'bg-sky-50 text-sky-700 border-sky-200',
  REFURBISHMENT: 'bg-violet-50 text-violet-700 border-violet-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TEST_DRIVE_BOOKED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RESERVED: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  SOLD: 'bg-rose-50 text-rose-700 border-rose-200',
};

const inr = (n: number) => `\u20b9${n.toLocaleString('en-IN')}`;

function AuthScreen({
  mode,
  setMode,
  onAuthed,
}: {
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  onAuthed: (p: SellerProfile) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp =
        mode === 'login'
          ? await apiClient.sellerLogin(email.trim(), password)
          : await apiClient.sellerRegister({
              full_name: fullName,
              email: email.trim(),
              phone_number: phone,
              password,
            });
      onAuthed(resp.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 px-6 py-5">
        <h2 className="text-xl font-black text-white flex items-center">
          <UserCircle2 className="w-6 h-6 mr-2 text-rose-400" /> Seller Portal
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Sign in to manage your listings, re-upload photos and mark cars sold.
        </p>
      </div>

      <div className="flex border-b border-slate-200">
        {(['login', 'register'] as AuthMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition ${
              mode === m
                ? 'text-rose-600 border-b-2 border-rose-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {m === 'login' ? 'Sign In' : 'Register'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="p-6 space-y-4">
        {mode === 'register' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                placeholder="e.g. Rahul Sharma"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                minLength={10}
                placeholder="e.g. 9876543210"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
            placeholder="At least 4 characters"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {mode === 'login' ? 'Sign In' : 'Create Seller Account'}
        </button>

        <p className="text-[11px] text-slate-400 text-center">
          {mode === 'register'
            ? 'Your listings are shown publicly only after admin approval.'
            : 'New here? Use the Register tab to create a seller account.'}
        </p>
      </form>
    </div>
  );
}

function ListingCard({
  car,
  onChanged,
  onDeleted,
  onError,
}: {
  car: Car;
  onChanged: () => void;
  onDeleted: () => void;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const cover = car.images?.find((i) => i.is_cover)?.image_url || car.images?.[0]?.image_url;
  const statusBadge = STATUS_BADGES[car.status] || 'bg-slate-100 text-slate-700 border-slate-200';

  const setStatus = async (status: string) => {
    setBusy(true);
    try {
      await apiClient.updateMyListing(car.id, { status });
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete listing "${car.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await apiClient.deleteMyListing(car.id);
      onDeleted();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-52 h-48 sm:h-auto bg-slate-100">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={car.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <TagIcon className="w-10 h-10" />
            </div>
          )}
        </div>

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link
                href={`/cars/${car.id}`}
                className="text-base font-black text-slate-900 hover:text-rose-600 transition line-clamp-1"
              >
                {car.title}
              </Link>
              <p className="text-xs text-slate-500 mt-0.5">
                {car.reg_number} · {car.city}
              </p>
            </div>
            <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusBadge}`}>
              {car.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
            <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> {car.kilometers_driven.toLocaleString('en-IN')} km</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {car.year}</span>
            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {car.fuel_type.toLowerCase()}</span>
          </div>

          <div className="mt-3 text-2xl font-black text-slate-900">{inr(car.price)}</div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <select
              value={car.status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={busy}
              className="text-xs font-bold border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-60"
            >
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending approval</option>
              <option value="PUBLISHED">Published</option>
              <option value="SOLD">Sold</option>
            </select>
            {car.status !== 'SOLD' ? (
              <button
                onClick={() => setStatus('SOLD')}
                disabled={busy}
                className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg px-2.5 py-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark sold
              </button>
            ) : null}
            <button
              onClick={remove}
              disabled={busy}
              className="ml-auto flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-lg px-2.5 py-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async (prof?: SellerProfile | null) => {
    setLoading(true);
    setError('');
    try {
      const [p, cars] = await Promise.all([apiClient.getSellerProfile(), apiClient.getMyListings()]);
      setProfile(p);
      setListings(cars);
      if (prof) setProfile(prof);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getSellerToken()) {
      loadDashboard();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthed = (p: SellerProfile) => {
    setProfile(p);
    setError('');
    loadDashboard(p);
  };

  const logout = () => {
    clearSellerToken();
    setProfile(null);
    setListings([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">My Listings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage the cars you've submitted to Value Cars.</p>
        </div>

        {!profile && !loading ? (
          <AuthScreen mode={mode} setMode={setMode} onAuthed={handleAuthed} />
        ) : profile ? (
          <>
            {/* Profile bar */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 mb-6 flex flex-wrap items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-600 flex items-center justify-center text-white">
                <UserCircle2 className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">{profile.full_name}</h2>
                  {profile.is_approved_seller ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3.5 h-3.5" /> Approved Seller
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" /> Awaiting Admin Approval
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">{profile.email}</p>
              </div>
              <Link
                href="/sell"
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-lg transition"
              >
                <PlusCircle className="w-4 h-4" /> Add a Car
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">
                Your Cars <span className="text-slate-400 font-bold text-sm">({listings.length})</span>
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading your listings...
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center bg-white rounded-2xl border border-dashed border-slate-300 py-16">
                <TagIcon className="w-12 h-12 mx-auto text-slate-300" />
                <p className="mt-4 text-slate-600 font-semibold">You have no listings yet.</p>
                <p className="text-sm text-slate-400 mt-1">Add your first car to get started.</p>
                <Link
                  href="/sell"
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 px-5 py-2.5 rounded-lg transition"
                >
                  <PlusCircle className="w-4 h-4" /> Sell a Car
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {listings.map((car) => (
                  <ListingCard
                    key={car.id}
                    car={car}
                    onChanged={() => loadDashboard()}
                    onDeleted={() => loadDashboard()}
                    onError={(msg) => setError(msg)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
          </div>
        )}
      </main>

      <Footer />
      <ConnectionStatus />
    </div>
  );
}