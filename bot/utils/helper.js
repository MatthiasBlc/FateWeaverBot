export function parseCommand(content, prefix = "!") {
  const trimmed = content.slice(prefix.length).trim();
  if (!trimmed) return { name: "", args: [] };
  const parts = trimmed.split(/\s+/);
  const name = (parts.shift() || "").toLowerCase();
  return { name, args: parts };
}

export function safeToString(value) {
  try {
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
