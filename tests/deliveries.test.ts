// TR4CKER: private links, courier steps and position, review routing, Food Hub orders, sweep.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { byToken, cancelDelivery, courierUpdate, createDelivery, fromFoodHub, leaveFeedback, listDeliveries, saveSettings, sweep } from '@/lib/domain/deliveries';
import { getStore } from '@/lib/core/store';
import { connect, fakeClover, MID } from './helpers';

beforeEach(async () => { fakeClover(); await connect(); });
afterEach(() => vi.unstubAllGlobals());

async function make() {
  const r = await createDelivery(MID, { label: 'A123', customerFirstName: 'Ana', address: '6280 av. Somerled' });
  if (!r.ok) throw new Error(r.error);
  return r;
}

describe('deliveries', () => {
  it('links work only with the right secret and kind; secrets are not stored in clear', async () => {
    process.env.TOKEN_ENCRYPTION_KEY = 'b'.repeat(64);
    const r = await make();
    expect((await byToken(r.courierToken, 'courier'))?.d.label).toBe('A123');
    expect(await byToken(r.courierToken, 'track')).toBeNull();
    expect(await byToken(`${r.delivery.id}.xxxxxxxxxxxxxxxxxxxxxxxx`, 'courier')).toBeNull();
    expect(JSON.stringify(await getStore().list('deliveries'))).not.toContain(r.courierToken.split('.')[1]);
    delete process.env.TOKEN_ENCRYPTION_KEY;
  });

  it('courier: position only while on the way, dropped at delivery; closed after', async () => {
    const r = await make();
    expect(await courierUpdate(r.courierToken, 'position', { lat: 45.47, lng: -73.62 })).toEqual({ ok: true, status: 'created' });
    expect((await byToken(r.trackToken, 'track'))?.d.lastPos).toBeNull();
    await courierUpdate(r.courierToken, 'picked_up');
    expect(await courierUpdate(r.courierToken, 'position', { lat: 999, lng: 0 })).toMatchObject({ ok: false });
    await courierUpdate(r.courierToken, 'position', { lat: 45.4712345, lng: -73.6212345 });
    expect((await byToken(r.trackToken, 'track'))?.d.lastPos).toMatchObject({ lat: 45.47123, lng: -73.62123 });
    await courierUpdate(r.courierToken, 'delivered');
    expect((await byToken(r.trackToken, 'track'))?.d).toMatchObject({ status: 'delivered', lastPos: null });
    expect(await courierUpdate(r.courierToken, 'picked_up')).toMatchObject({ ok: false, status: 409 });
  });

  it('reviews: after delivery only, once; 4–5 stars go to Google, 1–3 stay private', async () => {
    await saveSettings(MID, 'https://g.page/r/test/review');
    const a = await make();
    expect(await leaveFeedback(a.trackToken, 5, '')).toMatchObject({ ok: false, status: 409 });
    await courierUpdate(a.courierToken, 'delivered');
    expect(await leaveFeedback(a.trackToken, 5, '')).toEqual({ ok: true, redirect: 'https://g.page/r/test/review' });
    expect(await leaveFeedback(a.trackToken, 5, '')).toMatchObject({ ok: false });
    const b = await make();
    await courierUpdate(b.courierToken, 'delivered');
    expect(await leaveFeedback(b.trackToken, 2, 'Froid')).toEqual({ ok: true, redirect: null });
    expect((await byToken(b.trackToken, 'track'))?.d).toMatchObject({ rating: 2, feedback: 'Froid' });
  });

  it('Food Hub direct delivery orders create a delivery once; platform orders do not', async () => {
    const o = { orderId: 'fh1', cloverMerchantId: MID, fulfillment: 'delivery', channel: 'direct', displayId: 'D-77' };
    expect(await fromFoodHub(o)).toBe(true);
    expect(await fromFoodHub(o)).toBe(false);
    expect(await fromFoodHub({ ...o, orderId: 'fh2', channel: 'uber_eats' })).toBe(false);
    expect((await listDeliveries(MID)).map((d) => d.label)).toEqual(['D-77']);
  });

  it('cancel, and the sweep drops stale positions and old links', async () => {
    const r = await make();
    expect(await cancelDelivery(MID, r.delivery.id)).toBe(true);
    const s = await make();
    await courierUpdate(s.courierToken, 'picked_up');
    await courierUpdate(s.courierToken, 'position', { lat: 45, lng: -73 });
    expect(await sweep(Date.now() + 7 * 3600_000)).toMatchObject({ cleared: 1 });
    expect(await sweep(Date.now() + 49 * 3600_000)).toMatchObject({ cleared: 1 });
    expect(await byToken(r.trackToken, 'track')).toBeNull();
  });
});
