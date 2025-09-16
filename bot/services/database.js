import { config } from "../config/config.js";

const baseUrl = config.apiUrl.replace(/\/$/, "");

export async function getApiHealth() {
  const res = await fetch(`${baseUrl}/health`);
  if (!res.ok) throw new Error(`API health check failed with ${res.status}`);
  return res.json();
}

export async function getJson(path, init) {
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`GET ${url} failed with ${res.status}`);
  return res.json();
}

export async function postJson(path, body, init = {}) {
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) throw new Error(`POST ${url} failed with ${res.status}`);
  return res.json();
}
