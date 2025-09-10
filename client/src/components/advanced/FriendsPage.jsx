import React, { useEffect, useState } from 'react';
import databaseService from '../../services/databaseService';

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await databaseService.getFriends?.();
        setFriends(Array.isArray(data?.friends) ? data.friends : (Array.isArray(data) ? data : []));
      } catch (e) {
        setError('Impossible de charger les amis');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Chargement des amis...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="page">
      <h2>Amis</h2>
      <div className="list">
        {friends.map(f => (
          <div key={`${f.user_id}-${f.friend_id}`} className="card">
            <div className="title">Utilisateur #{f.friend_id}</div>
            <div className="meta">Statut: {f.status}</div>
            <div className="meta">Depuis: {f.created_at ? new Date(f.created_at).toLocaleDateString('fr-FR') : '—'}</div>
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

