import axios from "axios";

/**
 * Sealo API 클라이언트.
 * TODO: 배포 환경별 baseURL 분리 (EXPO_PUBLIC_API_URL 환경변수)
 * 주의: Android 에뮬레이터에서 로컬 백엔드 접근 시 10.0.2.2, 실기기는 PC의 LAN IP 사용
 */
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 5000,
});
