// All narrative dialogue as structured data. Lines play in order unless a line sets
// `nextDialogueId` or offers `choices`. `{name}` and `{cibil}` are filled in at runtime.
import type { DialogueLine } from '../types.ts'

const K = 'kaelen', A = 'aditi', V = 'virendra', B = 'vikram', O = 'overseer'
const npc = (character: string, id: string, text: string, highlightedTerms: string[] = [], extra: Partial<DialogueLine> = {}): DialogueLine =>
  ({ id, speaker: 'npc', character, text, highlightedTerms, ...extra })
const me = (id: string, mood: DialogueLine['mood'], text: string, extra: Partial<DialogueLine> = {}): DialogueLine =>
  ({ id, speaker: 'player', mood, text, ...extra })
const nar = (id: string, text: string, extra: Partial<DialogueLine> = {}): DialogueLine => ({ id, speaker: 'narrator', text, ...extra })

export const DIALOGUE: Record<string, DialogueLine[]> = {
  w1_arrival: [
    nar('a1', 'A crack of static. Sand in your mouth. Your phone still shows full signal — and suddenly, no meaning at all.', { trigger: 'sfx:warn' }),
    me('a2', 'confused', 'Where… am I? Okay, okay. I\'ll just pay for a cab out of here with UPI.'),
    me('a3', 'worried', '"Payment failed: currency not recognised in this dimension"?! My balance is right there!'),
    npc(K, 'a4', 'Put that glowing slab away, stranger. Out here, money is only worth what it can buy — and only if it is verified.', ['verified']),
    npc(K, 'a5', 'Numbers on a screen mean nothing without real purchasing power behind them. Work first. Then I\'ll pay you in verified Outpost currency.', ['purchasing power']),
    me('a6', 'skeptical', 'So… I have to earn it before I can spend it. Fair. What\'s the job?'),
    npc(K, 'a7', 'My storeroom crates arrived scrambled. Align every crate so I can count the stock. Do it right and you\'ll earn ₹15,000.', ['₹15,000']),
  ],
  w1_needs: [
    npc(K, 'n1', '₹15,000. Feels rich, doesn\'t it? It won\'t stay that way without a plan.'),
    npc(K, 'n2', 'This month you owe rent of ₹6,000, grain rations of ₹4,000 and tool maintenance of ₹1,000. That\'s ₹11,000 of needs.', ['needs', '₹11,000']),
    me('n3', 'worried', 'That\'s most of it already!'),
    npc(K, 'n4', 'Quick test, then. Which of these is a NEED?', [], {
      choices: [
        { label: 'Rent for a roof over my head', next: 'n5ok', correct: true, effect: { mastery: 10 } },
        { label: 'Glowing hover-boots', next: 'n5no', correct: false },
      ],
    }),
    npc(K, 'n5no', 'Ha! Boots that glow are a want. You can survive without them. Shelter, food and the tools that earn your living are needs.', ['want'], { nextDialogueId: 'n6' }),
    npc(K, 'n5ok', 'Right. Shelter, food and the tools that earn your living are needs. Everything else is a want.', ['want']),
    npc(K, 'n6', 'Wise folk use the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Here your needs eat 73%, so wants must shrink first.', ['50/30/20 rule']),
    npc(K, 'n7', 'And always keep a reserve — ₹500 locked away for trouble — plus ₹2,000 for tomorrow\'s lamp-oil order.', ['reserve']),
  ],
  w1_bargain: [
    npc(K, 'b1', 'Good budget. Now, lamp oil: the outpost needs 25 flasks for the month.'),
    npc(K, 'b2', 'Three merchants, three prices. The biggest bill isn\'t always the worst deal. Compare the price per unit.', ['price per unit']),
    me('b3', 'skeptical', 'So I divide each total price by the quantity… and pick the lowest.'),
  ],
  w1_boss: [
    npc(K, 'x1', 'One last test, {name}. Live a full month at the outpost. Your wage arrives on day 1; rent and rations are due every week.'),
    npc(K, 'x2', 'Traders will tempt you. The desert will surprise you. End the month with at least ₹2,000 and the ancient portal will wake.', ['₹2,000']),
    me('x3', 'excited', 'A whole month on a budget. Bring it on!'),
  ],
  w1_victory: [
    nar('v1', 'The circuit-lines carved into the ancient portal flare electric cyan.', { trigger: 'sfx:portal' }),
    npc(K, 'v2', 'You spent on purpose, saved on purpose, and survived the surprise. That is cash-flow mastery.', ['cash-flow']),
    npc(K, 'v3', 'Beyond that portal lies the Banking Guild. Keep your money safe there — and keep your PIN safer.'),
    me('v4', 'success', 'Thank you, Master Kaelen. Next stop: the bank!'),
  ],

  w2_intro: [
    nar('i1', 'Marble halls stretch upward. Brass tubes hiss as sealed letters shoot overhead.'),
    npc(A, 'i2', 'Welcome to the Banking Guild, {name}. I\'m Aditi, Chief Teller. Cash under a mattress earns nothing — and can be stolen.'),
    npc(A, 'i3', 'A savings account keeps money liquid: withdraw any time, earn a little interest. Our illustrative game rate: 3% a year.', ['savings account', 'liquid']),
    npc(A, 'i4', 'A Recurring Deposit takes a fixed sum every month (illustrative 6.5%). A Fixed Deposit locks a lump sum for a set term (illustrative 7%), with a penalty if you break it early.', ['Recurring Deposit', 'Fixed Deposit']),
    me('i5', 'skeptical', 'So more interest usually means less access to my money?'),
    npc(A, 'i6', 'Exactly. That trade-off is called liquidity. Let\'s see if you can match each saver with the right account.', ['liquidity']),
  ],
  w2_cards: [
    npc(A, 'c1', 'Now, payments. A debit card spends your own money. A credit card spends the bank\'s money — repay it in full and on time, or interest bites.', ['debit card', 'credit card']),
    npc(A, 'c2', 'UPI moves money instantly, authorised by your UPI PIN. Your PIN and every OTP are vault keys: never share them — not with me, not with anyone.', ['UPI PIN', 'OTP']),
    nar('c3', 'BZZT! Your phone blazes with an urgent notification…', { trigger: 'sfx:alert' }),
    me('c4', 'excited', '₹50,000?! I won a lottery?!'),
  ],
  w2_boss: [
    npc(A, 'g1', 'Well caught. Scammers rely on excitement and urgency. Remember: you never enter a PIN to receive money.'),
    npc(A, 'g2', 'The Guild vault is under attack by fraudulent requests. Ten transactions, sixty seconds. Approve the real ones, reject the scams — perfectly.'),
    me('g3', 'skeptical', 'Slow down, read carefully, check who started the payment. Got it.'),
  ],
  w2_victory: [
    npc(A, 'w1', 'Flawless. The vault seals glow steady again.', [], { trigger: 'sfx:portal' }),
    npc(A, 'w2', 'The Guild pays a ₹1,000 bounty for your work. Where should it live?', [], {
      choices: [
        { label: 'Keep it in my wallet', next: 'w2keep' },
        { label: 'Move it to my emergency reserve', next: 'w2save', correct: true, effect: { toReserve: 1000, mastery: 15 }, note: 'Reserve +₹1,000' },
      ],
    }),
    npc(A, 'w2keep', 'Your choice. Spending money has a way of disappearing, though. A reserve is what saves you from borrowing in a crisis.', ['reserve'], { nextDialogueId: 'w2b' }),
    npc(A, 'w2save', 'Wise. Money set aside for emergencies is money you will never have to borrow at a moneylender\'s rates.', ['emergencies']),
    npc(A, 'w2b', 'Beyond the vault lies the Citadel of Debt. Borrow carefully there.'),
    me('w3', 'success', 'Ten for ten. Onward!'),
  ],

  w3_intro: [
    nar('d1', 'Black granite. Grinding gears. Red lanterns sway above a counting house wrapped in chains.'),
    npc(V, 'd2', 'Ah, a newcomer. I hear you dream of a forge-loom — equipment that earns money every single month.', ['earns money']),
    npc(V, 'd3', 'It costs ₹20,000. You have saved ₹6,000. I will lend you the other ₹14,000 at a tiny 5% a month.', ['5% a month']),
    me('d4', 'skeptical', 'Five percent a month… that\'s just 60% a year, right?', {
      choices: [
        { label: 'Sign right away', next: 'd5rush', correct: false, effect: { cibil: -10 }, note: 'Hard enquiry on your credit file: −10' },
        { label: 'Check the maths first', next: 'd5math', correct: true, effect: { mastery: 10 } },
      ],
    }),
    npc(V, 'd5rush', 'Eager! I like eager. I have already filed an enquiry on your credit record. Now the registry insists you study the terms. Pity.', ['enquiry'], { nextDialogueId: 'd6' }),
    npc(V, 'd5math', 'Hmph. Careful one. Let the numbers speak, then.'),
    nar('d6', 'The Citizen Credit Registry flickers red: your current score is {cibil}.', { trigger: 'sfx:warn' }),
  ],
  w3_emi: [
    npc(V, 'e1', 'Tch. The regulated lender\'s loan is cheaper. Fine. But can you actually repay it?'),
    npc(V, 'e2', 'An EMI — Equated Monthly Instalment — blends interest and principal into one fixed payment.', ['EMI', 'principal']),
    npc(V, 'e3', 'Miss payments and your credit score sinks. Stack up loans and your EMI-to-income ratio strangles you. Lenders like it at or below 30%.', ['credit score', 'EMI-to-income ratio']),
    npc(V, 'e4', 'Six months. My shop has… tempting offers. We\'ll see your score then.'),
  ],
  w3_victory: [
    npc(V, 'f1', 'Seven hundred and fifty or more. The registry respects you now. Tch.', [], { trigger: 'sfx:portal' }),
    me('f2', 'success', 'Pay on time. Borrow only for things that earn. Say no to vanity loans.'),
    nar('f3', 'The iron portcullis groans upward. Beyond it hums the Grand Exchange.'),
  ],

  w4_intro: [
    nar('h1', 'A glass-vaulted trading floor. Ships crowd the harbour; a cylindrical ticker whirs in red and green.'),
    npc(B, 'h2', 'Broker Vikram, at your service! A share is a slice of ownership in a company. When the company earns, you share in it.', ['share']),
    npc(B, 'h3', 'Mutual funds pool money from many investors. An index ETF simply buys the whole index — like the NIFTY 50.', ['Mutual funds', 'index ETF']),
    npc(B, 'h4', 'SEBI regulates our markets to protect investors and keep things fair. It does NOT guarantee anyone\'s returns.', ['SEBI']),
    npc(B, 'h5', 'Before buying, a detective checks valuation. Price-to-earnings: P/E = share price ÷ earnings per share.', ['P/E']),
    me('h6', 'excited', 'Show me the dossiers!'),
  ],
  w4_market: [
    npc(B, 'm1', 'Sharp eyes! A profitable company at a sensible P/E beats a loss-making hype story — though P/E alone never tells the whole tale.'),
    npc(B, 'm2', 'Now feel a market cycle. ₹10,000 from your wallet goes in: 70% index ETF, 20% value stock, 10% gold.', ['70%', '20%', '10%']),
    npc(B, 'm3', 'Five years. In year three, a bear market strikes. What you do in that moment matters more than anything.', ['bear market']),
    me('m4', 'worried', 'A crash… with my money in it? If prices fall, I should…', {
      choices: [
        { label: 'Sell before it gets worse', next: 'm5sell', correct: false },
        { label: 'Hold — I am investing for years, not days', next: 'm5hold', correct: true, effect: { mastery: 10 } },
      ],
    }),
    npc(B, 'm5sell', 'Many sell at the bottom and buy back at the top. Watch what fear costs you in the simulator.', ['fear'], { nextDialogueId: 'm6' }),
    npc(B, 'm5hold', 'Steady hands! Remember it when the screens turn red.'),
    npc(B, 'm6', 'To the trading floor!'),
  ],
  w4_victory: [
    npc(B, 'q1', 'You held your nerve! In this scenario, staying invested beat selling in fear.', [], { trigger: 'sfx:portal' }),
    npc(B, 'q2', 'But hear me: real markets promise no recovery and no timetable. Diversify, mind the fees, and invest for the long term.', ['Diversify', 'fees']),
    nar('q3', 'The ticker spins into a beam of light that points far above the clouds.'),
  ],

  w5_intro: [
    nar('o1', 'Above an ocean of clouds floats a celestial observatory. Tiny holograms of every world you crossed orbit a golden balance.'),
    npc(O, 'o2', '{name}. You have budgeted, banked, borrowed and invested. One enemy remains — silent and patient: inflation.', ['inflation']),
    npc(O, 'o3', 'When prices rise 6% a year, ₹100 next year buys what about ₹94 buys today. A return below inflation is a loss in disguise.', ['purchasing power']),
    npc(O, 'o4', 'To see how fast money grows — or shrinks — sages use the Rule of 72.', ['Rule of 72']),
  ],
  w5_trial: [
    npc(O, 't1', 'Two pillars guard every future: the Emergency Shield and the Insurance Fortress. One without the other leaves you exposed.', ['Emergency Shield', 'Insurance Fortress']),
    npc(O, 't1b', 'Which pillar do you raise first?', [], {
      choices: [
        { label: 'The Emergency Shield', next: 't1ok', correct: true, effect: { mastery: 15 } },
        { label: 'Skip shields and chase the highest returns', next: 't1no', correct: false },
      ],
    }),
    npc(O, 't1no', 'Returns mean nothing if one hospital bill or lost job forces you to sell or borrow. Shields first; growth second.', ['Shields first'], { nextDialogueId: 't2' }),
    npc(O, 't1ok', 'Yes. Shields first, then growth. You will need that order in the trial.'),
    npc(O, 't2', 'Now, the Master Sovereign Trial. Ten years of life in moments. Every lesson, all at once.'),
    npc(O, 't3', 'Reaching Year 10 is not victory. Reaching it wisely is. Then the portal home will open.'),
    me('t4', 'excited', 'Ten years. Let\'s do this.'),
  ],
}
