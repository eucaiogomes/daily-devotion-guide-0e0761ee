/**
 * Lumen — Sistema de gamificação temático: Rei Davi & Salomão
 *
 *  Escudos de Davi  → vidas (só no devocional, regeneram a cada 30s)
 *  Talentos         → moedas/ouro (recompensa por completar missões)
 *  Dias de Louvor   → sequência de dias consecutivos
 */

const KEY = "lumen:game-state-v2";

export const MAX_SHIELDS = 5;
export const REGEN_MS    = 30_000; // 30 segundos por escudo

export type GameState = {
  shields: number;          // escudos armazenados no momento de `lastShieldChange`
  lastShieldChange: number; // timestamp da última alteração nos escudos
  streak: number;           // dias consecutivos de devocional
  lastMissionDate: string;  // "YYYY-MM-DD" — última missão concluída
  talentos: number;         // Talentos de Salomão (moedas)
  xp: number;               // sabedoria acumulada
  lessonsCompleted: number; // total de devocionais concluídos
};

const DEFAULT: GameState = {
  shields: MAX_SHIELDS,
  lastShieldChange: 0,
  streak: 0,
  lastMissionDate: "",
  talentos: 0,
  xp: 0,
  lessonsCompleted: 0,
};

function read(): GameState {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

function write(state: GameState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

/** Retorna os escudos reais considerando a regeneração passiva */
export function calcShields(state: GameState): { count: number; regenInMs: number } {
  if (state.shields >= MAX_SHIELDS) return { count: MAX_SHIELDS, regenInMs: 0 };

  const elapsed = Date.now() - state.lastShieldChange;
  const regained = Math.floor(elapsed / REGEN_MS);
  const count    = Math.min(MAX_SHIELDS, state.shields + regained);

  if (count >= MAX_SHIELDS) return { count: MAX_SHIELDS, regenInMs: 0 };

  const regenInMs = REGEN_MS - (elapsed % REGEN_MS);
  return { count, regenInMs };
}

export function getGameState(): GameState {
  return read();
}

/** Perde 1 escudo (só no devocional). Retorna o novo estado. */
export function loseShield(): GameState {
  const state  = read();
  const { count } = calcShields(state);
  if (count <= 0) return state; // já sem escudos

  const next: GameState = {
    ...state,
    shields: count - 1,
    lastShieldChange: Date.now(),
  };
  write(next);
  return next;
}

/** Recompensa ao completar o devocional do dia */
export function completeMission(errors: number): GameState {
  const state   = read();
  const today   = new Date().toISOString().slice(0, 10);
  const isNew   = state.lastMissionDate !== today;

  const talentosEarned = errors === 0 ? 50 : 30;
  const xpEarned       = errors === 0 ? 30 : 20;

  const prevDay   = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const streakOk  = state.lastMissionDate === prevDay || state.lastMissionDate === today;
  const newStreak = isNew ? (streakOk ? state.streak + 1 : 1) : state.streak;

  const next: GameState = {
    ...state,
    streak: newStreak,
    lastMissionDate: today,
    talentos: state.talentos + (isNew ? talentosEarned : 0),
    xp: state.xp + (isNew ? xpEarned : 0),
    lessonsCompleted: state.lessonsCompleted + (isNew ? 1 : 0),
  };
  write(next);
  return next;
}

/** Recompensa por mini-jogo de treino */
export function earnTrainingReward(xpAmount: number): GameState {
  const state = read();
  const next: GameState = {
    ...state,
    talentos: state.talentos + Math.floor(xpAmount / 2),
    xp: state.xp + xpAmount,
  };
  write(next);
  return next;
}

/** Restaura escudos para máximo (ex.: ao terminar o dia) */
export function refillShields(): GameState {
  const next: GameState = { ...read(), shields: MAX_SHIELDS, lastShieldChange: Date.now() };
  write(next);
  return next;
}
