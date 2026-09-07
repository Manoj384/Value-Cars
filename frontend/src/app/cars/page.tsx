'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ConnectionStatus } from '../../components/ConnectionStatus';
import { Loader2 } from 'lucide-react';
import CarDetail from '../../components/CarDetail';
function CarDetailLoader() {
  const searchParams = useSearchParams();
  const carId = searchParams.get('id');
  return <CarDetail carId={carId ?? ''} />;
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
        <CarDetailLoader />
      </Suspense>
      <Footer />
      <ConnectionStatus />
    </div>
  );
}
