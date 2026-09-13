'use client';

import React, { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2, Sparkles, Trash2, DollarSign } from 'lucide-react';
import { Car } from '../types/car';
import { apiClient } from '../services/api';

interface EditCarModalProps {
  car: Car | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}

export const EditCarModal: React.FC<EditCarModalProps> = ({ car, onClose, onSaved, onDeleted }) => {
  if (!car) return null;

  const [title, setTitle] = useState(car.title || '');
  const [price, setPrice] = useState(String(car.price || ''));
  const [km, setKm] = useState(String(car.kilometers_driven || ''));
  const [year, setYear] = useState(String(car.year || ''));
  const [fuelType, setFuelType] = useState(car.fuel_type || 'PETROL');
  const [transmission, setTransmission] = useState(car.transmission || 'MANUAL');
  const [bodyType, setBodyType] = useState(car.body_type || 'SUV');
  const [city, setCity] = useState(car.city || 'Bangalore');
  const [color, setColor] = useState(car.color || '');
  const [score, setScore] = useState(String(car.inspection_score || '9.0'));
  const [status, setStatus] = useState(car.status || 'PUBLISHED');
  const [description, setDescription] = useState(car.description || '');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await apiClient.modifyCarDetails(car.id, {
        title,
        price: Number(price),
        kilometers_driven: Number(km),
        year: Number(year),
        fuel_type: fuelType,
        transmission,
        body_type: bodyType,
        city,
        color,
        inspection_score: Number(score),
        status,
        description,
      });
      setSuccess('Vehicle details updated successfully!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkSold = async () => {
    if (!window.confirm(`Mark ${car.title} as SOLD? It will move to the Sold Cars session.`)) return;
    setError('');
    setSaving(true);
    try {
      await apiClient.markCarSold(car.id, true);
      setSuccess('Vehicle marked as SOLD!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to mark car as sold');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${car.title}"? This cannot be undone.`)) return;
    setError('');
    setDeleting(true);
    try {
      await apiClient.deleteCarManaged(car.id);
      setSuccess('Vehicle deleted successfully.');
      setTimeout(() => {
        if (onDeleted) onDeleted();
        else onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete vehicle. Make sure you are logged in as Admin.');
    } finally {
      setDeleting(false);
    }
  };

  const inputCls =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-rose-500 outline-none transition';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Admin Controls</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-1">Edit Vehicle Listing</h2>
        <p className="text-slate-500 text-xs mb-6">
          Update pricing, status, specifications, or delete listing ({car.reg_number}).
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Listing Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹ INR)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kilometers Driven</label>
              <input
                type="number"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className={inputCls}
              >
                <option value="PETROL">PETROL</option>
                <option value="DIESEL">DIESEL</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">ELECTRIC</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transmission</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as any)}
                className={inputCls}
              >
                <option value="MANUAL">MANUAL</option>
                <option value="AUTOMATIC">AUTOMATIC</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Body Type</label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as any)}
                className={inputCls}
              >
                <option value="HATCHBACK">HATCHBACK</option>
                <option value="SEDAN">SEDAN</option>
                <option value="SUV">SUV</option>
                <option value="MUV">MUV</option>
                <option value="LUXURY">LUXURY</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={inputCls}
              >
                <option value="PUBLISHED">PUBLISHED (Active Live)</option>
                <option value="SOLD">SOLD (Sold Session)</option>
                <option value="RESERVED">RESERVED</option>
                <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Score</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleMarkSold}
                disabled={saving || deleting || status === 'SOLD'}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 transition"
              >
                <DollarSign className="w-4 h-4 mr-1 text-amber-600" />
                {status === 'SOLD' ? 'Already Sold' : 'Mark as Sold'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 transition"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1 text-rose-600" />}
                Delete
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || deleting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-rose-600 disabled:opacity-50 shadow-md transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
