import React, { useEffect, useState } from 'react';
import databaseService from '../../services/databaseService';

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await databaseService.getAuctions?.();
        setAuctions(Array.isArray(data?.auctions) ? data.auctions : (Array.isArray(data) ? data : []));
      } catch (e) {
        setError('Impossible de charger l\'hôtel des ventes');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Chargement des enchères...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="page">
      <h2>Hôtel des Ventes</h2>
      <div className="list">
        {auctions.map(a => (
          <div key={a.id} className="card">
            <div className="title">Item #{a.item_id}</div>
            <div className="meta">Qté {a.quantity} • {a.price} {a.currency || a.currency_id}</div>
            <div className="meta">Expire: {a.expires_at ? new Date(a.expires_at).toLocaleString('fr-FR') : '—'}</div>
          </div>
        ))}
      </div>
      <style>{`
        .page{padding:16px}
        .list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
        .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px}
        .title{font-weight:700}
        .meta{opacity:.8;font-size:12px;margin:4px 0}
      `}</style>
    </div>
  );
}

