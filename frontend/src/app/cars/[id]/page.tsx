'use client';

import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';
import { ConnectionStatus } from '../../../components/ConnectionStatus';
import CarDetail from '../../../components/CarDetail';

export default function CarDetailRoutePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <CarDetail key={params.id} carId={params.id} />
      <Footer />
      <ConnectionStatus />
    </div>
  );
}
