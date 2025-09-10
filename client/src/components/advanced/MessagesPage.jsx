import React, { useEffect, useState } from 'react';
import databaseService from '../../services/databaseService';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await databaseService.getMessages?.();
        setMessages(Array.isArray(data?.messages) ? data.messages : (Array.isArray(data) ? data : []));
      } catch (e) {
        setError('Impossible de charger les messages');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Chargement des messages...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="page">
      <h2>Messages</h2>
      <div className="list">
        {messages.map(m => (
          <div key={m.id} className="card">
            <div className="title">De #{m.sender_id} → #{m.receiver_id}</div>
            <div className="meta">{m.created_at ? new Date(m.created_at).toLocaleString('fr-FR') : '—'}</div>
            <div className="desc">{m.content}</div>
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

