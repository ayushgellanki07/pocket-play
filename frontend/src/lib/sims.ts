// Deterministic simulations behind the boss challenges.
// Every number here is a documented *teaching assumption*, not a forecast or real product data.
import { clamp, emi } from './finance.ts'

/* =========================================================
   World 1 boss — Outpost Ledger: 30 days of cash flow
   ========================================================= */
export type LedgerEventType = 'income' | 'bill' | 'emergency' | 'temptation'
/** `label` is an i18n key (ev.*). */
export interface LedgerEvent { day: number; type: LedgerEventType; label: string; amount: number }

export const LEDGER_WAGE = 12000
export const LEDGER_TARGET = 2000
export const LEDGER_EVENTS: LedgerEvent[] = [
  { day: 1, type: 'income', label: 'ev.wage', amount: LEDGER_WAGE },
  { day: 3, type: 'temptation', label: 'ev.boots', amount: 1500 },
  { day: 7, type: 'bill', label: 'ev.rent', amount: 2000 },
  { day: 10, type: 'temptation', label: 'ev.show', amount: 400 },
  { day: 14, type: 'bill', label: 'ev.rent', amount: 2000 },
  { day: 16, type: 'temptation', label: 'ev.bet', amount: 1200 },
  { day: 18, type: 'emergency', label: 'ev.water', amount: 1500 },
  { day: 21, type: 'bill', label: 'ev.rent', amount: 2000 },
  { day: 24, type: 'temptation', label: 'ev.lantern', amount: 2000 },
  { day: 28, type: 'bill', label: 'ev.rent', amount: 2000 },
]

export interface LedgerState {
  day: number
  wallet: number
  reserve: number
  history: number[] // total balance at end of each day
  log: { day: number; label: string; amount: number; account: 'wallet' | 'reserve' }[]
  failedOn: number | null
}

export function ledgerInit(wallet: number, reserve: number): LedgerState {
  return { day: 0, wallet, reserve, history: [wallet + reserve], log: [], failedOn: null }
}

/** Pay an amount: wallet first, then the reserve. Marks failure if both run dry. */
function pay(s: LedgerState, label: string, amount: number) {
  const fromWallet = Math.min(s.wallet, amount)
  if (fromWallet > 0) { s.wallet -= fromWallet; s.log.push({ day: s.day, label, amount: -fromWallet, account: 'wallet' }) }
  const rest = amount - fromWallet
  if (rest > 0) {
    const fromReserve = Math.min(s.reserve, rest)
    if (fromReserve > 0) { s.reserve -= fromReserve; s.log.push({ day: s.day, label, amount: -fromReserve, account: 'reserve' }) }
    if (rest - fromReserve > 0.001) s.failedOn = s.day
  }
}

/**
 * Advance one day. `decisions[day] === true` means the player bought that day's temptation.
 * Returns a new state object (we never mutate the previous one, which keeps React happy).
 */
export function ledgerStep(prev: LedgerState, buy: (e: LedgerEvent) => boolean): LedgerState {
  const s: LedgerState = { ...prev, history: [...prev.history], log: [...prev.log], day: prev.day + 1 }
  for (const e of LEDGER_EVENTS.filter(e => e.day === s.day)) {
    if (e.type === 'income') { s.wallet += e.amount; s.log.push({ day: s.day, label: e.label, amount: e.amount, account: 'wallet' }) }
    else if (e.type === 'temptation') { if (buy(e)) pay(s, e.label, e.amount) }
    else pay(s, e.label, e.amount)
  }
  s.history.push(s.wallet + s.reserve)
  return s
}

/* =========================================================
   World 3 — EMI & credit-score simulator (6 months)
   Educational scoring model — NOT the official CIBIL formula.
   ========================================================= */
export const CREDIT_RULES = {
  onTime: 20,          // each on-time EMI
  missed: -60,         // each missed EMI
  newLoan: -15,        // hard enquiry + new debt
  overburdened: -10,   // month ends with EMI-to-income above 30%
  min: 300,
  max: 900,
}
export const EMI_INCOME = 8000
export const EMI_EXPENSES = 4000
export const EQUIPMENT_LOAN = { principal: 14000, annualRate: 0.12, months: 12 }
export const EQUIPMENT_EMI = Math.round(emi(EQUIPMENT_LOAN.principal, EQUIPMENT_LOAN.annualRate / 12, EQUIPMENT_LOAN.months))
/** `label` is an i18n key. */
export const VANITY_OFFERS: Record<number, { label: string; emi: number }> = {
  2: { label: 'vanity.carriage', emi: 1800 },
  5: { label: 'vanity.feast', emi: 900 },
}
/** A message saved as an i18n key plus values ("...Key" values are keys themselves) — translated when shown. */
export interface KeyMsg { key: string; vars?: Record<string, string | number> }

