'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { track } from '../lib/activity';

const DEFAULT_MESSAGE = 'Hello%20Value%20Cars%2C%20I%20am%20interested%20in%20buying%2Fviewing%20a%20car';
const DEFAULT_NUMBER = '918050966025';

interface FloatingWhatsAppProps {
  phone?: string;
  message?: string;
  label?: string;
}

/**
 * Always-visible floating WhatsApp contact button (bottom-left).
 * Keeps the primary conversion channel one tap away on mobile and desktop.
 */
export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phone = DEFAULT_NUMBER,
  message = DEFAULT_MESSAGE,
  label = 'Chat with us',
}) => {
  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('whatsapp', 'click', { placement: 'floating' })}
      className="fixed bottom-5 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white font-bold px-4 py-3 shadow-xl shadow-emerald-600/30 transition hover:bg-emerald-600 hover:scale-105"
      aria-label={label}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline text-sm">{label}</span>
    </a>
  );
};