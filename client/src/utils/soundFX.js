// ============================================================
// GITROAST — Web Audio API Synthesizer & Sound FX Engine
// ============================================================
/**
 * WHAT: Zero-asset, zero-network dynamic sound synthesizer powered by the browser's native Web Audio API.
 *       Generates tactile clicks, fiery whooshes, victory chimes, and bass drops programmatically.
 * 
 * WHY:
 *   - Loading external audio files (.mp3/.wav) causes network latency, 404 hazards, CORS issues,
 *     and unnecessary bundle bloat.
 *   - Synthesizing tones directly via AudioContext oscillators and gain envelopes produces 0ms latency,
 *     zero network overhead, and operates 100% offline.
 *   - Statefully respects persistent user mute preferences via localStorage ('gitroast_sound_muted').
 * 
 * WHERE & WHEN TO USE:
 *   - On interactive UI events: button clicks (playClick), roast generation (playFireSizzle),
 *     badge/link copies (playSuccess), and battle verdicts (playBurn).
 * 
 * USE CASES:
 *   - Sound feedback when user selects a roast persona or intensity chip.
 *   - Fiery explosion when roast results reveal.
 *   - Melodic feedback when copying markdown badge in /dashboard.
 * 
 * WHEN NOT TO USE:
 *   - Never auto-play loud sounds without prior user gesture (browser autoplay policy compliance).
 *   - Do not invoke inside Server-Side Rendering (SSR) passes (guarded by typeof window checks).
 */

const MUTE_KEY = 'gitroast_sound_muted'

let audioCtx = null

/**
 * WHAT: Lazily initializes and resumes the shared browser AudioContext.
 * WHY: Browsers require user interaction before playing audio; lazy initialization guarantees compliance.
 * WHERE & WHEN TO USE: Called internally before triggering any sound synthesis.
 * USE CASES: AudioContext creation after first user click/touch.
 * WHEN NOT TO USE: During SSR or headless automated node tests.
 */
function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null

  if (!audioCtx) {
    audioCtx = new AudioContextClass()
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }

  return audioCtx
}

/**
 * Checks whether user has explicitly muted sound effects.
 * @returns {boolean}
 */
export function isMuted() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Sets explicit sound mute state.
 * @param {boolean} muted
 */
export function setMuted(muted) {
  if (typeof window === 'undefined') return
  try {
    if (muted) {
      window.localStorage.setItem(MUTE_KEY, '1')
    } else {
      window.localStorage.removeItem(MUTE_KEY)
    }
    // Dispatch custom event so UI components (e.g. SoundToggle) synchronize instantly
    if (typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gitroast-sound-toggle', { detail: { muted } }))
    }
  } catch {}
}

/**
 * Toggles sound mute state and returns the new value.
 * @returns {boolean}
 */
export function toggleMute() {
  const current = isMuted()
  setMuted(!current)
  return !current
}

/**
 * WHAT: Plays a subtle mechanical keyboard click for buttons and tabs.
 * WHY: Provides tactile feedback on navigation and selection micro-interactions.
 * WHERE & WHEN TO USE: On tab switching, intensity selecting, persona picking.
 * USE CASES: Clicking "Desi Tech Lead" or "Wall of Shame" tabs.
 * WHEN NOT TO USE: When muted or during automated rapid polling loops.
 */
export function playClick() {
  if (isMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04)

    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.04)
  } catch {}
}

/**
 * WHAT: Synthesizes a fiery whoosh and sizzle sound using randomized noise and resonant filtering.
 * WHY: Accentuates the signature GitRoast fire theme when a roast begins or lands.
 * WHERE & WHEN TO USE: When user triggers "ROAST MY GITHUB" or receives final burn text.
 * USE CASES: High-energy roast completion celebrations.
 * WHEN NOT TO USE: When muted or in rapid loop animations.
 */
export function playFireSizzle() {
  if (isMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const bufferSize = ctx.sampleRate * 0.4
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(300, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.2)
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4)
    filter.Q.setValueAtTime(3.0, ctx.currentTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + 0.4)
  } catch {}
}

/**
 * WHAT: Synthesizes an ascending 3-note harmonic chime (C5, E5, G5).
 * WHY: Provides crisp, satisfying positive reinforcement for completed actions.
 * WHERE & WHEN TO USE: On successful badge copy, profile save, or payment confirmation.
 * USE CASES: 1-click Markdown badge copy in dashboard.
 * WHEN NOT TO USE: On error states or warning prompts.
 */
export function playSuccess() {
  if (isMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.08
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.09, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.25)
    })
  } catch {}
}

/**
 * WHAT: Synthesizes a deep sub-bass impact with exponential pitch decay.
 * WHY: Emphasizes savage verdicts, low grades, or dev battle KO announcements.
 * WHERE & WHEN TO USE: Battle winner reveal, F- grade badge landing.
 * USE CASES: Developer Battle winner conclusion.
 * WHEN NOT TO USE: For minor UI clicks or light notifications.
 */
export function playBurn() {
  if (isMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(140, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.35)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35)

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch {}
}
