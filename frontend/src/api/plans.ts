import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./client";

export type PlanTheme = "SKINCARE" | "WORKOUT" | "STUDY" | "TRAVEL" | "READING" | "CUSTOM";

export interface PlanSummary {
  id: number;
  title: string;
  theme: PlanTheme;
  icon: string;
  targetDate: string | null; // "2026-08-15"
  totalItems: number;
  doneItems: number;
}

export interface PlanItem {
  id: number;
  name: string;
  done: boolean;
  scheduledDate: string | null; // "2026-08-15" — 있으면 캘린더/알람 대상 (Plan v2)
  scheduledTime: string | null; // "10:00:00"
}

export interface UpcomingItem {
  itemId: number;
  name: string;
  date: string;
  time: string | null;
  planTitle: string;
  planIcon: string;
}

export interface PlanDetail {
  id: number;
  title: string;
  theme: PlanTheme;
  icon: string;
  targetDate: string | null;
  rewarded: boolean;
  items: PlanItem[];
}

export interface PlanForm {
  title: string;
  theme: PlanTheme;
  icon: string;
  targetDate?: string;
  items: string[];
}

export interface ToggleResult {
  itemId: number;
  done: boolean;
  totalItems: number;
  doneItems: number;
  bonusShells: number; // > 0 이면 100% 달성 축하 연출
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await api.get<PlanSummary[]>("/api/plans")).data,
  });
}

/** 다가오는 일정 항목 — 플랜 알람 동기화용 */
export function useUpcomingItems() {
  return useQuery({
    queryKey: ["plans", "upcoming"],
    queryFn: async () => (await api.get<UpcomingItem[]>("/api/plans/upcoming")).data,
  });
}

export function usePlanDetail(planId: number | null) {
  return useQuery({
    queryKey: ["plans", planId],
    queryFn: async () => (await api.get<PlanDetail>(`/api/plans/${planId}`)).data,
    enabled: planId != null,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: PlanForm) => (await api.post<PlanDetail>("/api/plans", form)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useToggleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) =>
      (await api.post<ToggleResult>(`/api/plans/items/${itemId}/toggle`)).data,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      if (result.bonusShells > 0) {
        queryClient.invalidateQueries({ queryKey: ["members", "me"] }); // 잔액 갱신
      }
    },
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, name }: { planId: number; name: string }) =>
      (await api.post(`/api/plans/${planId}/items`, { name })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });
}

/** 계획 재조정 — 하루 밀렸어(+1)/당겨졌어(-1), 목표일+모든 일정 이동 → 알람 재동기화 */
export function useShiftPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, days }: { planId: number; days: number }) =>
      (await api.post<PlanDetail>(`/api/plans/${planId}/shift`, { days })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });
}

/** 항목 일정 변경/해제 (date=null이면 알람 해제) */
export function useRescheduleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      date,
      time,
    }: {
      itemId: number;
      date: string | null;
      time: string | null;
    }) => (await api.patch(`/api/plans/items/${itemId}/schedule`, { date, time })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: number) => (await api.delete(`/api/plans/${planId}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });
}
