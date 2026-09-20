import 'server-only';
import crypto from 'crypto';

function key() {
  const k = process.env.ENCRYPTION_KEY;
  if (!k) throw new Error('ENCRYPTION_KEY ausente');
  const b = Buffer.from(k, 'base64');
  if (b.length !== 32) throw new Error('ENCRYPTION_KEY deve ter 32 bytes em base64');
  return b;
}

/** AES-256-GCM: confidencialidade + detecção de adulteração. */
export function encrypt(text: string) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), enc.toString('base64')].join(':');
}

export function decrypt(payload: string) {
  const [v, iv, tag, data] = payload.split(':');
  if (v !== 'v1') throw new Error('Formato inválido');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8');
}

export function safeDecrypt(payload?: string | null) {
  if (!payload) return '';
  try { return decrypt(payload); } catch { return ''; }
}
