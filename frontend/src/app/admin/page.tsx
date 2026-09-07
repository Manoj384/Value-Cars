'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ConnectionStatus } from '../../components/ConnectionStatus';
import { apiClient, AdminMetrics, isAdminAuthed } from '../../services/api';
import { Car } from '../../types/car';
import { LayoutDashboard, CheckCircle2, ShieldAlert, Plus, Loader2, Sparkles, UserCheck, Lock, LogOut } from 'lucide-react';

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [pendingCars, setPendingCars] = useState<Car[]>([]);
  const [approvedEmails, setApprovedEmails] = useState<{ email: string; approved_by: string; created_at: string }[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [authed, setAuthed] = useState<boolean>(() => isAdminAuthed());
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, cars, emails] = await Promise.all([
        apiClient.getAdminMetrics(),
        apiClient.getPendingCars(),
        apiClient.getApprovedEmails(),
      ]);
      setMetrics(m);
      setPendingCars(cars);
      setApprovedEmails(emails);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

  const handleApproveCar = async (carId: string) => {
    try {
      await apiClient.approveCar(carId);
      setActionMsg('Car successfully approved and published live!');
      loadData();
    } catch {
      setActionMsg('Failed to approve car');
    }
  };

  const handleWhitelistEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    try {
      await apiClient.whitelistSellerEmail(newEmail, 'Admin Manoj');
      setNewEmail('');
      setActionMsg(`Email ${newEmail} added to approved seller whitelist!`);
      loadData();
    } catch {
      setActionMsg('Failed to whitelist email');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await apiClient.adminLogin(adminEmail, adminPassword);
      setAdminPassword('');
      setAuthed(true);
      loadData();
    } catch (err: any) {
      setAuthError(err?.message || 'Admin login failed');
    }
  };

  const handleAdminLogout = () => {
    apiClient.adminLogout();
    setAuthed(false);
    setMetrics(null);
    setPendingCars([]);
    setApprovedEmails([]);
    setActionMsg('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {authed ? (
        <>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center space-x-1 text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Operations & Approvals Control Center</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Admin Operations Dashboard</h1>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition"
          >
            Refresh Dashboard
          </button>
          <button
            onClick={handleAdminLogout}
            className="ml-3 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>

        {actionMsg && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-2xl border border-emerald-200 flex items-center justify-between">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg('')} className="text-emerald-800 text-xs">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Metrics Cards */}
            {metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Live Cars</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{metrics.total_published_cars}</p>
                  <span className="text-[11px] text-slate-500 font-medium">₹{(metrics.total_inventory_value_inr / 100000).toFixed(1)}L Inventory Value</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Pending Approvals</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">{metrics.pending_car_approvals}</p>
                  <span className="text-[11px] text-slate-500 font-medium">Cars awaiting review</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Test Drives</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{metrics.total_test_drives}</p>
                  <span className="text-[11px] text-slate-500 font-medium">Customer Bookings</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Approved Sellers</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.approved_sellers}</p>
                  <span className="text-[11px] text-slate-500 font-medium">Verified Email Whitelist</span>
                </div>
              </div>
            )}

            {/* Email Whitelist Manager */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <UserCheck className="w-5 h-5 text-rose-600" />
                <h2 className="text-lg font-black text-slate-900">Approved Seller Email Whitelist</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Emails in this whitelist are granted instant publishing rights when submitting cars through the portal.
              </p>

              <form onSubmit={handleWhitelistEmail} className="flex gap-3 mb-6">
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email to approve (e.g. dealer@valuecars.com)..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Approve Email
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {approvedEmails.map((item) => (
                  <div key={item.email} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block truncate">{item.email}</span>
                      <span className="text-[10px] text-slate-400">By: {item.approved_by}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Cars Approvals Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-black text-slate-900">Cars Awaiting Approval ({pendingCars.length})</h2>
              </div>

              {pendingCars.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No cars pending approval right now.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingCars.map((car) => (
                    <div key={car.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {car.year} {car.make} {car.model} ({car.variant})
                        </h4>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                          <span>₹{(car.price / 100000).toFixed(2)} Lakh</span>
                          <span>•</span>
                          <span>Seller: <strong>{car.seller_name || car.seller_email}</strong></span>
                          <span>•</span>
                          <span>{car.city}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleApproveCar(car.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                        >
                          Approve & Publish Live
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </>
      ) : (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-center w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Admin Sign In</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">Restricted area. Use your administrator credentials to continue.</p>

            {authError && <p className="mb-4 p-3 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl">{authError}</p>}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Admin email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500"
              />
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500"
              />
              <button type="submit" className="w-full px-4 py-3 bg-slate-900 hover:bg-rose-600 text-white text-sm font-bold rounded-xl transition">
                Sign In
              </button>
            </form>

            <p className="text-[10px] text-slate-400 mt-4 text-center">
              Default seed account: admin@valuecars.com
            </p>
          </div>
        </div>
      )}
      </main>
      <Footer />
      <ConnectionStatus />
    </div>
  );
}
