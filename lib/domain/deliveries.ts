// TR4CKER — live tracking of the merchant's OWN deliveries.
//  - A delivery is linked to a Clover order (or a Food Hub order). It has two private links:
//      courier  /c/<token>  "Picked up" / "Delivered", and the phone shares its position while on the way;
//      customer /t/<token>  status, last position while on the way, then "tip + review".
//  - Tokens are "<delivery id>.<secret>"; only a hash of each secret is stored, plus a sealed copy so the merchant can
//    show the links again. Positions are kept only while the delivery is on its way, then dropped (privacy).
//  - Review routing: 4–5 stars → the merchant's Google review page; 1–3 → kept privately for the merchant.
//  - Food Hub (TAKATAK Suite): a direct delivery order (own fleet) creates its delivery by itself.
import crypto from 'node:crypto';
import { hmacHex, openSecret, randomToken, safeEqual, sealSecret } from '../core/crypto';
import { getStore } from '../core/store';

export type DStatus = 'created' | 'picked_up' | 'delivered' | 'cancelled';
export interface Delivery {
  id: string; label: string; orderRef: string | null; source: 'manual' | 'foodhub'; customerFirstName: string | null; address: string | null;
  status: DStatus; createdAt: string; pickedUpAt: string | null; deliveredAt: string | null;
  courierHash: string; trackHash: string; courierSealed: string; trackSealed: string;
  lastPos: { lat: number; lng: number; at: string } | null; rating: number | null; feedback: string | null;
}
export interface TrackerSettings { googleReviewUrl: string | null }
export const DELIVERIES = 'deliveries';
const key = (mid: string) => `m:${mid}:tracker:settings`;
const h = (s: string) => hmacHex('tr4cker-token', s);

export async function getSettings(mid: string): Promise<TrackerSettings> {
  return { googleReviewUrl: null, ...((await getStore().getKv<TrackerSettings>(key(mid))) ?? {}) };
}

export async function saveSettings(mid: string, url: string | null): Promise<{ ok: boolean; error?: string }> {
  if (url) { try { const u = new URL(url); if (u.protocol !== 'https:') return { ok: false, error: 'Address must be https.' }; } catch { return { ok: false, error: 'Address is not valid.' }; } }
  await getStore().setKv(key(mid), { googleReviewUrl: url || null });
  return { ok: true };
}

export async function createDelivery(mid: string, input: { label?: unknown; orderRef?: unknown; customerFirstName?: unknown; address?: unknown; source?: 'manual' | 'foodhub'; id?: string }): Promise<{ ok: true; delivery: Delivery; courierToken: string; trackToken: string } | { ok: false; error: string }> {
  const label = String(input.label ?? '').trim().slice(0, 40);
  if (!label) return { ok: false, error: 'Give the delivery a label (order number).' };
  const id = input.id ?? crypto.randomUUID();
  const c = randomToken(18); const t = randomToken(18);
  const d: Delivery = {
    id, label, orderRef: input.orderRef ? String(input.orderRef).slice(0, 40) : null, source: input.source ?? 'manual',
    customerFirstName: input.customerFirstName ? String(input.customerFirstName).trim().slice(0, 30) : null,
    address: input.address ? String(input.address).trim().slice(0, 200) : null,
    status: 'created', createdAt: new Date().toISOString(), pickedUpAt: null, deliveredAt: null,
    courierHash: h(c), trackHash: h(t), courierSealed: sealSecret(c), trackSealed: sealSecret(t), lastPos: null, rating: null, feedback: null,
  };
  await getStore().put(DELIVERIES, id, mid, d, d.createdAt);
  return { ok: true, delivery: d, courierToken: `${id}.${c}`, trackToken: `${id}.${t}` };
}

/** The delivery behind a link (courier or customer), or null. */
export async function byToken(token: string, kind: 'courier' | 'track'): Promise<{ merchantId: string; d: Delivery } | null> {
  const m = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{20,40})$/.exec(String(token ?? ''));
  if (!m) return null;
  const doc = await getStore().get<Delivery>(DELIVERIES, m[1]);
  if (!doc) return null;
  const want = kind === 'courier' ? doc.data.courierHash : doc.data.trackHash;
  return safeEqual(want, h(m[2])) ? { merchantId: doc.merchantId, d: doc.data } : null;
}

export function links(d: Delivery, base: string): { courier: string | null; track: string | null } {
  const c = openSecret(d.courierSealed); const t = openSecret(d.trackSealed);
  return { courier: c ? `${base}/c/${d.id}.${c}` : null, track: t ? `${base}/t/${d.id}.${t}` : null };
}

