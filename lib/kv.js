const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function command(args, timeoutMs = 8000) {
  if (!KV_URL || !KV_TOKEN) return undefined;
  try {
    const response = await fetch(KV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    });
    if (!response.ok) return undefined;
    return (await response.json()).result;
  } catch {
    return undefined;
  }
}

export async function kvGet(key) {
  const raw = await command(['GET', key]);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function kvSet(key, value, ttlSeconds) {
  const args = ['SET', key, JSON.stringify(value)];
  if (ttlSeconds && ttlSeconds > 0) args.push('EX', String(Math.max(1, Math.floor(ttlSeconds))));
  await command(args);
}

export async function kvDel(key) {
  await command(['DEL', key]);
}

// True when this caller won the lock (or Redis is unavailable, so callers still make progress).
export async function kvLock(key, ttlSeconds) {
  const result = await command(['SET', key, '1', 'NX', 'EX', String(Math.max(1, Math.floor(ttlSeconds)))]);
  return result === undefined ? true : result === 'OK';
}

// Atomic counter that expires `ttlSeconds` after its first increment. Returns 0 if Redis is unavailable.
export async function kvIncr(key, ttlSeconds) {
  const count = await command(['INCR', key]);
  if (typeof count !== 'number') return 0;
  if (count === 1 && ttlSeconds) await command(['EXPIRE', key, String(Math.floor(ttlSeconds))]);
  return count;
}
