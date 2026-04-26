import { useCallback, useEffect, useRef, useState } from "react";
import {
  calcShields,
  getGameState,
  loseShield as libLoseShield,
  completeMission as libCompleteMission,
  earnTrainingReward as libEarnTraining,
  refillShields as libRefill,
  MAX_SHIELDS,
  type GameState,
} from "@/lib/gameState";

export type LiveGameState = GameState & {
  liveShields: number;    // escudos reais (com regen calculada)
  regenInMs: number;      // ms até o próximo escudo (0 = cheio)
  regenSec: number;       // segundos formatados para exibição
  loseShield: () => void;
  completeMission: (errors: number) => void;
  earnTraining: (xp: number) => void;
};

export function useGameState(): LiveGameState {
  const [state, setState] = useState<GameState>(() => getGameState());
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Atualiza o estado a partir do localStorage (por se outro hook o alterou)
  const reload = useCallback(() => setState(getGameState()), []);

  // Timer de 1 segundo — só ativo quando escudos < máximo
  useEffect(() => {
    const { count } = calcShields(state);
    const regenerating = count < MAX_SHIELDS;

    if (regenerating) {
      intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.shields, state.lastShieldChange]);

  // Quando tiver regenerado escudos suficientes, recarrega o estado
  useEffect(() => {
    const { count } = calcShields(state);
    if (count > state.shields) reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const { count: liveShields, regenInMs } = calcShields(state);

  const loseShield = useCallback(() => {
    const next = libLoseShield();
    setState(next);
  }, []);

  const completeMission = useCallback((errors: number) => {
    const next = libCompleteMission(errors);
    setState(next);
  }, []);

  const earnTraining = useCallback((xp: number) => {
    const next = libEarnTraining(xp);
    setState(next);
  }, []);

  return {
    ...state,
    liveShields,
    regenInMs,
    regenSec: Math.ceil(regenInMs / 1000),
    loseShield,
    completeMission,
    earnTraining,
  };
}