export interface CreditMonthInput { payEquipment: boolean; acceptVanity: boolean }
export interface CreditState {
  month: number
  score: number
  cash: number
  vanityEmis: number[]
  missed: number
  acceptedVanity: number
  ratioHistory: number[]
  scoreHistory: number[]
  notes: KeyMsg[]
}

export const creditInit = (score: number): CreditState => ({
  month: 0, score, cash: 1000, vanityEmis: [], missed: 0, acceptedVanity: 0, ratioHistory: [], scoreHistory: [score], notes: [],
})

export function creditStep(prev: CreditState, input: CreditMonthInput): CreditState {
  const s: CreditState = { ...prev, vanityEmis: [...prev.vanityEmis], ratioHistory: [...prev.ratioHistory], scoreHistory: [...prev.scoreHistory], notes: [] }
  s.month += 1
  const offer = VANITY_OFFERS[s.month]
  if (offer && input.acceptVanity) {
    s.vanityEmis.push(offer.emi); s.acceptedVanity += 1; s.score += CREDIT_RULES.newLoan
    s.notes.push({ key: 'cn.newLoan', vars: { offerKey: offer.label, pts: CREDIT_RULES.newLoan } })
  }
  s.cash += EMI_INCOME - EMI_EXPENSES
  const vanityTotal = s.vanityEmis.reduce((a, b) => a + b, 0)
  s.cash -= vanityTotal
  const canPay = s.cash >= EQUIPMENT_EMI
  if (input.payEquipment && canPay) {
    s.cash -= EQUIPMENT_EMI; s.score += CREDIT_RULES.onTime; s.notes.push({ key: 'cn.onTime', vars: { pts: CREDIT_RULES.onTime } })
  } else {
    s.missed += 1; s.score += CREDIT_RULES.missed
    s.notes.push({ key: canPay ? 'cn.skipped' : 'cn.noCash', vars: { pts: CREDIT_RULES.missed } })
  }
  const ratio = (EQUIPMENT_EMI + vanityTotal) / EMI_INCOME
  s.ratioHistory.push(ratio)
  if (ratio > 0.3) { s.score += CREDIT_RULES.overburdened; s.notes.push({ key: 'cn.over', vars: { ratio: (ratio * 100).toFixed(0), pts: CREDIT_RULES.overburdened } }) }
  s.score = clamp(s.score, CREDIT_RULES.min, CREDIT_RULES.max)
  s.scoreHistory.push(s.score)
  return s
}

export function creditVerdict(s: CreditState) {
  const maxRatio = Math.max(0, ...s.ratioHistory)
  return {
    allOnTime: s.missed === 0,
    noVanity: s.acceptedVanity === 0,
    ratioOk: maxRatio <= 0.3,
    scoreOk: s.score >= 750,
    maxRatio,
    win: s.missed === 0 && s.acceptedVanity === 0 && maxRatio <= 0.3 && s.score >= 750,
  }
}

/* =========================================================
   World 4 boss — Market cycle (5 years, deterministic)
   ========================================================= */
export type Asset = 'etf' | 'stock' | 'gold'
export const MARKET_RETURNS: Record<Asset, number[]> = {
  etf: [0.12, 0.08, -0.20, 0.18, 0.12],   // index fund: the Year-3 bear market is −20%
  stock: [0.15, 0.06, -0.25, 0.22, 0.14], // single value stock: swings harder
  gold: [0.05, 0.03, 0.10, 0.02, 0.04],   // gold often (not always) holds up in crashes
}
export const MARKET_FEES: Record<Asset, number> = { etf: 0.002, stock: 0, gold: 0.005 } // annual
export const CASH_RATE = 0.03
export const TARGET_MIX: Record<Asset, number> = { etf: 0.7, stock: 0.2, gold: 0.1 }

export interface Holdings { etf: number; stock: number; gold: number; cash: number }
export const holdingsTotal = (h: Holdings) => h.etf + h.stock + h.gold + h.cash

