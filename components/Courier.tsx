'use client';

// The courier's page: two big buttons; while on the way, the phone shares its position every 20 s (with permission).
import { useEffect, useRef, useState } from 'react';

export function Courier({ token, label, initial, address }: { token: string; label: string; initial: string; address: string | null }) {
  const [status, setStatus] = useState(initial);
  const [msg, setMsg] = useState('');
  const last = useRef(0);
  async function send(action: string, extra: Record<string, number> = {}) {
    const res = await fetch('/api/track/courier', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, action, ...extra }) }).catch(() => null);
    const j = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) { if (j.status) setStatus(j.status); setMsg(''); } else setMsg(j.error ?? 'Réseau / Network');
  }
  useEffect(() => {
    if (status !== 'picked_up' || !('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition((p) => {
      if (Date.now() - last.current < 20_000) return;
      last.current = Date.now();
      void send('position', { lat: p.coords.latitude, lng: p.coords.longitude });
    }, () => setMsg('Position non partagée / Location not shared'), { enableHighAccuracy: true, maximumAge: 15_000 });
    return () => navigator.geolocation.clearWatch(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  return (
    <main>
      <h1>{label}</h1>
      {address && <p style={{ fontSize: 20 }}>{address} · <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">Maps</a></p>}
      <p className="muted">{status === 'created' ? 'À ramasser / To pick up' : status === 'picked_up' ? 'En route — position partagée / On the way — location shared' : status === 'delivered' ? 'Livrée / Delivered' : 'Annulée / Cancelled'}</p>
      {status === 'created' && <button style={{ width: '100%', minHeight: 72, fontSize: 24 }} onClick={() => send('picked_up')}>Ramassée / Picked up</button>}
      {status === 'picked_up' && <button style={{ width: '100%', minHeight: 72, fontSize: 24 }} onClick={() => send('delivered')}>Livrée / Delivered</button>}
      {msg && <p className="banner banner-warn">{msg}</p>}
    </main>
  );
}
