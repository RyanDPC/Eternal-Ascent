import React, { useEffect, useState } from 'react';
import databaseService from '../../services/databaseService';

export default function WorldEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await databaseService.getWorldEvents?.();
        setEvents(Array.isArray(data?.events) ? data.events : (Array.isArray(data) ? data : []));
      } catch (e) {
        setError('Impossible de charger les événements');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Chargement des événements...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="page">
      <h2>Événements Mondiaux</h2>
      <div className="list">
        {events.map(ev => (
          <div key={ev.id || ev.name} className="card">
            <div className="title">{ev.name}</div>
            <div className="meta">{ev.type} • {ev.start_time ? new Date(ev.start_time).toLocaleString('fr-FR') : ''}</div>
            <div className="desc">{ev.description || '—'}</div>
          </div>
        ))}
      </div>
      <style>{`
        .page{padding:16px}
        .list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
        .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px}
        .title{font-weight:700}
        .meta{opacity:.8;font-size:12px;margin:4px 0}
        .desc{opacity:.9}
      `}</style>
    </div>
  );
}

