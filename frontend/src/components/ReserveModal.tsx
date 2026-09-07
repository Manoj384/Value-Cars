'use client';

import React, { useState } from 'react';
import { X, Calendar, Phone, CheckCircle, AlertCircle, MessageSquare, Clock } from 'lucide-react';
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
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('11:00 AM - 01:00 PM');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!car) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const waMsg = 
      `🔔 *Value Cars Viewing / Contact Request*\n\n` +
      `👤 *Name:* ${name}\n` +
      `📱 *Phone:* ${phone}\n` +
      `🚗 *Vehicle:* ${car.year} ${car.make} ${car.model} (${car.variant})\n` +
      `💰 *Price:* ₹${(car.price / 100000).toFixed(2)} Lakh\n` +
      `📅 *Date & Slot:* ${preferredDate} (${timeSlot})\n` +
      `📍 *Location:* Near Bangalore University, Mallathahalli Hub\n` +
      `📝 *Notes:* ${notes || 'Interested in test driving & inspection'}\n\n` +
      `👉 *Please confirm viewing appointment.*`;

    const waUrl = `https://wa.me/918050966025?text=${encodeURIComponent(waMsg)}`;

    try {
      // Submits as a Hub Viewing / Direct Inspection Contact request
      await apiClient.bookTestDrive({
        car_id: car.id,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || undefined,
        city: car.city || 'Bangalore',
        location_type: 'VALUE_CARS_HUB',
        booking_date: preferredDate,
        time_slot: timeSlot,
      });
      setSuccess(true);
      // Auto-open WhatsApp chat with pre-filled lead details
      if (typeof window !== 'undefined') {
        window.open(waUrl, '_blank');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to schedule viewing');
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppUrl = () => {
    const waMsg = 
      `🔔 *Value Cars Viewing / Contact Request*\n\n` +
      `👤 *Name:* ${name}\n` +
      `📱 *Phone:* ${phone}\n` +
      `🚗 *Vehicle:* ${car.year} ${car.make} ${car.model} (${car.variant})\n` +
      `💰 *Price:* ₹${(car.price / 100000).toFixed(2)} Lakh\n` +
      `📅 *Date & Slot:* ${preferredDate} (${timeSlot})\n` +
      `📍 *Location:* Near Bangalore University, Mallathahalli Hub\n` +
      `📝 *Notes:* ${notes || 'Interested in test driving & inspection'}\n\n` +
      `👉 *Please confirm viewing appointment.*`;
    return `https://wa.me/918050966025?text=${encodeURIComponent(waMsg)}`;
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
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Request Sent Successfully!</h3>
            <p className="text-sm text-slate-600 mt-2">
              Viewing requested for <strong>{car.year} {car.make} {car.model}</strong> on <strong>{preferredDate} ({timeSlot})</strong>.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Your contact number: <strong className="text-slate-800">{phone}</strong>
            </p>

            <div className="mt-5 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left space-y-2">
              <span className="text-xs font-bold text-emerald-800 block">📲 Instant WhatsApp Connect:</span>
              <p className="text-[11px] text-emerald-700">
                A WhatsApp chat window should have opened. If not, click below to send your lead details directly to our hotline!
              </p>
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 text-center"
              >
                <span>💬</span> Click Here to Open in WhatsApp (8050966025)
              </a>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              📍 Hub: <strong>Near Bangalore University, Mallathahalli, Bengaluru</strong>
            </div>

            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-rose-600 transition"
            >
              Done & Return to Catalog
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full mb-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Instant Seller & Admin Connect</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">Schedule Hub Viewing & Call</h3>
              <p className="text-xs text-slate-500">{car.year} {car.make} {car.model} • ₹{(car.price / 100000).toFixed(2)} Lakh ({car.city})</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Manoj"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number *</label>
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
                <label className="text-xs font-bold text-slate-700 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Preferred Time</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
                >
                  <option>09:00 AM - 11:00 AM</option>
                  <option>11:00 AM - 01:00 PM</option>
                  <option>02:00 PM - 04:00 PM</option>
                  <option>04:00 PM - 06:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Any Questions or Notes?</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Want to inspect car history, check finance options, etc."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
              <span>No payment required. The admin will get your number instantly on WhatsApp.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 bg-slate-900 hover:bg-rose-600 text-white font-black rounded-xl shadow-lg transition flex items-center justify-center disabled:opacity-50"
            >
              <Phone className="w-4 h-4 mr-2" />
              {loading ? 'Sending Request...' : 'Schedule Viewing & Request Call'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
