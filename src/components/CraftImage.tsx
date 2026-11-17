import React, { useState } from 'react';
import { Hammer } from 'lucide-react';

interface CraftImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const CraftImage: React.FC<CraftImageProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#ECECE7] text-[#525760] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Hammer className="w-6 h-6 mb-2 text-[#1B4332]" strokeWidth={1.75} />
        <span className="text-xs font-medium text-[#141619]">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
