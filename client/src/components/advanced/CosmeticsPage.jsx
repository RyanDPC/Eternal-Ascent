import React, { useEffect, useState } from 'react';
import databaseService from '../../services/databaseService';

export default function CosmeticsPage() {
  const [cosmetics, setCosmetics] = useState([]);
  const [rotation, setRotation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [c, r] = await Promise.all([
          databaseService.getCosmetics?.(),
          databaseService.getShopRotation?.()
        ]);
        setCosmetics(Array.isArray(c?.cosmetics) ? c.cosmetics : (Array.isArray(c) ? c : []));
        setRotation(Array.isArray(r?.rotation) ? r.rotation : (Array.isArray(r) ? r : []));
      } catch (e) {
        setError('Impossible de charger les cosmétiques');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Chargement des cosmétiques...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="page">
      <h2>Cosmétiques</h2>
      <div className="list">
        {cosmetics.map(c => (
          <div key={c.id} className="card">
            <div className="title">{c.name}</div>
            <div className="meta">{c.type} • {c.rarity}</div>
            <div className="meta">Prix: {c.price_premium_currency}</div>
          </div>
        ))}
      </div>
      <h3>Rotation Boutique</h3>
      <div className="list">
        {rotation.map(r => (
          <div key={r.id} className="card">
            <div className="title">Cosmetic #{r.cosmetic_id}</div>
            <div className="meta">{new Date(r.start_time).toLocaleString('fr-FR')} → {new Date(r.end_time).toLocaleString('fr-FR')}</div>
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