const save = (mid: string, d: Delivery) => getStore().put(DELIVERIES, d.id, mid, d, d.createdAt);

export async function courierUpdate(token: string, action: 'picked_up' | 'delivered' | 'position', pos?: { lat: unknown; lng: unknown }): Promise<{ ok: true; status: DStatus } | { ok: false; error: string; status?: number }> {
  const f = await byToken(token, 'courier');
  if (!f) return { ok: false, error: 'Unknown link.', status: 404 };
  const d = { ...f.d };
  if (d.status === 'delivered' || d.status === 'cancelled') return { ok: false, error: 'This delivery is closed.', status: 409 };
  const now = new Date().toISOString();
  if (action === 'position') {
    const lat = Number(pos?.lat); const lng = Number(pos?.lng);
    if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return { ok: false, error: 'Bad position.' };
    if (d.status !== 'picked_up') return { ok: true, status: d.status }; // position only while on the way
    d.lastPos = { lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5, at: now };
  } else if (action === 'picked_up') {
    d.status = 'picked_up'; d.pickedUpAt = d.pickedUpAt ?? now;
  } else {
    d.status = 'delivered'; d.deliveredAt = now; d.lastPos = null; // no more position once delivered
  }
  await save(f.merchantId, d);
  return { ok: true, status: d.status };
}

export async function cancelDelivery(mid: string, id: string): Promise<boolean> {
  const doc = await getStore().get<Delivery>(DELIVERIES, id);
  if (!doc || doc.merchantId !== mid || doc.data.status === 'delivered') return false;
  await save(mid, { ...doc.data, status: 'cancelled', lastPos: null });
  return true;
}

/** Customer's review after delivery: returns where to send them (Google for 4–5 stars when set). */
export async function leaveFeedback(token: string, rating: number, comment: unknown): Promise<{ ok: true; redirect: string | null } | { ok: false; error: string; status?: number }> {
  const f = await byToken(token, 'track');
  if (!f) return { ok: false, error: 'Unknown link.', status: 404 };
  if (f.d.status !== 'delivered') return { ok: false, error: 'Available after the delivery.', status: 409 };
  if (f.d.rating !== null) return { ok: false, error: 'Thank you, your review is already saved.', status: 409 };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: 'Rating: 1 to 5.' };
  await save(f.merchantId, { ...f.d, rating, feedback: rating <= 3 && comment ? String(comment).slice(0, 1000) : null });
  const s = await getSettings(f.merchantId);
  return { ok: true, redirect: rating >= 4 ? s.googleReviewUrl : null };
}

export async function listDeliveries(mid: string, hours = 24): Promise<Delivery[]> {
  return (await getStore().list<Delivery>(DELIVERIES, { merchantId: mid, since: new Date(Date.now() - hours * 3600_000).toISOString(), limit: 500 })).map((x) => x.data);
}

/** Food Hub: a direct (own-fleet) delivery order → its delivery, once. */
export async function fromFoodHub(order: any): Promise<boolean> {
  const mid = order?.cloverMerchantId;
  if (!mid || order?.fulfillment !== 'delivery' || !order?.orderId) return false;
  if (!['direct', 'phone', 'storefront', 'website'].includes(String(order.channel))) return false; // platform couriers have their own tracking
  if (!(await getStore().claim(`m:${mid}:tracker:fh:${order.orderId}`, Date.now()))) return false;
  const r = await createDelivery(String(mid), { label: String(order.displayId ?? order.orderId).slice(0, 40), orderRef: order.cloverOrderId ?? order.orderId, source: 'foodhub' });
  return r.ok;
}

/** /api/cron: positions of deliveries still "on the way" for over 6 hours are dropped; links stop working 48 h after the end. */
export async function sweep(now = Date.now()): Promise<{ cleared: number }> {
  let cleared = 0;
  for (const doc of await getStore().list<Delivery>(DELIVERIES, { since: new Date(now - 7 * 86400_000).toISOString(), limit: 10_000 })) {
    const d = doc.data;
    const ended = d.deliveredAt ?? (d.status === 'cancelled' ? d.createdAt : null);
    if (d.lastPos && now - Date.parse(d.lastPos.at) > 6 * 3600_000) { await getStore().put(DELIVERIES, d.id, doc.merchantId, { ...d, lastPos: null }, d.createdAt); cleared++; }
    else if (ended && now - Date.parse(ended) > 48 * 3600_000 && (d.courierSealed || d.trackSealed)) {
      await getStore().put(DELIVERIES, d.id, doc.merchantId, { ...d, courierHash: '', trackHash: '', courierSealed: '', trackSealed: '' }, d.createdAt); cleared++;
    }
  }
  return { cleared };
}
