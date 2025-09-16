import { config } from "../src/config/config.js";

const baseUrl = config.apiUrl.replace(/\/$/, "");

export interface ApiHealth {
  status: string;
  [key: string]: unknown;
}

export async function getApiHealth(): Promise<ApiHealth> {
  const res = await fetch(`${baseUrl}/health`);
  if (!res.ok) throw new Error(`API health check failed with ${res.status}`);
  return (await res.json()) as ApiHealth;
}

export async function getJson<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`GET ${url} failed with ${res.status}`);
  return (await res.json()) as T;
}

export async function postJson<T = unknown>(
  path: string,
  body: unknown,
  init: RequestInit = {}
): Promise<T> {
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) throw new Error(`POST ${url} failed with ${res.status}`);
  return (await res.json()) as T;
}
