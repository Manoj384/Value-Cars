import React from 'react';
import CarDetailClient from './CarDetailClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

// Static params for static export build
export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: 'demo' },
  ];
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  return <CarDetailClient id={params.id} />;
}
