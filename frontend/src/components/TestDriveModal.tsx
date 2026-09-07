'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { Car } from '../types/car';
import { apiClient } from '../services/api';

interface TestDriveModalProps {
  car: Car | null;
  onClose: () => void;
}

export const TestDriveModal: React.FC<TestDriveModalProps> = ({ car, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState(car?.city || 'Bangalore');
  const [locationType, setLocationType] = useState<'HOME_DELIVERY' | 'VALUE_CARS_HUB'>('HOME_DELIVERY');
  const [address, setAddress] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('11:00 AM - 01:00 PM');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!car) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.bookTestDrive({
        car_id: car.id,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || undefined,
        city,
        location_type: locationType,
        address: locationType === 'HOME_DELIVERY' ? address : undefined,
        booking_date: bookingDate,
        time_slot: timeSlot,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to book test drive');
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
            <h3 className="text-xl font-black text-slate-900">Test Drive Confirmed!</h3>
            <p className="text-sm text-slate-600 mt-2">
              Our representative will bring the <strong>{car.year} {car.make} {car.model}</strong> to your location on <strong>{bookingDate} ({timeSlot})</strong>.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://wa.me/918050966025?text=${encodeURIComponent(
                  `Hello Value Cars! I have booked a Test Drive for ${car.year} ${car.make} ${car.model} (${car.variant}).\nMy Name: ${name}\nPhone: ${phone}\nDate: ${bookingDate} (${timeSlot})\nLocation: ${locationType === 'HOME_DELIVERY' ? address : 'Hub'}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-md"
              >
                📲 Chat on WhatsApp (8050966025)
              </a>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-rose-600 transition"
              >
                Back to Catalog
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Free Home Delivery</span>
              <h3 className="text-xl font-black text-slate-900">Book Test Drive</h3>
              <p className="text-xs text-slate-500">{car.year} {car.make} {car.model} ({car.variant})</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Test Drive Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocationType('HOME_DELIVERY')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    locationType === 'HOME_DELIVERY'
                      ? 'border-rose-600 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  🏡 Home Test Drive
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('VALUE_CARS_HUB')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    locationType === 'VALUE_CARS_HUB'
                      ? 'border-rose-600 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  🏢 Visit Hub
                </button>
              </div>
            </div>

            {locationType === 'HOME_DELIVERY' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Landmark, Area"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Time Slot</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-lg shadow-rose-600/30 transition transform active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Confirm Free Test Drive'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
