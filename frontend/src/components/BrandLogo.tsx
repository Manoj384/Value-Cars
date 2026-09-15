'use client';

import React, { useState } from 'react';

interface BrandLogoProps {
  brand: string;
  className?: string;
  ariaLabel?: string;
}

const BRAND_IMAGES: Record<string, string> = {
  maruti: '/brands/suzuki-logo.png',
  suzuki: '/brands/suzuki-logo.png',
  'maruti suzuki': '/brands/suzuki-logo.png',
  hyundai: '/brands/hyundai-logo.png',
  tata: '/brands/tata-logo.png',
  mahindra: '/brands/mahindra-logo.png',
  toyota: '/brands/toyota-logo-2020.png',
  kia: '/brands/kia-logo.png',
  honda: '/brands/honda-logo-2000-3d.png',
  skoda: '/brands/skoda-logo.png',
  volkswagen: '/brands/volkswagen-logo.png',
  vw: '/brands/volkswagen-logo.png',
  nissan: '/brands/nissan-logo.png',
  renault: '/brands/renault-logo.png',
  bmw: '/brands/bmw-logo-2020-1.png',
  mercedes: '/brands/mercedes-benz-logo.png',
  'mercedes-benz': '/brands/mercedes-benz-logo.png',
  benz: '/brands/mercedes-benz-logo.png',
  audi: '/brands/audi-logo.png',
  mg: '/brands/mg-logo.png',
  jeep: '/brands/jeep-logo.png',
  ford: '/brands/ford-logo-2017.png',
  chevrolet: '/brands/chevrolet-logo.png',
  jaguar: '/brands/jaguar-logo.png',
  'land rover': '/brands/land-rover-logo.png',
  volvo: '/brands/volvo-logo.png',
  isuzu: '/brands/isuzu-logo.png',
  lexus: '/brands/lexus-logo.png',
  subaru: '/brands/subaru-logo.png',
  tesla: '/brands/tesla-logo-2007.png',
  bharatbenz: '/brands/bharatbenz-logo.png',
};

interface BrandSvg {
  viewBox: string;
  svg: JSX.Element;
}

const BRAND_SVGS: Record<string, BrandSvg> = {
  Maruti: {
    viewBox: '0 0 100 100',
    svg: (
      <>
        <path d="M78 28L60 46H22l18-18h38zm-56 44l18-18h38l-18 18H22z" fill="#003366" />
        <path d="M40 46l20 20H42L22 46h18z" fill="#c00" />
      </>
    ),
  },
  Hyundai: {
    viewBox: '0 0 100 100',
    svg: (
      <>
        <ellipse cx="50" cy="50" rx="42" ry="24" fill="none" stroke="#002c5f" strokeWidth="6" />
        <path
          d="M38 34c4 10 7 22 7 32M62 34c-4 10-7 22-7 32M40 50h20"
          fill="none"
          stroke="#002c5f"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  Tata: {
    viewBox: '0 0 100 100',
    svg: (
      <>
        <ellipse cx="50" cy="50" rx="42" ry="24" fill="#004b87" />
        <path d="M28 42h44M50 42v28" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
        <circle cx="34" cy="42" r="5" fill="#fff" />
        <circle cx="66" cy="42" r="5" fill="#fff" />
      </>
    ),
  },
  Mahindra: {
    viewBox: '0 0 100 100',
    svg: <path d="M22 68L42 32l8 14-6 10 12-24 14 24-6-10 8-14 20 36H22z" fill="#d32f2f" />,
  },
  Toyota: {
    viewBox: '0 0 100 100',
    svg: (
      <>
        <ellipse cx="50" cy="50" rx="44" ry="32" fill="none" stroke="#eb0a1e" strokeWidth="5" />
        <ellipse cx="50" cy="42" rx="30" ry="14" fill="none" stroke="#eb0a1e" strokeWidth="5" />
        <ellipse cx="50" cy="54" rx="14" ry="24" fill="none" stroke="#eb0a1e" strokeWidth="5" />
      </>
    ),
  },
  Kia: {
    viewBox: '0 0 100 60',
    svg: (
      <path
        d="M12 45V15l16 30V15M34 15v30M56 15l-14 30h28L84 15"
        fill="none"
        stroke="#05141f"
        strokeWidth="8"
        strokeLinecap="square"
      />
    ),
  },
  Honda: {
    viewBox: '0 0 100 100',
    svg: (
      <>
        <rect x="15" y="15" width="70" height="70" rx="14" fill="none" stroke="#e40521" strokeWidth="6" />
        <path d="M32 30v40l8-4V50h20v16l8 4V30L60 34v10H40V34z" fill="#e40521" />
      </>
    ),
  },
  Skoda: {
    viewBox: '0 0 100 100',
    svg: (
      <>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#4ba82e" strokeWidth="6" />
        <path d="M50 25c12 0 20 10 20 20 0 8-6 16-16 16l-8-6 10-6-16-4 10-20z" fill="#4ba82e" />
      </>
    ),
  },
  Volkswagen: {
    viewBox: '0 0 100 100',
    svg: (
      <>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#001e50" strokeWidth="6" />
        <path
          d="M26 30l16 28 8-16 8 16 16-28M34 46l16 28 16-28"
          fill="none"
          stroke="#001e50"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </>
    ),
  },
  Nissan: {
    viewBox: '0 0 100 100',
    svg: (
      <>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#c3002f" strokeWidth="6" />
        <rect x="15" y="42" width="70" height="16" rx="3" fill="#c3002f" />
        <text
          x="50"
          y="54"
          fill="#fff"
          fontSize="9"
          fontWeight="bold"
          fontFamily="sans-serif"
          textAnchor="middle"
        >
          NISSAN
        </text>
      </>
    ),
  },
  Renault: {
    viewBox: '0 0 100 100',
    svg: (
      <>
        <path d="M50 15L74 50 50 85 26 50z" fill="none" stroke="#ffcc00" strokeWidth="8" strokeLinejoin="round" />
        <path d="M50 32L62 50 50 68 38 50z" fill="#ffcc00" />
      </>
    ),
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ brand, className = 'w-9 h-9', ariaLabel }) => {
  const [imgError, setImgError] = useState(false);
  const normalizedKey = (brand || '').trim().toLowerCase();
  const imagePath = BRAND_IMAGES[normalizedKey];

  if (imagePath && !imgError) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={imagePath}
        alt={ariaLabel ?? `${brand} logo`}
        className={`${className} object-contain p-0.5`}
        onError={() => setImgError(true)}
      />
    );
  }

  const entry = BRAND_SVGS[brand] || BRAND_SVGS[brand.split(' ')[0]];

  if (!entry) {
    return (
      <div
        className={`${className} rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-[10px] uppercase`}
        aria-label={brand}
        role="img"
      >
        {brand.slice(0, 3)}
      </div>
    );
  }

  return (
    <svg
      viewBox={entry.viewBox}
      className={className}
      role="img"
      aria-label={ariaLabel ?? `${brand} logo`}
      data-brand={brand}
    >
      {entry.svg}
    </svg>
  );
};