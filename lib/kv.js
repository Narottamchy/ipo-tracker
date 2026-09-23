const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const response = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const json = await response.json();
    if (json.result == null) return null;
    return JSON.parse(json.result);
  } catch {
    return null;
  }
}

export async function kvSet(key, value, ttlSeconds) {
  if (!KV_URL || !KV_TOKEN) return;
  const command = ['SET', key, JSON.stringify(value)];
  if (ttlSeconds && ttlSeconds > 0) command.push('EX', String(Math.floor(ttlSeconds)));
  try {
    await fetch(KV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // best-effort — in-memory cache still covers this instance's lifetime
  }
}
