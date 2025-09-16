export function parseCommand(content: string, prefix: string): { name: string; args: string[] } | null {
  const args = content.slice(prefix.length).trim().split(/\s+/);
  const name = args.shift()?.toLowerCase();
  return name ? { name, args } : null;
}

export function safeToString(value: unknown): string {
  try {
    if (typeof value === "string") return value;
    return JSON.stringify(value as unknown);
  } catch {
    return String(value);
  }
}
