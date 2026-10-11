// Run: node --experimental-strip-types tests/finance.test.ts
import assert from 'node:assert/strict'
import * as F from '../src/lib/finance.ts'
import * as S from '../src/lib/sims.ts'

const near = (a: number, b: number, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`)

// World 1
assert.equal(F.unitPrice(2000, 25), 80)
assert.equal(F.unitPrice(900, 10), 90)
assert.equal(F.unitPrice(1275, 15), 85)

// World 3
near(F.effectiveAnnual(0.05), 0.7959, 0.0001)
near(F.nominalAnnual(0.05), 0.6, 1e-9)
near(F.emi(14000, 0.01, 12), 1243.88, 0.01)
const sched = F.amortize(14000, 0.01, 12)
near(sched[11].closing, 0, 0.01)
near(sched.reduce((s, r) => s + r.principal, 0), 14000, 0.01)
near(F.summarizeLoan(14000, 0.05, 12, 'bullet').totalPaid, 14000 * 1.05 ** 12, 0.01)
console.log('EMI 14k@1%x12', F.emi(14000, 0.01, 12).toFixed(2), 'bullet 5% total', F.summarizeLoan(14000, 0.05, 12, 'bullet').totalPaid.toFixed(2), 'emi 5%', F.summarizeLoan(14000, 0.05, 12, 'emi').installment.toFixed(2))

// World 4
assert.equal(F.peRatio(240, F.eps(120, 8)), 16)
assert.equal(F.peRatio(450, F.eps(-30, 5)), null)

// World 5
assert.equal(F.ruleOf72(8), 9)
near(F.exactDoubling(8), 9.006, 0.001)
near(F.realReturn(0.06, 0.06), 0, 1e-12)

// Ledger: decline all temptations, min & max starting cash
for (const [w, r] of [[0, 500], [1500, 500]]) {
  let s = S.ledgerInit(w, r)
  for (let d = 0; d < 30; d++) s = S.ledgerStep(s, () => false)
  console.log('ledger decline-all start', w + r, '→ final', s.wallet + s.reserve, 'failed', s.failedOn)
  assert.ok(s.wallet + s.reserve >= S.LEDGER_TARGET)
}
{ let s = S.ledgerInit(1500, 500); for (let d = 0; d < 30; d++) s = S.ledgerStep(s, () => true)
  console.log('ledger buy-all final', s.wallet + s.reserve, 'failedOn', s.failedOn) }

// Credit: perfect play
{ let c = S.creditInit(650); for (let m = 0; m < 6; m++) c = S.creditStep(c, { payEquipment: true, acceptVanity: false })
  const v = S.creditVerdict(c); console.log('credit perfect', c.score, v.win, 'EMI', S.EQUIPMENT_EMI); assert.ok(v.win) }
{ let c = S.creditInit(650); for (let m = 0; m < 6; m++) c = S.creditStep(c, { payEquipment: true, acceptVanity: true })
  const v = S.creditVerdict(c); console.log('credit with vanity', c.score, v); assert.ok(!v.win) }

// Market
for (const ch of ['hold', 'panic', 'rebalance', 'topup'] as const) {
  const p = S.marketPath(10000, ch, 2000); console.log('market', ch, p.values.map(v => Math.round(v)).join(' → '))
}

// Trial: good vs bad playthrough
const good: S.YearChoices = { lifestyle: 'balanced', allocation: 'emergency-first', style: 'diversified', insured: true }
const bad: S.YearChoices = { lifestyle: 'lavish', allocation: 'invest-all', style: 'hot-stock', insured: false }
for (const [name, ch, risky] of [['good', good, false], ['bad', bad, true], ['mixed', { ...good, lifestyle: 'lavish' as const }, false]] as const) {
  let t = S.trialInit(20000, 10000, 1244, 6)
  for (let y = 1; y <= 10; y++) t = S.trialYear(t, ch, y === 3 || y === 5 || y === 8 ? false : risky)
  const sc = S.trialScore(t)
  console.log('trial', name, Math.round(sc.netWorth), sc.overall, sc.passed, JSON.stringify(sc.pillars))
}
console.log('ALL FINANCE TESTS PASSED')
