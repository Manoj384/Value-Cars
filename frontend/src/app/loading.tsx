import { Car } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center animate-pulse">
        <Car className="w-6 h-6" />
      </div>
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" />
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.1s]" />
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]" />
        Loading Value Cars…
      </div>
    </div>
  );
}