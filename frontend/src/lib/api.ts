const API_BASE = 'http://localhost:4000/api';

export interface StartSessionResponse {
  joinCode: string;
  session: {
    joinCode: string;
    playerName: string;
    language: string;
    wallet: number;
    reserve: number;
    cibilScore: number;
    activeWorld: string;
    unlockedNodes: string[];
    completedChallenges: string[];
  };
}

export const api = {
  // 1. Initialize anonymous session
  async startSession(playerName: string = 'Explorer', language: string = 'en'): Promise<StartSessionResponse> {
    try {
      const res = await fetch(`${API_BASE}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, language }),
      });
      if (!res.ok) throw new Error('Failed to start session');
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, running locally:', err);
      // Fallback offline mock code if backend is momentarily offline
      return {
        joinCode: 'OFF-' + Math.floor(100 + Math.random() * 900),
        session: {
          joinCode: 'OFFLINE',
          playerName,
          language,
          wallet: 0,
          reserve: 0,
          cibilScore: 650,
          activeWorld: '1',
          unlockedNodes: ['prologue'],
          completedChallenges: [],
        },
      };
    }
  },

  // 2. Resume session by 6-char join code (e.g. HYD-743)
  async resumeSession(joinCode: string) {
    const res = await fetch(`${API_BASE}/session/resume/${joinCode.trim().toUpperCase()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Session not found');
    }
    return res.json();
  },

  // 3. Persist progress, wallet (₹), reserve, cibil, portals
  async syncProgress(joinCode: string, state: {
    wallet?: number;
    reserve?: number;
    cibilScore?: number;
    activeWorld?: string | number;
    unlockedNodes?: any[];
    completedChallenges?: any[];
    language?: string;
  }) {
    if (!joinCode || joinCode.startsWith('OFF-')) return null;
    try {
      const res = await fetch(`${API_BASE}/session/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode,
          wallet: Math.round(state.wallet ?? 0),
          reserve: Math.round(state.reserve ?? 0),
          cibilScore: Math.round(state.cibilScore ?? 650),
          activeWorld: String(state.activeWorld ?? '1'),
          unlockedNodes: state.unlockedNodes,
          completedChallenges: state.completedChallenges,
          language: state.language,
        }),
      });
      return await res.json();
    } catch (e) {
      console.warn('Failed to sync progress to backend', e);
      return null;
    }
  },

  // 4. Ingest real-time telemetry events for Vanguard 4 Pillars
  async logTelemetry(event: {
    joinCode: string;
    cohortId?: string;
    pillarId: 'plan_budget' | 'save_manage' | 'understand_investing' | 'stay_safe';
    eventType: string;
    score: number;
    metadata?: Record<string, any>;
  }) {
    if (!event.joinCode || event.joinCode.startsWith('OFF-')) return;
    try {
      await fetch(`${API_BASE}/telemetry/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (e) {
      console.warn('Failed to stream telemetry event', e);
    }
  },
};