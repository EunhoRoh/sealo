import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { api } from "@/api/client";

/**
 * 집중 모드 세션 (docs/12 M1.5, 결정로그 #27) — Forest 방식 v1.
 * - 세션은 AsyncStorage에 저장 → 앱을 종료/재시작해도 잠금 유지 (Ethan 요구)
 * - 앱 이탈은 AppState로 감지해 escapes 카운트 (물범이 봤다 👀)
 * - 조기 포기 = 조개 50 (서버 차감). 시스템 수준 앱 차단은 Dev Client 단계 (docs/12)
 */
export interface FocusSession {
  startedAt: number; // epoch ms
  endsAt: number;
  minutes: number;
  escapes: number;
}

const STORAGE_KEY = "sealo.focus-session";

interface FocusState {
  session: FocusSession | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  start: (minutes: number) => void;
  recordEscape: () => void;
  end: () => void;
}

function persist(session: FocusSession | null) {
  if (session) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session)).catch(() => {});
  } else {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }
}

export const useFocusStore = create<FocusState>((set, get) => ({
  session: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw) as FocusSession;
        // 이미 끝난 세션이면 정리 (앱 꺼진 사이 완주)
        if (session.endsAt > Date.now()) {
          set({ session, hydrated: true });
          return;
        }
        persist(null);
      }
    } catch {
      // 손상된 세션은 버린다
    }
    set({ session: null, hydrated: true });
  },

  start: (minutes: number) => {
    const now = Date.now();
    const session: FocusSession = {
      startedAt: now,
      endsAt: now + minutes * 60_000,
      minutes,
      escapes: 0,
    };
    persist(session);
    set({ session });
  },

  recordEscape: () => {
    const current = get().session;
    if (!current) return;
    const session = { ...current, escapes: current.escapes + 1 };
    persist(session);
    set({ session });
  },

  end: () => {
    persist(null);
    set({ session: null });
  },
}));

export interface GiveUpResult {
  paidShells: number;
  shellBalance: number;
}

export async function giveUpFocus(): Promise<GiveUpResult> {
  return (await api.post<GiveUpResult>("/api/focus/give-up")).data;
}
