import React, { useEffect, useState } from 'react';
import type { ThemeMode } from '../../types/domain';

export interface ValleyBackgroundProps {
  theme: ThemeMode;
  panelOpen: boolean;
  is2DMode: boolean;
}

/**
 * Layered Twilight Valley backdrop + pre-rendered fallback 3D wallpapers (16:9 / 9:16)
 * with mouse/tilt parallax, smooth Frost/Obsidian cross-fade, depth-of-field blur when
 * a building panel is open, and an adaptive contrast scrim for 4.5:1+ glass readability.
 * Also embeds the SVG `<filter id="liquid-lens">` refraction filter for glass panels.
 */
export const ValleyBackground: React.FC<ValleyBackgroundProps> = ({
  theme,
  panelOpen,
  is2DMode,
}) => {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 16;
      const ny = (e.clientY / window.innerHeight - 0.5) * 10;
      setParallax({ x: nx, y: ny });
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <>
      {/* Hidden SVG refraction filter definition for liquid glass bend */}
      <svg className="sr-only" width="0" height="0" aria-hidden="true">
        <defs>
          <filter id="liquid-lens" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Fallback gradient + pre-rendered 3D Twilight Valley wallpaper (2D / low-end / WebGL off) */}
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-700"
        style={{
          background: 'var(--bg-gradient)',
        }}
        aria-hidden="true"
      >
        {is2DMode && (
          <div
            className="absolute inset-[-24px] transition-opacity duration-700"
            style={{
              transform: `translate3d(${-parallax.x * 0.6}px, ${-parallax.y * 0.6}px, 0) scale(1.04)`,
              filter: panelOpen ? 'blur(8px) brightness(0.84)' : 'none',
            }}
          >
            <img
              src="/wallpapers/obsidian-valley.jpg"
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                theme === 'obsidian' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <img
              src="/wallpapers/frost-valley.jpg"
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                theme === 'frost' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        )}

        {/* Depth-of-field + adaptive contrast scrim when a glass panel overlays the 3D scene */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            panelOpen ? 'opacity-100 backdrop-blur-[5px]' : 'opacity-25'
          }`}
          style={{
            background: 'var(--scrim-panel)',
          }}
        />
      </div>
    </>
  );
};
