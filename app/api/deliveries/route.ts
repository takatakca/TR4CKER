import { cloverConfig } from '@/lib/clover/config';
import { isCtx, requireMerchant } from '@/lib/core/guard';
import { fail, ok, readJson } from '@/lib/core/http';
import { cancelDelivery, createDelivery, links, listDeliveries } from '@/lib/domain/deliveries';

export const dynamic = 'force-dynamic';

const view = (d: Awaited<ReturnType<typeof listDeliveries>>[number], base: string) => {
  const { courierHash: _a, trackHash: _b, courierSealed: _c, trackSealed: _d, ...rest } = d;
  return { ...rest, links: links(d, base) };
};

export async function GET(req: Request) {
  const c = await requireMerchant(req);
  if (!isCtx(c)) return c;
  const base = cloverConfig.appBaseUrl || new URL(req.url).origin;
  return ok({ deliveries: (await listDeliveries(c.merchantId)).map((d) => view(d, base)) });
}

// { label, orderRef?, customerFirstName?, address? } → courier link + customer tracking link.
export async function POST(req: Request) {
  const c = await requireMerchant(req);
  if (!isCtx(c)) return c;
  const b = await readJson(req);
  if (!b) return fail('JSON body required');
  const r = await createDelivery(c.merchantId, { label: b.label, orderRef: b.orderRef, customerFirstName: b.customerFirstName, address: b.address });
  if (!r.ok) return fail(r.error);
  const base = cloverConfig.appBaseUrl || new URL(req.url).origin;
  return ok({ delivery: view(r.delivery, base) });
}

export async function DELETE(req: Request) {
  const c = await requireMerchant(req);
  if (!isCtx(c)) return c;
  return (await cancelDelivery(c.merchantId, new URL(req.url).searchParams.get('id') ?? '')) ? ok() : fail('Not found or already delivered', 404);
}
