import confetti from "canvas-confetti";

export const ADHD_REWARD_MESSAGES = [
  "⚡ Dopamine hit! Task crushed!",
  "🎯 Boom! One less thing on your mind!",
  "🔥 Momentum is building! Great job!",
  "🧠 Brain space freed up! +1 completed",
  "✨ Look at you go! Fantastic focus!",
  "🚀 Crushing it, one small step at a time!",
  "💪 Victory! That felt good, didn't it?",
  "🌟 Keep the roll going! Unstoppable!",
] as const;

export const ALL_CLEAR_MESSAGE = "🏆 All clear! You conquered every reminder today!";

export function getRandomRewardMessage(): string {
  const index = Math.floor(Math.random() * ADHD_REWARD_MESSAGES.length);
  return ADHD_REWARD_MESSAGES[index];
}

export function playTaskCompletionChime(): void {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Note 1 (E5 - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Note 2 (A5 - 880 Hz) - sparkling chime!
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now + 0.07);
    gain2.gain.setValueAtTime(0.18, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.35);
  } catch {
    // Audio autoplay restrictions or unsupported environments gracefully handled
  }
}

export function fireTaskRewardConfetti(origin?: { x: number; y: number }): void {
  try {
    confetti({
      particleCount: 40,
      spread: 60,
      startVelocity: 25,
      origin: origin ?? { x: 0.5, y: 0.6 },
      colors: ["#6EE7B7", "#93C5FD", "#FCD34D", "#F472B6", "#A78BFA", "#34D399"],
      disableForReducedMotion: true,
      zIndex: 9999,
    });
  } catch {
    // Graceful fallback if canvas is unavailable
  }
}
