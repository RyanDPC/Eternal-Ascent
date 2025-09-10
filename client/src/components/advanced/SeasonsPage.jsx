import React, { useEffect, useState } from 'react';
import databaseService from '../../services/databaseService';

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [s, p] = await Promise.all([
          databaseService.getSeasons?.(),
          databaseService.getSeasonProgression?.()
        ]);
        setSeasons(Array.isArray(s?.seasons) ? s.seasons : (Array.isArray(s) ? s : []));
        setProgress(Array.isArray(p?.progression) ? p.progression : (Array.isArray(p) ? p : []));
      } catch (e) {
        setError('Impossible de charger les saisons');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Chargement des saisons...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="page">
      <h2>Saisons</h2>
      <div className="list">
        {seasons.map(s => (
          <div key={s.id} className="card">
            <div className="title">{s.name}</div>
            <div className="meta">{new Date(s.start_date).toLocaleDateString('fr-FR')} → {new Date(s.end_date).toLocaleDateString('fr-FR')}</div>
            <pre className="inv">{JSON.stringify(s.rewards_json, null, 2)}</pre>
          </div>
        ))}
      </div>
      <h3>Votre progression</h3>
      <div className="list">
        {progress.map(p => (
          <div key={`${p.user_id}-${p.season_id}`} className="card">
            <div className="title">Saison #{p.season_id}</div>
            <div className="meta">Palier {p.tier} • EXP {p.exp}</div>
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