export function marketYear(h: Holdings, yearIndex: number): Holdings {
  const g = (a: Asset) => h[a] * (1 + MARKET_RETURNS[a][yearIndex]) * (1 - MARKET_FEES[a])
  return { etf: g('etf'), stock: g('stock'), gold: g('gold'), cash: h.cash * (1 + CASH_RATE) }
}
export function rebalance(h: Holdings): Holdings {
  const t = h.etf + h.stock + h.gold
  return { etf: t * TARGET_MIX.etf, stock: t * TARGET_MIX.stock, gold: t * TARGET_MIX.gold, cash: h.cash }
}
export const panicSell = (h: Holdings): Holdings => ({ etf: 0, stock: 0, gold: 0, cash: holdingsTotal(h) })

/** Runs a full path so the UI can show "what if you had…" comparisons. */
export function marketPath(start: number, crashChoice: 'hold' | 'panic' | 'rebalance' | 'topup', topUp = 0) {
  let h: Holdings = { etf: start * 0.7, stock: start * 0.2, gold: start * 0.1, cash: 0 }
  const values = [start]
  for (let y = 0; y < 5; y++) {
    h = marketYear(h, y)
    if (y === 2) {
      if (crashChoice === 'panic') h = panicSell(h)
      if (crashChoice === 'rebalance') h = rebalance(h)
      if (crashChoice === 'topup') h = rebalance({ ...h, etf: h.etf + topUp })
    }
    values.push(holdingsTotal(h))
  }
  return { values, final: h }
}

/* =========================================================
   World 5 — Master Sovereign Trial (10 years)
   Cash flows land at year-end; market returns apply to the opening balance.
   ========================================================= */
export type Lifestyle = 'frugal' | 'balanced' | 'lavish'
export type Allocation = 'emergency-first' | 'invest-all' | 'cash'
export type Style = 'diversified' | 'hot-stock' | 'savings'
export interface YearChoices { lifestyle: Lifestyle; allocation: Allocation; style: Style; insured: boolean }

export const TRIAL = {
  salary: 40000,           // monthly, Year 1
  essentials: 24000,       // monthly, Year 1
  raise: 0.06,
  inflation: 0.06,
  inflationShockYear: 9,
  inflationShock: 0.09,
  premium: 15000,          // annual health cover, Year-1 prices
  savingsRate: 0.035,
  debtRate: 0.24,          // emergency borrowing if you run out
  lifestyle: { frugal: 3000, balanced: 6000, lavish: 12000 } as Record<Lifestyle, number>,
  diversified: [0.09, 0.11, -0.04, 0.12, 0.08, -0.15, 0.18, 0.10, 0.07, 0.09],
  hotStock: [0.35, -0.30, 0.25, -0.45, 0.20, -0.40, 0.30, -0.20, 0.15, -0.25],
  fee: 0.005,              // annual fund fee on the diversified mix
  vanityEmi: 4000, vanityRate: 0.18, vanityMonths: 36,
  goal: 600000,            // home down-payment goal (nominal, by Year 10)
}

/** Event text is translated: tev.<year>.{title,body,risky,safe}. `hasChoice` = the card offers a risky/safe pick. */
export interface TrialEvent { year: number; kind: 'temptation' | 'scam' | 'shock' | 'market' | 'inflation' | 'goal'; hasChoice: boolean }
export const TRIAL_EVENTS: TrialEvent[] = [
  { year: 1, kind: 'temptation', hasChoice: true },
  { year: 2, kind: 'scam', hasChoice: true },
  { year: 3, kind: 'shock', hasChoice: false },
  { year: 4, kind: 'temptation', hasChoice: true },
  { year: 5, kind: 'shock', hasChoice: false },
  { year: 6, kind: 'market', hasChoice: true },
  { year: 7, kind: 'scam', hasChoice: true },
  { year: 8, kind: 'shock', hasChoice: false },
  { year: 9, kind: 'inflation', hasChoice: true },
  { year: 10, kind: 'goal', hasChoice: true },
]

export interface TrialState {
  year: number
  salary: number
  essentials: number
  priceIndex: number
  cash: number
  ef: number
  div: number
  hot: number
  debt: number
  vanityLeft: number
  existingEmi: number
  existingLeft: number
  flags: {
    lavishYears: number; tempted: number; scamsRejected: number; scamsFailed: number; panicSold: boolean
    tookDebt: boolean; debtInJobLoss: boolean; vanity: boolean; diversifiedYears: number; cashYears: number
    hotYears: number; investedIdleCash: boolean; uninsuredHit: boolean
  }
  history: { year: number; netWorth: number; real: number }[]
  log: { year: number; text: string; vars?: Record<string, string | number>; amount?: number }[] // text = i18n key (tl.*)
}

