import React, { useEffect, useRef, useState } from 'react';
import { HostelQuarterScene } from '../../three/HostelQuarterScene';
import type { BuildingId, OrbJourneyState, ThemeMode, Ticket } from '../../types/domain';

export interface CampusCanvasProps {
  theme: ThemeMode;
  force2DMode: boolean;
  reducedMotion: boolean;
  activeBuilding: BuildingId | null;
  tickets: Ticket[];
  orbJourney: OrbJourneyState | null;
  onSelectBuilding: (id: BuildingId) => void;
  onHoverBuilding?: (id: BuildingId | null) => void;
  onWebGLUnavailable?: () => void;
}

export const CampusCanvas: React.FC<CampusCanvasProps> = ({
  theme,
  force2DMode,
  reducedMotion,
  activeBuilding,
  tickets,
  orbJourney,
  onSelectBuilding,
  onHoverBuilding,
  onWebGLUnavailable,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<HostelQuarterScene | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    if (force2DMode || webglFailed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let instance: HostelQuarterScene | null = null;
    try {
      instance = new HostelQuarterScene(canvas, {
        theme,
        reducedMotion,
        onSelectBuilding,
        onHoverBuilding,
      });
      sceneRef.current = instance;
      instance.syncTickets(tickets);
      if (orbJourney) instance.syncOrbJourney(orbJourney);
      if (activeBuilding) instance.focusBuilding(activeBuilding);
    } catch {
      setWebglFailed(true);
      onWebGLUnavailable?.();
    }

    return () => {
      instance?.dispose();
      sceneRef.current = null;
    };
  }, [force2DMode, webglFailed]);

  useEffect(() => {
    sceneRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    sceneRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    sceneRef.current?.focusBuilding(activeBuilding);
  }, [activeBuilding]);

  useEffect(() => {
    sceneRef.current?.syncTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    if (orbJourney) sceneRef.current?.syncOrbJourney(orbJourney);
  }, [orbJourney]);

  if (force2DMode || webglFailed) return null;

  return (
    <div className="fixed inset-0 z-0">
      <canvas
        ref={canvasRef}
        id="hostel-quarter-world"
        aria-label="Interactive 3D Hostel Quarter Campus"
        className="w-full h-full block outline-none"
      />
    </div>
  );
};
