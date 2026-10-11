// Audio manager. Tries the specified MP3 files first (public/assets/audio/*.mp3);
// if a file is missing it falls back to a small synthesized ambient loop, so missing
// audio can never crash the game. Everything starts only after a user gesture.

type Sfx = 'click' | 'coin' | 'portal' | 'success' | 'fail' | 'alert' | 'warn' | 'victory' | 'blip' | 'swipe'

export const WORLD_MUSIC: Record<number, string> = {
  0: 'bgm_title.mp3',
  1: 'bgm_acoustic_frontier.mp3',
  2: 'bgm_marble_halls.mp3',
  3: 'bgm_dark_granite.mp3',
  4: 'bgm_industrial_exchange.mp3',
  5: 'bgm_celestial_sovereign.mp3',
}
// Root frequency + scale for each world's fallback ambience (gives every world its own mood).
const MOODS: Record<number, { root: number; scale: number[]; wave: OscillatorType }> = {
  0: { root: 110, scale: [0, 3, 7, 10, 14], wave: 'sine' },
  1: { root: 98, scale: [0, 2, 4, 7, 9], wave: 'triangle' },      // pentatonic, acoustic
  2: { root: 130.8, scale: [0, 4, 7, 11, 14], wave: 'sine' },      // calm major 7
  3: { root: 73.4, scale: [0, 1, 5, 7, 8], wave: 'sawtooth' },    // dark phrygian
  4: { root: 110, scale: [0, 2, 5, 7, 10], wave: 'square' },       // busy, mechanical
  5: { root: 146.8, scale: [0, 4, 7, 9, 14], wave: 'sine' },       // bright, celestial
}

class AudioManager {
  /** Files present in public/assets/audio, read from manifest.json. Missing manifest = synth only. */
  private available: Set<string> | null = null
  private loadManifest() {
    if (this.available) return Promise.resolve(this.available)
    return fetch('./assets/audio/manifest.json')
      .then(r => (r.ok ? r.json() : { files: [] }))
      .catch(() => ({ files: [] }))
      .then((m: { files?: string[] }) => (this.available = new Set(Array.isArray(m.files) ? m.files : [])))
  }

  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private el: HTMLAudioElement | null = null
  private synthTimer: number | null = null
  private current = -1
  musicOn = true
  sfxOn = true
  volume = 0.6

  /** Must be called from a click/keypress (browser autoplay rules). */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain(); this.master.gain.value = this.volume; this.master.connect(this.ctx.destination)
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.18; this.musicGain.connect(this.master)
      if (this.current >= 0) { const w = this.current; this.current = -1; this.playMusic(w) }
    } catch { /* no audio support: stay silent */ }
  }

  setPrefs(music: boolean, sfx: boolean, volume: number) {
    this.musicOn = music; this.sfxOn = sfx; this.volume = volume
    if (this.master) this.master.gain.value = volume
    if (this.el) this.el.volume = volume * 0.5
    if (!music) this.stopMusic()
    else if (this.current >= 0 && !this.el && this.synthTimer === null) { const w = this.current; this.current = -1; this.playMusic(w) }
  }

  playMusic(world: number) {
    if (this.current === world && (this.el || this.synthTimer !== null)) return
    this.stopMusic()
    this.current = world
    if (!this.musicOn || !this.ctx) return
    const file = WORLD_MUSIC[world] ?? ''
    void this.loadManifest().then(files => {
      if (this.current !== world || this.el || this.synthTimer !== null) return
      if (files.has(file)) this.playFile(world, file)
      else this.startSynth(world)
    })
  }

  private playFile(world: number, file: string) {
    const el = new Audio(`./assets/audio/${file}`)
    el.loop = true; el.volume = this.volume * 0.5
    el.addEventListener('error', () => { if (this.el === el) { this.el = null; this.startSynth(world) } }, { once: true })
    this.el = el
    el.play().catch(() => { if (this.el === el) { this.el = null; this.startSynth(world) } })
  }

  stopMusic() {
    if (this.el) { this.el.pause(); this.el = null }
    if (this.synthTimer !== null) { clearInterval(this.synthTimer); this.synthTimer = null }
  }

  /** Gentle generative pad: one soft chord tone every ~1.4s from the world's scale. */
  private startSynth(world: number) {
    if (!this.ctx || !this.musicGain || !this.musicOn) return
    const mood = MOODS[world] ?? MOODS[0]
    let step = 0
    const tick = () => {
      if (!this.ctx || !this.musicGain) return
      const t = this.ctx.currentTime
      const deg = mood.scale[(step * 3 + (step >> 2)) % mood.scale.length]
      const f = mood.root * Math.pow(2, deg / 12) * (step % 8 === 0 ? 0.5 : 1)
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain()
      o.type = mood.wave; o.frequency.value = f
      const peak = mood.wave === 'sine' ? 0.5 : mood.wave === 'triangle' ? 0.35 : 0.08
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.4); g.gain.exponentialRampToValueAtTime(0.001, t + 3.2)
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + 3.3)
      step++
    }
    tick()
    this.synthTimer = window.setInterval(tick, 1400)
  }

  sfx(name: Sfx) {
    if (!this.sfxOn || !this.ctx || !this.master) return
    const ctx = this.ctx, t = ctx.currentTime
    const tone = (f: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.12, slideTo?: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = type; o.frequency.setValueAtTime(f, t + start)
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + start + dur)
      g.gain.setValueAtTime(vol, t + start); g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur)
      o.connect(g); g.connect(this.master!); o.start(t + start); o.stop(t + start + dur + 0.02)
    }
    switch (name) {
      case 'click': tone(660, 0, 0.05, 'square', 0.06); break
      case 'blip': tone(520 + Math.random() * 80, 0, 0.025, 'square', 0.025); break
      case 'swipe': tone(400, 0, 0.12, 'triangle', 0.08, 900); break
      case 'coin': [988, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.07, 0.12, 'square', 0.07)); break
      case 'success': [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.18, 'triangle', 0.12)); break
      case 'fail': tone(330, 0, 0.25, 'sawtooth', 0.08, 140); break
      case 'warn': tone(440, 0, 0.12, 'square', 0.08); tone(440, 0.18, 0.12, 'square', 0.08); break
      case 'alert': for (let i = 0; i < 4; i++) tone(i % 2 ? 660 : 880, i * 0.12, 0.1, 'square', 0.08); break
      case 'portal': tone(110, 0, 1.6, 'sine', 0.2, 880); tone(220, 0.2, 1.4, 'triangle', 0.08, 1320); break
      case 'victory': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.12)); break
    }
  }
}

export const audio = new AudioManager()
