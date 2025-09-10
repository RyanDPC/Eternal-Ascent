import React, { useEffect, useState } from 'react';
import databaseService from '../../services/databaseService';

export default function LeaderboardsPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await databaseService.getLeaderboards?.();
        setEntries(Array.isArray(data?.leaderboards) ? data.leaderboards : (Array.isArray(data) ? data : []));
      } catch (e) {
        setError('Impossible de charger les classements');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Chargement des classements...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="page">
      <h2>Classements</h2>
      <div className="list">
        {entries.map(e => (
          <div key={e.id} className="card">
            <div className="title">{e.type} #{e.ref_id || '—'}</div>
            <div className="meta">Score {e.score} • Rang {e.rank}</div>
            <div className="meta">Saison {e.season_id || '—'}</div>
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

