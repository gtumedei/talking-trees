import React from 'react';

interface MapLinkProps {
  lat: number;
  lng: number;
  label: string; // il testo del link
  className?: string; // opzionale, per compatibilità con il componente
}

export default function MapLink({ lat, lng, label, className }: MapLinkProps) {
  // Crea l'URL per Google Maps con latitudine e longitudine
  const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <p className={className}>
      <a href={mapUrl} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    </p>
  );
};
