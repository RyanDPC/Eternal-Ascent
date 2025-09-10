import React from 'react';
import { Link } from 'react-router-dom';

const Card = ({ to, title, emoji, desc }) => (
  <Link to={to} className="adv-card">
    <div className="adv-emoji">{emoji}</div>
    <div className="adv-title">{title}</div>
    <div className="adv-desc">{desc}</div>
  </Link>
);

export default function AdvancedHub() {
  return (
    <div className="advanced-hub">
      <h1>Fonctionnalités Avancées</h1>
      <p>Accédez aux systèmes étendus connectés au nouveau schéma.</p>
      <div className="adv-grid">
        <Card to="/world-events" title="Événements Monde" emoji="🌍" desc="Raids, invasions, boss mondiaux" />
        <Card to="/shops" title="Boutiques" emoji="🛒" desc="Inventaires, rotations et achats" />
        <Card to="/auctions" title="Hôtel des Ventes" emoji="🏦" desc="Lister, enchérir et acheter" />
        <Card to="/seasons" title="Saisons" emoji="📆" desc="Progression et récompenses saisonnières" />
        <Card to="/leaderboards" title="Classements" emoji="🏆" desc="Scores par saison et mode" />
        <Card to="/friends" title="Amis" emoji="👥" desc="Gestion des relations et statuts" />
        <Card to="/messages" title="Messages" emoji="✉️" desc="Messagerie privée" />
        <Card to="/cosmetics" title="Cosmétiques" emoji="🎨" desc="Skins, auras et rotation boutique" />
      </div>
      <style>{`
        .advanced-hub { padding: 16px; }
        .adv-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap: 12px; }
        .adv-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 14px; text-decoration: none; color: inherit; transition: transform .15s ease; }
        .adv-card:hover { transform: translateY(-2px); }
        .adv-emoji { font-size: 26px; }
        .adv-title { font-weight: 700; margin-top: 6px; }
        .adv-desc { opacity: .8; font-size: 13px; margin-top: 4px; }
      `}</style>
    </div>
  );
}

