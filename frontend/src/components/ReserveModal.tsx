'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Car } from '../types/car';
import { apiClient } from '../services/api';

interface ReserveModalProps {
  car: Car | null;
  onClose: () => void;
}

export const ReserveModal: React.FC<ReserveModalProps> = ({ car, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState(car?.city || 'Bangalore');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!car) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.reserveCar({
        car_id: car.id,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        city,
        token_amount: 10000.0,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Car Reserved Successfully!</h3>
            <p className="text-sm text-slate-600 mt-2">
              The <strong>{car.year} {car.make} {car.model}</strong> has been reserved for you for 5 days. Your refundable deposit receipt has been sent to <strong>{email}</strong>.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-rose-600 transition"
            >
              Back to Catalog
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Refundable Deposit</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">Hold This Car (₹10,000)</h3>
              <p className="text-xs text-slate-500">{car.year} {car.make} {car.model} • ₹{(car.price / 100000).toFixed(2)} Lakh</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Hold Duration</span>
                <span>5 Days</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>Refund Policy</span>
                <span className="text-emerald-600">Instant No-Questions Refund</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-slate-900 hover:bg-rose-600 text-white font-black rounded-xl shadow-lg transition flex items-center justify-center disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Pay ₹10,000 & Reserve Car'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
