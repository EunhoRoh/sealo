import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "./client";
import { PlanDetail } from "./plans";
import { AiPlanType } from "@/constants/ai-questions";

export interface AiPlanResult {
  plan: PlanDetail;
  freeUsed: boolean;
  paidShells: number;
  shellBalance: number;
}

/** 물범에게 부탁하기 — 첫 1회 무료, 이후 조개 300개 (docs/14) */
export const AI_PLAN_COST_SHELLS = 300;

export function useGenerateAiPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { type: AiPlanType; answers: Record<string, string> }) =>
      (await api.post<AiPlanResult>("/api/ai/plans", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["members", "me"] }); // 잔액 갱신
    },
  });
}
