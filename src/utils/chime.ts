/**
 * Optional soft Web Audio API chime (off by default, toggled in Settings).
 * Plays a gentle two-note bell for resolved tickets or a warm low chime for overdue alerts.
 */
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playSoftChime(kind: 'resolved' | 'overdue', enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = kind === 'resolved' ? [523.25, 659.25] : [349.23, 293.66];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.14);
    gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.06, now + idx * 0.14 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.14);
    osc.stop(now + idx * 0.14 + 0.6);
  });
}
