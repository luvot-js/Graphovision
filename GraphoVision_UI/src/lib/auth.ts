/**
 * auth.ts
 * JWT 토큰 저장/삭제 및 로그인 상태 관리
 */

const TOKEN_KEY = "gv_token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