export function trialInit(startCash: number, startInvested: number, existingEmi: number, existingLeft: number): TrialState {
  const s: TrialState = {
    year: 0, salary: TRIAL.salary, essentials: TRIAL.essentials, priceIndex: 1,
    cash: startCash, ef: 0, div: startInvested, hot: 0, debt: 0, vanityLeft: 0,
    existingEmi, existingLeft,
    flags: { lavishYears: 0, tempted: 0, scamsRejected: 0, scamsFailed: 0, panicSold: false, tookDebt: false, debtInJobLoss: false, vanity: false, diversifiedYears: 0, cashYears: 0, hotYears: 0, investedIdleCash: false, uninsuredHit: false },
    history: [], log: [],
  }
  s.history.push({ year: 0, netWorth: trialNetWorth(s), real: trialNetWorth(s) })
  return s
}

const vanityOutstanding = (left: number) => {
  if (left <= 0) return 0
  const r = TRIAL.vanityRate / 12
  return TRIAL.vanityEmi * (1 - Math.pow(1 + r, -left)) / r
}
export const trialNetWorth = (s: TrialState) => s.cash + s.ef + s.div + s.hot - s.debt - vanityOutstanding(s.vanityLeft)
export const efTarget = (s: TrialState) => 6 * s.essentials

