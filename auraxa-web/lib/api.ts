import axios from "axios";
import { AnalysisResult, AnalysisStatus, Report, UserProfile } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auraxa_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Analysis ────────────────────────────────────────────────
export async function uploadConversation(
  files: File[],
  intent: "conversation" | "pattern" | "style"
): Promise<{ analysis_id: string }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("intent", intent);
  const { data } = await api.post("/api/analyze/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getAnalysisStatus(id: string): Promise<AnalysisStatus> {
  const { data } = await api.get(`/api/analyze/${id}/status`);
  return data;
}

export async function getAnalysisResults(id: string): Promise<AnalysisResult> {
  const { data } = await api.get(`/api/analyze/${id}/results`);
  return data;
}

export async function listAnalyses(): Promise<AnalysisResult[]> {
  const { data } = await api.get("/api/analyze");
  return data;
}

// ─── AI Advisor ───────────────────────────────────────────────
export async function sendAdvisorMessage(
  analysisId: string,
  message: string,
  sessionId?: string
): Promise<{ response: string; session_id: string }> {
  const { data } = await api.post("/api/advisor/message", {
    analysis_id: analysisId,
    message,
    session_id: sessionId,
  });
  return data;
}

// ─── Reports ──────────────────────────────────────────────────
export async function listReports(): Promise<Report[]> {
  const { data } = await api.get("/api/reports");
  return data;
}

export async function shareReport(reportId: string): Promise<{ share_url: string; card_url: string }> {
  const { data } = await api.post(`/api/reports/${reportId}/share`);
  return data;
}

// ─── User ─────────────────────────────────────────────────────
export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get("/api/users/me");
  return data;
}

export default api;
