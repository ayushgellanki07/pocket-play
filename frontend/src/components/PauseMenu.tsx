import { useState } from 'react'
import { Play, Home, Trash2, Settings, LayoutGrid, Map } from 'lucide-react'
import { Logo } from './Logo.tsx'
import { useGame } from '../store/gameStore.ts'
import { useT } from '../i18n/useT.ts'
import { Modal } from './ui/Modal.tsx'
import { LanguageSelector } from './LanguageSelector.tsx'
import { audio } from '../lib/audio.ts'

/** Settings: music, SFX, volume, language. Used by both the pause menu and the title screen. */
export function SettingsPanel() {
  const t = useT()
  const a = useGame(s => s.audio)
  const setAudio = useGame(s => s.setAudio)
  return (
    <div className="space-y-3 rounded border border-white/10 bg-black/25 p-3">
      <h3 className="flex items-center gap-2 font-pixel text-[var(--accent)]"><Settings size={16} aria-hidden />{t('pause.settings')}</h3>
      <label className="flex items-center justify-between gap-3"><span>{t('pause.music')}</span>
        <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={a.music} onChange={e => { audio.unlock(); setAudio({ music: e.target.checked }) }} /></label>
      <label className="flex items-center justify-between gap-3"><span>{t('pause.sfx')}</span>
        <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={a.sfx} onChange={e => { audio.unlock(); setAudio({ sfx: e.target.checked }) }} /></label>
      <label className="block"><span>{t('pause.volume')}</span>
        <input type="range" min={0} max={1} step={0.05} value={a.volume} onChange={e => setAudio({ volume: +e.target.value })} /></label>
      <div className="flex items-center justify-between gap-3"><span>{t('title.language')}</span><LanguageSelector /></div>
    </div>
  )
}

export function PauseMenu({ onClose }: { onClose: () => void }) {
  const t = useT()
  const setPhase = useGame(s => s.setPhase)
  const reset = useGame(s => s.resetProgress)
  const [confirm, setConfirm] = useState(false)
  return (
    <Modal title={t('pause.title')} onClose={onClose} labelClose={t('common.close')}>
      <div className="space-y-4">
        <div className="text-center"><Logo size="sm" /></div>
        <button className="btn w-full" onClick={onClose} autoFocus><Play size={16} aria-hidden />{t('pause.resume')}</button>
        <SettingsPanel />
        <div className="grid gap-2 sm:grid-cols-3">
          <button className="btn btn-ghost" onClick={() => { onClose(); setPhase('map') }}><Map size={16} aria-hidden />{t('hud.mapHub')}</button>
          <button className="btn btn-ghost" onClick={() => { onClose(); setPhase('direct') }}><LayoutGrid size={16} aria-hidden />{t('pause.toDirect')}</button>
          <button className="btn btn-ghost" onClick={() => { onClose(); setPhase('modes') }}><Home size={16} aria-hidden />{t('pause.mainMenu')}</button>
        </div>
        {!confirm ? (
          <button className="btn btn-ghost w-full !text-bad" onClick={() => setConfirm(true)}><Trash2 size={16} aria-hidden />{t('pause.reset')}</button>
        ) : (
          <div className="rounded border-2 border-bad/60 bg-bad/10 p-3" role="alertdialog" aria-label={t('pause.reset')}>
            <p className="mb-3 text-sm">{t('pause.resetConfirm')}</p>
            <div className="flex gap-2">
              <button className="btn btn-bad" onClick={() => { onClose(); reset() }}>{t('pause.resetYes')}</button>
              <button className="btn btn-ghost" onClick={() => setConfirm(false)}>{t('common.cancel')}</button>
            </div>
          </div>
        )}
        <p className="text-center text-xs text-parchment/50">{t('disclaimer')}</p>
      </div>
    </Modal>
  )
}