/** Simulates one year. `risky` = the player picked the risky option on that year's event card. */
export function trialYear(prev: TrialState, c: YearChoices, risky: boolean): TrialState {
  const s: TrialState = structuredClone(prev)
  const y = (s.year += 1)
  const log = (text: string, amount?: number, vars?: Record<string, string | number>) => s.log.push({ year: y, text, amount, vars })
  const i = y - 1

  // 1) Markets move on what you already hold.
  s.div *= (1 + TRIAL.diversified[i]) * (1 - TRIAL.fee)
  s.hot *= 1 + TRIAL.hotStock[i]
  s.cash *= 1 + TRIAL.savingsRate
  s.ef *= 1 + TRIAL.savingsRate
  if (s.debt > 0) { s.debt *= 1 + TRIAL.debtRate; log('tl.debtGrew', -s.debt * (TRIAL.debtRate / (1 + TRIAL.debtRate))) }

  // 2) The year's cash flow.
  const income = s.salary * 12 * (y === 5 ? 8 / 12 : 1)
  const essentials = s.essentials * 12
  const lifestyle = TRIAL.lifestyle[c.lifestyle] * s.priceIndex * 12
  const premium = c.insured ? TRIAL.premium * s.priceIndex : 0
  if (y === 1 && risky) { s.vanityLeft = TRIAL.vanityMonths; s.flags.vanity = true; s.flags.tempted++ }
  const vanityMonths = Math.min(12, s.vanityLeft)
  const vanityPay = vanityMonths * TRIAL.vanityEmi
  s.vanityLeft -= vanityMonths
  const loanMonths = Math.min(12, s.existingLeft)
  const loanPay = loanMonths * s.existingEmi
  s.existingLeft -= loanMonths

  log(y === 5 ? 'tl.salaryJobLoss' : 'tl.salary', income)
  log('tl.essentials', -essentials)
  log('tl.lifestyle', -lifestyle, { lifeKey: `life.${c.lifestyle}` })
  if (premium) log('tl.premium', -premium)
  if (vanityPay) log('tl.bikeEmi', -vanityPay)
  if (loanPay) log('tl.equipEmi', -loanPay)

  let pool = income - essentials - lifestyle - premium - vanityPay - loanPay

  // 3) The event.
  let shock = 0
  if (y === 2) { if (risky) { shock += 40000; s.flags.scamsFailed++; log('tl.otpScam', -40000) } else { s.flags.scamsRejected++; log('tl.scamBlocked') } }
  if (y === 3) { const bill = c.insured ? 10000 : 180000; if (!c.insured) s.flags.uninsuredHit = true; shock += bill; log(c.insured ? 'tl.copay' : 'tl.uninsured', -bill) }
  if (y === 4 && risky) { shock += 120000; s.flags.tempted++; log('tl.holiday', -120000) }
  if (y === 7) { if (risky) { shock += 50000; s.flags.scamsFailed++; log('tl.ponziLost', -50000) } else { s.flags.scamsRejected++; log('tl.ponziBlocked') } }
  if (y === 8) { shock += 60000; log('tl.vehicle', -60000) }
  if (y === 10 && risky) { shock += 200000; s.flags.tempted++; log('tl.wedding', -200000) }
  pool -= shock

  // 4) Repay emergency debt first, cover deficits from savings (cash → EF → investments → debt).
  if (pool > 0 && s.debt > 0) { const p = Math.min(pool, s.debt); s.debt -= p; pool -= p; log('tl.repaid', -p) }
  if (pool < 0) {
    let need = -pool
    for (const k of ['cash', 'ef', 'div', 'hot'] as const) {
      const take = Math.min(s[k], need); s[k] -= take; need -= take
      if (take > 0) log('tl.covered', -take, { srcKey: `tl.src.${k}` })
    }
    if (need > 0) {
      s.debt += need; s.flags.tookDebt = true; if (y === 5) s.flags.debtInJobLoss = true
      log('tl.borrowed', need)
    }
    pool = 0
  }

  // 5) Save the surplus according to your plan.
  if (pool > 0) {
    let rest = pool
    if (c.allocation === 'emergency-first') {
      const toEf = Math.min(rest, Math.max(0, efTarget(s) - s.ef)); s.ef += toEf; rest -= toEf
      if (toEf > 0) log('tl.toEf', toEf)
    }
    if (c.allocation === 'cash') { s.cash += rest; log('tl.parked', rest) }
    else if (rest > 0) {
      if (c.style === 'diversified') { s.div += rest; log('tl.diversified', rest) }
      else if (c.style === 'hot-stock') { s.hot += rest; log('tl.hot', rest) }
      else { s.cash += rest; log('tl.parked', rest) }
    }
  }

  // 6) Decisions that move existing money.
  if (y === 6 && risky) { s.cash += s.div + s.hot; s.div = 0; s.hot = 0; s.flags.panicSold = true; log('tl.panic') }
  if (y === 9 && !risky) { s.div += s.cash; log('tl.idle', s.cash); s.cash = 0; s.flags.investedIdleCash = true }

  // 7) Bookkeeping.
  if (c.lifestyle === 'lavish') s.flags.lavishYears++
  if (c.style === 'diversified' && !(y >= 6 && s.flags.panicSold && s.div === 0)) s.flags.diversifiedYears++
  if (c.style === 'savings' || c.allocation === 'cash') s.flags.cashYears++
  if (c.style === 'hot-stock') s.flags.hotYears++
  const infl = y === TRIAL.inflationShockYear ? TRIAL.inflationShock : TRIAL.inflation
  s.priceIndex *= 1 + infl
  s.essentials *= 1 + infl
  s.salary *= 1 + TRIAL.raise
  const nw = trialNetWorth(s)
  s.history.push({ year: y, netWorth: nw, real: nw / s.priceIndex })
  return s
}

export function trialScore(s: TrialState) {
  const f = s.flags
  const nw = trialNetWorth(s)
  const pillars = {
    budget: clamp(100 - 12 * f.lavishYears - 25 * f.tempted, 0, 100),
    emergency: clamp((f.debtInJobLoss ? 0 : 40) + 30 * Math.min(1, s.ef / efTarget(s)) + (f.tookDebt ? 0 : 30), 0, 100),
    fraud: 50 * f.scamsRejected,
    debt: clamp(100 - (f.vanity ? 40 : 0) - (f.tookDebt ? 40 : 0) - (s.debt > 0 ? 20 : 0), 0, 100),
    diversification: clamp(Math.round((f.diversifiedYears / 10) * 100) - (f.panicSold ? 30 : 0) - 5 * f.hotYears, 0, 100),
    inflation: clamp(40 + (f.investedIdleCash ? 30 : 0) + (f.cashYears <= 3 ? 30 : 0), 0, 100),
    resilience: clamp(Math.round((nw / (TRIAL.goal * 2.5)) * 100) - (f.uninsuredHit ? 15 : 0), 0, 100),
  }
  const vals = Object.values(pillars)
  const overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  return {
    pillars,
    overall,
    netWorth: nw,
    realNetWorth: nw / s.priceIndex,
    passed: overall >= 70 && Math.min(...vals) >= 40 && nw >= TRIAL.goal,
  }
}
