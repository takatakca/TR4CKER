'use client';

import { useState } from 'react';

// After delivery: stars + comment. 4–5 stars may be sent to the restaurant's Google page; 1–3 stay private.
export function Feedback({ token, lang }: { token: string; lang: 'fr' | 'en' }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const t = (fr: string, en: string) => (lang === 'en' ? en : fr);
  async function go() {
    const res = await fetch('/api/track/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, rating, comment }) }).catch(() => null);
    const j = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) { setErr(j.error ?? 'Erreur / Error'); return; }
    if (j.redirect) window.location.href = j.redirect; else setDone(t('Merci ! Votre avis a été transmis au restaurant.', 'Thank you! Your review was sent to the restaurant.'));
  }
  if (done) return <p className="banner banner-info">{done}</p>;
  return (
    <div>
      <p>{t('Comment s’est passée votre livraison ?', 'How was your delivery?')}</p>
      <div className="row">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={n <= rating ? '' : 'ghost'} aria-label={`${n}`} onClick={() => setRating(n)}>★</button>)}</div>
      {rating > 0 && rating <= 3 && <><label htmlFor="c">{t('Dites-nous ce qui n’a pas été', 'Tell us what went wrong')}</label><textarea id="c" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></>}
      <p><button disabled={!rating} onClick={go}>{t('Envoyer', 'Send')}</button></p>
      {err && <p className="banner banner-stop">{err}</p>}
    </div>
  );
}
