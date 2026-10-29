import { isCtx, requireMerchant } from '@/lib/core/guard';
import { fail, ok, readJson } from '@/lib/core/http';
import { saveSettings } from '@/lib/domain/deliveries';

export const dynamic = 'force-dynamic';

// { googleReviewUrl } — where 4–5 star customers are sent after delivery (Premium: tip + review page).
export async function PUT(req: Request) {
  const c = await requireMerchant(req, 'premium');
  if (!isCtx(c)) return c;
  const b = await readJson(req);
  if (!b) return fail('JSON body required');
  const r = await saveSettings(c.merchantId, b.googleReviewUrl ? String(b.googleReviewUrl) : null);
  return r.ok ? ok() : fail(r.error ?? 'Not saved');
}
