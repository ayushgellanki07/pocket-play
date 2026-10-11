// Pure financial math. No React, no state — so every formula can be unit-tested
// and the UI only ever *displays* numbers computed here.

export const round2 = (n: number) => Math.round(n * 100) / 100
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/* ---------- Central number formatting ----------
   Numeral policy (all languages): Western digits 0–9 with Indian digit grouping (en-IN).
   Values are always stored as numbers; these helpers are only used when displaying them. */
const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** ₹1,23,456 style (Indian digit grouping). */
export const inr = (n: number, decimals = false) => (decimals ? inr2 : inr0).format(n)
export const pct = (r: number, digits = 1) => `${(r * 100).toFixed(digits)}%`
const num0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
/** Plain number with Indian grouping: 150000 → 1,50,000. */
export const num = (n: number) => num0.format(n)
/** Short rupee label for chart axes: ₹950, ₹12k, ₹1.4L, ₹2.1Cr (Indian units). */
export function inrCompact(n: number) {
  const a = Math.abs(n), sign = n < 0 ? '−' : ''
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(1)}Cr`
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(1)}L`
  if (a >= 1e3) return `${sign}₹${(a / 1e3).toFixed(a >= 1e4 ? 0 : 1)}k`
  return `${sign}₹${Math.round(a)}`
}

/* ---------- World 1: budgeting ---------- */
export const unitPrice = (price: number, qty: number) => price / qty

export function split503020(income: number) {
  return { needs: income * 0.5, wants: income * 0.3, savings: income * 0.2 }
}

/* ---------- World 2: deposits (illustrative, annual compounding) ---------- */
export const fdMaturity = (principal: number, annualRate: number, years: number) =>
  principal * Math.pow(1 + annualRate, years)

/** Recurring deposit with monthly deposits and monthly compounding (simplified teaching model). */
export function rdMaturity(monthly: number, annualRate: number, months: number) {
  const r = annualRate / 12
  let bal = 0
  for (let m = 0; m < months; m++) bal = (bal + monthly) * (1 + r)
  return bal
}

/* ---------- World 3: loans ---------- */
/** Effective annual rate when a monthly rate compounds 12 times. 5% / month → 79.6% / year. */
export const effectiveAnnual = (monthlyRate: number) => Math.pow(1 + monthlyRate, 12) - 1
/** Nominal annual rate (APR-style): just monthly × 12. 5% / month → 60%. Not the same thing! */
export const nominalAnnual = (monthlyRate: number) => monthlyRate * 12

/** Equated Monthly Instalment: P·r·(1+r)^n / ((1+r)^n − 1). */
export function emi(principal: number, monthlyRate: number, months: number) {
  if (months <= 0) return principal
  if (monthlyRate === 0) return principal / months
  const f = Math.pow(1 + monthlyRate, months)
  return (principal * monthlyRate * f) / (f - 1)
}

export interface ScheduleRow { month: number; opening: number; interest: number; principal: number; payment: number; closing: number }

/** Month-by-month amortisation table for an EMI loan. */
export function amortize(principal: number, monthlyRate: number, months: number): ScheduleRow[] {
  const pay = emi(principal, monthlyRate, months)
  const rows: ScheduleRow[] = []
  let bal = principal
  for (let m = 1; m <= months; m++) {
    const interest = bal * monthlyRate
    const prin = Math.min(pay - interest, bal)
    const closing = Math.max(0, bal - prin)
    rows.push({ month: m, opening: bal, interest, principal: prin, payment: prin + interest, closing })
    bal = closing
  }
  return rows
}

/** "Bullet" loan: nothing paid until the end, interest compounds monthly. Balance after each month. */
export function bulletSchedule(principal: number, monthlyRate: number, months: number) {
  const balances: number[] = []
  for (let m = 1; m <= months; m++) balances.push(principal * Math.pow(1 + monthlyRate, m))
  return balances
}

export interface LoanSummary { installment: number; totalPaid: number; interest: number; balances: number[] }

export function summarizeLoan(principal: number, monthlyRate: number, months: number, structure: 'emi' | 'bullet'): LoanSummary {
  if (structure === 'bullet') {
    const balances = bulletSchedule(principal, monthlyRate, months)
    const total = balances[balances.length - 1] ?? principal
    return { installment: total, totalPaid: total, interest: total - principal, balances }
  }
  const rows = amortize(principal, monthlyRate, months)
  const total = rows.reduce((s, r) => s + r.payment, 0)
  return { installment: emi(principal, monthlyRate, months), totalPaid: total, interest: total - principal, balances: rows.map(r => r.closing) }
}

/* ---------- World 4: valuation ---------- */
export const eps = (netProfit: number, shares: number) => netProfit / shares
/** P/E = price ÷ EPS. Returns null when EPS ≤ 0 — a loss-making company has no meaningful P/E. */
export const peRatio = (price: number, epsValue: number) => (epsValue > 0 ? price / epsValue : null)

/* ---------- World 5: inflation ---------- */
export const ruleOf72 = (annualRatePct: number) => 72 / annualRatePct
export const exactDoubling = (annualRatePct: number) => Math.log(2) / Math.log(1 + annualRatePct / 100)
/** Fisher relation: real = (1 + nominal) / (1 + inflation) − 1. */
export const realReturn = (nominal: number, inflation: number) => (1 + nominal) / (1 + inflation) - 1
export const purchasingPower = (amount: number, inflation: number, years: number) => amount / Math.pow(1 + inflation, years)
