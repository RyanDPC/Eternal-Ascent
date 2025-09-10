import React, { useEffect, useState } from 'react';
import databaseService from '../../services/databaseService';

export default function ShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await databaseService.getShops?.();
        setShops(Array.isArray(data?.shops) ? data.shops : (Array.isArray(data) ? data : []));
      } catch (e) {
        setError('Impossible de charger les boutiques');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Chargement des boutiques...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="page">
      <h2>Boutiques</h2>
      <div className="list">
        {shops.map(s => (
          <div key={s.id} className="card">
            <div className="title">{s.name}</div>
            <div className="meta">{s.location || '—'} • refresh {s.refresh_timer || 0}s</div>
            <pre className="inv">{JSON.stringify(s.inventory, null, 2)}</pre>
          </div>
        ))}
      </div>
      <style>{`
        .page{padding:16px}
        .list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
        .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px}
        .title{font-weight:700}
        .meta{opacity:.8;font-size:12px;margin:4px 0}
        .inv{white-space:pre-wrap;background:rgba(0,0,0,.2);padding:8px;border-radius:8px}
      `}</style>
    </div>
  );
}

