import React from 'react';
import { Languages, PlayCircle, RotateCcw, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import type { AppSettings, LanguageCode, TextSizeMode } from '../../types/domain';
import { t } from '../../i18n/translations';
import { GlassButton } from '../glass/GlassButton';
import { GlassChip } from '../glass/GlassChip';
import { GlassModal } from '../glass/GlassModal';

export const SettingsSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  offlineSimulated: boolean;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onToggleOffline: () => void;
  onReplayTour: () => void;
  onResetDemo: () => void;
}> = ({
  open,
  onClose,
  settings,
  offlineSimulated,
  onUpdateSettings,
  onToggleOffline,
  onReplayTour,
  onResetDemo,
}) => {
  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title="Quarter Settings & Accessibility"
      subtitle="Theme, typography, contrast, 2D fallback & language"
    >
      <div className="space-y-5">
        {/* Theme Switch Frost / Obsidian */}
        <div className="glass-lens-card p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Appearance: {settings.theme === 'obsidian' ? 'Obsidian Twilight' : 'Frost Dawn'}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Cross-fades 3D valley sky, lighting rig & glass lens tokens
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ theme: settings.theme === 'obsidian' ? 'frost' : 'obsidian' })
            }
            aria-label="Toggle Frost and Obsidian theme"
            className="uiverse-glass-toggle flex items-center shrink-0"
          >
            <span
              className="uiverse-glass-toggle-thumb"
              style={{
                transform: settings.theme === 'frost' ? 'translateX(28px)' : 'translateX(0px)',
              }}
            />
          </button>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-[var(--accent-amber)]" /> Language
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {(['en', 'hi'] as LanguageCode[]).map((code) => (
              <GlassChip
                key={code}
                label={code === 'en' ? 'English' : 'हिन्दी (Hindi)'}
                selected={settings.language === code}
                onClick={() => onUpdateSettings({ language: code })}
              />
            ))}
          </div>
        </div>

        {/* Text Size */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Text Size
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['compact', 'default', 'large'] as TextSizeMode[]).map((sz) => (
              <GlassChip
                key={sz}
                label={sz[0].toUpperCase() + sz.slice(1)}
                selected={settings.textSize === sz}
                onClick={() => onUpdateSettings({ textSize: sz })}
              />
            ))}
          </div>
        </div>

        {/* Accessibility & Performance Toggles */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Accessibility & Device Mode
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <GlassChip
              label="High Contrast (WCAG AA+)"
              selected={settings.highContrast}
              onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
            />
            <GlassChip
              label="Reduced Transparency"
              selected={settings.reducedTransparency}
              onClick={() =>
                onUpdateSettings({ reducedTransparency: !settings.reducedTransparency })
              }
            />
            <GlassChip
              label="2D Non-3D Fallback Mode"
              selected={settings.force2DMode}
              onClick={() => onUpdateSettings({ force2DMode: !settings.force2DMode })}
            />
            <GlassChip
              label={settings.soundEnabled ? 'Soft Chimes: On' : 'Soft Chimes: Off'}
              icon={
                settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )
              }
              selected={settings.soundEnabled}
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            />
          </div>
        </div>

        {/* Offline Test & Tour Replay */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[var(--glass-border-side)]/40">
          <GlassButton
            size="sm"
            variant="amber"
            icon={<PlayCircle className="w-4 h-4" />}
            onClick={() => {
              onClose();
              window.setTimeout(() => onReplayTour(), 240);
            }}
          >
            {t(settings.language, 'action.replayTour')}
          </GlassButton>
          <GlassButton
            size="sm"
            icon={offlineSimulated ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            onClick={onToggleOffline}
          >
            {offlineSimulated ? 'Go Online' : 'Simulate Offline'}
          </GlassButton>
          <GlassButton
            size="sm"
            variant="ghost"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={onResetDemo}
          >
            Reset Demo
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};
