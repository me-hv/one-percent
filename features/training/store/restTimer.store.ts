import { create } from "zustand"

interface RestTimerState {
  secondsRemaining: number
  totalSeconds: number
  isActive: boolean
  isPaused: boolean

  // Actions
  startTimer: (durationSeconds: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  adjustTimer: (seconds: number) => void
  tick: () => void
}

export const useRestTimerStore = create<RestTimerState>((set, get) => ({
  secondsRemaining: 0,
  totalSeconds: 0,
  isActive: false,
  isPaused: false,

  startTimer: (durationSeconds) => {
    set({
      secondsRemaining: durationSeconds,
      totalSeconds: durationSeconds,
      isActive: true,
      isPaused: false,
    })
  },

  pauseTimer: () => {
    set({ isPaused: true })
  },

  resumeTimer: () => {
    set({ isPaused: false })
  },

  stopTimer: () => {
    set({
      secondsRemaining: 0,
      totalSeconds: 0,
      isActive: false,
      isPaused: false,
    })
  },

  adjustTimer: (seconds) => {
    const { secondsRemaining, totalSeconds, isActive } = get()
    if (!isActive) return
    const nextVal = Math.max(0, secondsRemaining + seconds)
    set({
      secondsRemaining: nextVal,
      totalSeconds: Math.max(totalSeconds, nextVal),
    })
  },

  tick: () => {
    const { secondsRemaining, isActive, isPaused, stopTimer } = get()
    if (!isActive || isPaused) return

    if (secondsRemaining <= 1) {
      stopTimer()
      // Trigger Web Audio Beep sound when it hits zero!
      playTimerBeep()
    } else {
      set({ secondsRemaining: secondsRemaining - 1 })
    }
  },
}))

/**
 * Native Web Audio sound synthesizer (compatible offline, no files needed)
 */
function playTimerBeep() {
  if (typeof window === "undefined") return
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = "sine"
    osc.frequency.setValueAtTime(880, ctx.currentTime) // High A note
    gain.gain.setValueAtTime(0.08, ctx.currentTime)

    // Play short beep sequence
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
    
    // Play second beep shortly after
    setTimeout(() => {
      try {
        const ctx2 = new AudioContext()
        const osc2 = ctx2.createOscillator()
        const gain2 = ctx2.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx2.destination)
        osc2.type = "sine"
        osc2.frequency.setValueAtTime(880, ctx2.currentTime)
        gain2.gain.setValueAtTime(0.08, ctx2.currentTime)
        osc2.start()
        osc2.stop(ctx2.currentTime + 0.15)
      } catch (_) {}
    }, 200)
  } catch (e) {
    console.warn("[RestTimer] Web Audio API playback failed:", e)
  }
}
