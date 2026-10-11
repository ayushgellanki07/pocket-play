// Registry: step id → minigame component. WorldScene looks games up here.
import type { ComponentType } from 'react'
import type { GameProps } from './common.ts'
import CrateAlign from './CrateAlign.tsx'
import SurvivalSorter from './SurvivalSorter.tsx'
import BargainMatrix from './BargainMatrix.tsx'
import OutpostLedger30Days from './OutpostLedger30Days.tsx'
import DepositMatchmaker from './DepositMatchmaker.tsx'
import ScamAlert from './ScamAlert.tsx'
import GuildFraudGauntlet from './GuildFraudGauntlet.tsx'
import CompoundingSnowball from './CompoundingSnowball.tsx'
import EMIRestructuringSimulator from './EMIRestructuringSimulator.tsx'
import ValueDetective from './ValueDetective.tsx'
import MarketCycleSimulator from './MarketCycleSimulator.tsx'
import RuleOf72 from './RuleOf72.tsx'
import MasterSovereignTrial from './MasterSovereignTrial.tsx'
import EMICalculator from './EMICalculator.tsx'
import PECalculator from './PECalculator.tsx'
import EmergencyFundChallenge from './EmergencyFundChallenge.tsx'

export const MINIGAMES: Record<string, ComponentType<GameProps>> = {
  crate: CrateAlign,
  sorter: SurvivalSorter,
  bargain: BargainMatrix,
  ledger: OutpostLedger30Days,
  deposit: DepositMatchmaker,
  scam: ScamAlert,
  gauntlet: GuildFraudGauntlet,
  snowball: CompoundingSnowball,
  emi: EMIRestructuringSimulator,
  value: ValueDetective,
  market: MarketCycleSimulator,
  rule72: RuleOf72,
  trial: MasterSovereignTrial,
  // Direct Mode-only activities
  emicalc: EMICalculator,
  pecalc: PECalculator,
  efund: EmergencyFundChallenge,
}
