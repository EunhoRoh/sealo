import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./client";

export interface TodayRoutine {
  id: number;
  name: string;
  icon: string;
  alarmTime: string; // "HH:mm:ss"
  completed: boolean;
}

export type AlarmType = "GENTLE" | "LOUD"; // LOUD = 따르릉 모드 (단계별 재알림)

export interface Routine {
  id: number;
  name: string;
  icon: string;
  alarmTime: string; // "HH:mm:ss"
  days: string[]; // "MONDAY" ...
  alarmEnabled: boolean;
  alarmType: AlarmType;
}

export interface StampResult {
  routineId: number;
  stampDate: string;
  earnedShells: number;
  shellBalance: number;
}

export interface RoutineForm {
  name: string;
  icon: string;
  alarmTime: string; // "HH:mm"
  days: string[]; // "MONDAY" ...
  alarmType: AlarmType;
}

export function useRoutines() {
  return useQuery({
    queryKey: ["routines", "all"],
    queryFn: async () => (await api.get<Routine[]>("/api/routines")).data,
  });
}

export function useTodayRoutines() {
  return useQuery({
    queryKey: ["routines", "today"],
    queryFn: async () => (await api.get<TodayRoutine[]>("/api/routines/today")).data,
  });
}

export function useStampRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (routineId: number) =>
      (await api.post<StampResult>(`/api/routines/${routineId}/stamp`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines", "today"] });
      queryClient.invalidateQueries({ queryKey: ["stamps"] }); // 캘린더·스트릭 갱신
    },
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: RoutineForm) => (await api.post("/api/routines", form)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (routineId: number) =>
      (await api.delete(`/api/routines/${routineId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}

export interface DailyStampCount {
  date: string; // "2026-07-07"
  count: number;
}

/** month: "2026-07" */
export function useCalendar(month: string) {
  return useQuery({
    queryKey: ["stamps", "calendar", month],
    queryFn: async () =>
      (await api.get<DailyStampCount[]>("/api/stamps/calendar", { params: { month } })).data,
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ["stamps", "streak"],
    queryFn: async () => (await api.get<{ current: number }>("/api/stamps/streak")).data,
  });
}
