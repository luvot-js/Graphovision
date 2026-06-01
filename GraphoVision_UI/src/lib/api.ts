/**
 * api.ts
 * GraphoVision API 클라이언트
 * baseURL: http://localhost:8000
 * JWT 토큰은 localStorage에서 자동으로 읽어 Authorization 헤더에 첨부
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("gv_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // FormData는 Content-Type 헤더를 자동으로 설정 (boundary 포함)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.detail || message;
    } catch {}
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────

export const authApi = {
  signup(email: string, nickname: string, password: string) {
    return request<{ access_token: string; token_type: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, nickname, password }),
    });
  },
  login(email: string, password: string) {
    return request<{ access_token: string; token_type: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
};

// ── User ──────────────────────────────────────────────────────────────

export const userApi = {
  me() {
    return request<{
      id: number;
      email: string;
      nickname: string;
      credits: number;
      created_at: string;
    }>("/api/user/me");
  },
};

// ── Analyze ───────────────────────────────────────────────────────────

export const analyzeApi = {
  analyze(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<{
      result_id: string;
      scores: number[];
      trait_names: string[];
      report: string | null;
      credits_remaining: number;
    }>("/api/analyze", { method: "POST", body: formData });
  },

  getResult(resultId: string) {
    return request<{
      id: string;
      scores: number[];
      trait_names: string[];
      report: string | null;
      created_at: string;
    }>(`/api/result/${resultId}`);
  },
};

// ── History ───────────────────────────────────────────────────────────

export const historyApi = {
  list() {
    return request<{ id: string; scores: number[]; created_at: string }[]>(
      "/api/history"
    );
  },
};

// ── Compatibility ─────────────────────────────────────────────────────

export const compatibilityApi = {
  compare(resultIdA: string, resultIdB: string) {
    return request<{
      harmony_score: number;
      synergy_traits: string[];
      caution_traits: string[];
      scores_a: number[];
      scores_b: number[];
      trait_names: string[];
    }>("/api/compatibility", {
      method: "POST",
      body: JSON.stringify({ result_id_a: resultIdA, result_id_b: resultIdB }),
    });
  },
};

// ── Billing ───────────────────────────────────────────────────────────

export const billingApi = {
  charge(amount: number) {
    return request<{ credits: number; delta: number }>("/api/billing/charge", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },
};
