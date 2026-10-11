// World configuration: art, palette, guide and the ordered steps that make up each world.
// The WorldScene simply walks through `steps` — adding a scene means adding one line here.
import type { Step, WorldId } from '../types.ts'

export interface Character { id: string; name: string; title: string; img: string; color: string }

export const CHARACTERS: Record<string, Character> = {
  kaelen: { id: 'kaelen', name: 'Master Kaelen', title: 'Quartermaster', img: 'assets/chars/npc_kaelen.png', color: '#e0a458' },
  aditi: { id: 'aditi', name: 'Aditi', title: 'Guild Chief Teller', img: 'assets/chars/npc_aditi.png', color: '#5aa9ff' },
  virendra: { id: 'virendra', name: 'Virendra', title: 'Moneylender', img: 'assets/chars/npc_virendra.png', color: '#ff4d5e' },
  vikram: { id: 'vikram', name: 'Broker Vikram', title: 'Floor Operator', img: 'assets/chars/npc_vikram.png', color: '#4fdc8f' },
  overseer: { id: 'overseer', name: 'The Overseer', title: 'Citadel Guardian', img: 'assets/chars/npc_overseer.png', color: '#7ef0ff' },
}

export const pappuImg = (mood: string) => `assets/chars/pappu_${mood}.png`

export interface WorldConfig {
  id: WorldId
  bg: string
  guide: keyof typeof CHARACTERS
  accent: string
  accent2: string
  tint: string            // overlay colour that sets the world's mood over the art
  particle: 'dust' | 'sparkle' | 'ember' | 'ticker' | 'star'
  steps: Step[]
}

export const WORLDS: Record<WorldId, WorldConfig> = {
  1: {
    id: 1, bg: 'assets/bg/bg_frontier_outpost.jpg', guide: 'kaelen',
    accent: '#3ee6f0', accent2: '#f5c542', tint: 'rgba(60,30,10,0.25)', particle: 'dust',
    steps: [
      { kind: 'dialogue', id: 'w1_arrival', objective: 'obj.talk' },
      { kind: 'game', id: 'crate', objective: 'obj.crate' },
      { kind: 'dialogue', id: 'w1_needs', objective: 'obj.talk' },
      { kind: 'learn', id: 'budget', objective: 'obj.learn' },
      { kind: 'game', id: 'sorter', objective: 'obj.sorter' },
      { kind: 'dialogue', id: 'w1_bargain', objective: 'obj.talk' },
      { kind: 'learn', id: 'unitprice', objective: 'obj.learn' },
      { kind: 'game', id: 'bargain', objective: 'obj.bargain' },
      { kind: 'dialogue', id: 'w1_boss', objective: 'obj.talk' },
      { kind: 'game', id: 'ledger', objective: 'obj.ledger' },
      { kind: 'dialogue', id: 'w1_victory', objective: 'obj.talk' },
    ],
  },
  2: {
    id: 2, bg: 'assets/bg/bg_banking_guild.jpg', guide: 'aditi',
    accent: '#5aa9ff', accent2: '#f5c542', tint: 'rgba(10,20,60,0.25)', particle: 'sparkle',
    steps: [
      { kind: 'dialogue', id: 'w2_intro', objective: 'obj.talk' },
      { kind: 'learn', id: 'deposits', objective: 'obj.learn' },
      { kind: 'game', id: 'deposit', objective: 'obj.deposit' },
      { kind: 'dialogue', id: 'w2_cards', objective: 'obj.talk' },
      { kind: 'learn', id: 'payments', objective: 'obj.learn' },
      { kind: 'game', id: 'scam', objective: 'obj.scam' },
      { kind: 'dialogue', id: 'w2_boss', objective: 'obj.talk' },
      { kind: 'game', id: 'gauntlet', objective: 'obj.gauntlet' },
      { kind: 'dialogue', id: 'w2_victory', objective: 'obj.talk' },
    ],
  },
  3: {
    id: 3, bg: 'assets/bg/bg_citadel_debt.jpg', guide: 'virendra',
    accent: '#ff4d5e', accent2: '#ffb547', tint: 'rgba(40,0,10,0.3)', particle: 'ember',
    steps: [
      { kind: 'dialogue', id: 'w3_intro', objective: 'obj.talk' },
      { kind: 'learn', id: 'interest', objective: 'obj.learn' },
      { kind: 'game', id: 'snowball', objective: 'obj.snowball' },
      { kind: 'dialogue', id: 'w3_emi', objective: 'obj.talk' },
      { kind: 'learn', id: 'credit', objective: 'obj.learn' },
      { kind: 'game', id: 'emi', objective: 'obj.emi' },
      { kind: 'dialogue', id: 'w3_victory', objective: 'obj.talk' },
    ],
  },
  4: {
    id: 4, bg: 'assets/bg/bg_grand_exchange.jpg', guide: 'vikram',
    accent: '#4fdc8f', accent2: '#e8b04a', tint: 'rgba(10,30,20,0.2)', particle: 'ticker',
    steps: [
      { kind: 'dialogue', id: 'w4_intro', objective: 'obj.talk' },
      { kind: 'learn', id: 'investing', objective: 'obj.learn' },
      { kind: 'game', id: 'value', objective: 'obj.value' },
      { kind: 'dialogue', id: 'w4_market', objective: 'obj.talk' },
      { kind: 'learn', id: 'diversification', objective: 'obj.learn' },
      { kind: 'game', id: 'market', objective: 'obj.market' },
      { kind: 'dialogue', id: 'w4_victory', objective: 'obj.talk' },
    ],
  },
  5: {
    id: 5, bg: 'assets/bg/bg_master_citadel.jpg', guide: 'overseer',
    accent: '#7ef0ff', accent2: '#f5d26b', tint: 'rgba(20,10,60,0.2)', particle: 'star',
    steps: [
      { kind: 'dialogue', id: 'w5_intro', objective: 'obj.talk' },
      { kind: 'learn', id: 'inflation', objective: 'obj.learn' },
      { kind: 'game', id: 'rule72', objective: 'obj.rule72' },
      { kind: 'learn', id: 'shields', objective: 'obj.learn' },
      { kind: 'dialogue', id: 'w5_trial', objective: 'obj.talk' },
      { kind: 'game', id: 'trial', objective: 'obj.trial' },
    ],
  },
}
