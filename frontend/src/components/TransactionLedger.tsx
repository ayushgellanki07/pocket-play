import { useGame } from '../store/gameStore.ts'
import { keyText, useT } from '../i18n/useT.ts'
import { inr } from '../lib/finance.ts'
import { Modal } from './ui/Modal.tsx'

export function TransactionLedger({ onClose }: { onClose: () => void }) {
  const t = useT()
  const tx = useGame(s => s.transactions)
  const { wallet, reserve, portfolio, loans } = useGame()
  const invested = portfolio.etf + portfolio.stock + portfolio.gold + portfolio.cash
  return (
    <Modal title={t('ledger.title')} onClose={onClose} labelClose={t('common.close')} wide>
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div className="rounded bg-black/30 p-2">{t('hud.wallet')}<br /><b className="font-pixel text-lg">{inr(wallet)}</b></div>
        <div className="rounded bg-black/30 p-2">{t('hud.reserve')}<br /><b className="font-pixel text-lg">{inr(reserve)}</b></div>
        <div className="rounded bg-black/30 p-2">{t('tx.portfolio')}<br /><b className="font-pixel text-lg">{inr(invested)}</b></div>
        <div className="rounded bg-black/30 p-2">{t('tx.loans')}<br /><b className="font-pixel text-lg">{inr(loans.reduce((s, l) => s + l.remaining, 0))}</b></div>
      </div>
      {tx.length === 0 ? <p className="text-parchment/60">{t('ledger.empty')}</p> : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-parchment/50"><tr><th className="py-1">{t('tx.colWorld')}</th><th>{t('tx.colItem')}</th><th>{t('tx.colAccount')}</th><th className="text-right">{t('tx.colAmount')}</th></tr></thead>
          <tbody>
            {[...tx].reverse().map(r => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="py-1.5 text-parchment/50">{r.world}</td>
                <td>{keyText(t, r.label, r.vars)}</td>
                <td className="text-parchment/60">{t(`acct.${r.account}`)}</td>
                <td className={`text-right font-mono ${r.amount >= 0 ? 'text-good' : 'text-bad'}`}>{r.amount >= 0 ? '+' : ''}{inr(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  )
}
