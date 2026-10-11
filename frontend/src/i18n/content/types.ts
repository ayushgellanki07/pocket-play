export type Dict = Record<string, string>
/** One area of the game's text, with all three languages kept side by side. */
export interface Area { en: Dict; te: Dict; hi: Dict }
