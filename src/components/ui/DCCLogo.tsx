import React from 'react';
import { cn } from '@/lib/utils';

interface DCCLogoProps {
  className?: string;
  alt?: string;
  cropped?: boolean;
  priority?: boolean;
}

/**
 * DCCLogo renders the official Club DCC brand logo, automatically switching
 * between light mode (Black logo on light background) and dark mode (White logo on dark background).
 *
 * Uses CSS dark: variants for instantaneous zero-hydration flash theme switching.
 */
export function DCCLogo({
  className,
  alt = 'Club DCC',
  cropped = true,
}: DCCLogoProps) {
  const lightSrc = cropped ? '/dcc-black.png' : '/Black.PNG';
  const darkSrc = cropped ? '/dcc-white.png' : '/White.PNG';

  return (
    <span className="inline-flex items-center justify-center shrink-0">
      {/* Light mode: Black logo */}
      <img
        src={lightSrc}
        alt={alt}
        className={cn('dark:hidden select-none pointer-events-none object-contain transition-opacity duration-150', className)}
        loading="eager"
      />
      {/* Dark mode: White logo */}
      <img
        src={darkSrc}
        alt={alt}
        className={cn('hidden dark:block select-none pointer-events-none object-contain transition-opacity duration-150', className)}
        loading="eager"
      />
    </span>
  );
}

export default DCCLogo;
