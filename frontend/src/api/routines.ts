import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./client";

export interface TodayRoutine {
  id: number;
  name: string;
  icon: string;
  alarmTime: string; // "HH:mm:ss"
  completed: boolean;
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
