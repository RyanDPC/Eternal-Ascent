import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  User, 
  Package, 
  Sword, 
  BookOpen, 
  Trophy, 
  Users, 
  Zap,
  Target,
  Brain,
  Settings,
  TrendingUp,
  Heart,
  Shield,
  Star,
  Activity,
  Award,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import optimizedApiService from '../../services/apiService';
import './Dashboard.css';

const DashboardPage = () => {
  const { user, character: authCharacter } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    if (authCharacter) {
      // Utiliser les données du personnage depuis le contexte d'authentification
      setData({ character: authCharacter });
      setLoading(false);
    } else if (user) {
      // Fallback : charger les données depuis l'API si pas de données de personnage
      loadDashboardData();
    }
  }, [user, authCharacter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await optimizedApiService.getDashboardData();
      setData(response);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="optimized-dashboard-v2">
        <div className="loading">
          <div className="loading-spinner"></div>
          <h2>Chargement du dashboard optimisé...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="optimized-dashboard-v2">
        <div className="error">
          <h2>Erreur</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData}>Réessayer</button>
        </div>
      </div>
    );
  }

  if (!data || !data.character) {
    return (
      <div className="optimized-dashboard-v2">
        <div className="no-character">
          <h2>Aucun personnage trouvé</h2>
          <p>Veuillez créer un personnage pour accéder au dashboard.</p>
        </div>
      </div>
    );
  }

  const { character } = data;
  const stats = character.stats || {};
  const inventory = character.inventory || [];
  const skills = character.skills || [];
  const achievements = character.achievements || [];
  const recommendedDungeons = character.recommended_dungeons || [];
  const recommendedQuests = character.recommended_quests || [];

  // Calculer les statistiques
  const equippedItems = inventory.filter(item => item.equipped);
  const learnedSkills = skills.filter(skill => skill.learned_level > 0);
  const unlockedAchievements = achievements.filter(achievement => achievement.unlocked_at);
  const availableDungeons = recommendedDungeons.filter(dungeon => dungeon.can_enter);
  const availableQuests = recommendedQuests.filter(quest => quest.can_accept);

  return (
    <div className="optimized-dashboard-v2">
      <div className="dashboard-header">
        <h1>Dashboard Optimisé V2</h1>
        <div className="character-info">
          <h2>{character.name}</h2>
          <span className="character-level">Niveau {character.level}</span>
          <span className="character-class">{character.class_name}</span>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          <Home /> Vue d'ensemble
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          <TrendingUp /> Statistiques
        </button>
        <button
          className={activeTab === 'dungeons' ? 'active' : ''}
          onClick={() => setActiveTab('dungeons')}
        >
          <Sword /> Donjons
        </button>
        <button
          className={activeTab === 'quests' ? 'active' : ''}
          onClick={() => setActiveTab('quests')}
        >
          <Target /> Quêtes
        </button>
        <button
          className={activeTab === 'achievements' ? 'active' : ''}
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy /> Succès
        </button>
        <button
          className={activeTab === 'inventory' ? 'active' : ''}
          onClick={() => setActiveTab('inventory')}
        >
          <Package /> Inventaire
        </button>
        <button
          className={activeTab === 'skills' ? 'active' : ''}
          onClick={() => setActiveTab('skills')}
        >
          <BookOpen /> Compétences
        </button>
      </div>

      <div className="dashboard-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="overview-tab"
            >
              <div className="stats-grid">
                <div className="stat-card">
                  <Heart className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{stats.health || 0}</span>
                    <span className="stat-label">Santé</span>
                  </div>
                </div>
                <div className="stat-card">
                  <Zap className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{stats.mana || 0}</span>
                    <span className="stat-label">Mana</span>
                  </div>
                </div>
                <div className="stat-card">
                  <Sword className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{stats.attack || 0}</span>
                    <span className="stat-label">Attaque</span>
                  </div>
                </div>
                <div className="stat-card">
                  <Shield className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{stats.defense || 0}</span>
                    <span className="stat-label">Défense</span>
                  </div>
                </div>
              </div>

              <div className="recommendations">
                <h3>Recommandations</h3>
                <div className="recommendation-grid">
                  <div className="recommendation-card">
                    <h4>Donjons disponibles</h4>
                    <p>{availableDungeons.length} donjons accessibles</p>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="recommendation-card">
                    <h4>Quêtes disponibles</h4>
                    <p>{availableQuests.length} quêtes accessibles</p>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <div className="recommendation-card">
                    <h4>Objets en inventaire</h4>
                    <p>{inventory.length} objets possédés</p>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div className="recommendation-card">
                    <h4>Compétences apprises</h4>
                    <p>{learnedSkills.length} compétences maîtrisées</p>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Activité récente</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <Activity className="activity-icon" />
                    <div className="activity-content">
                      <p>Personnage créé</p>
                      <span>Il y a 2 heures</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <Award className="activity-icon" />
                    <div className="activity-content">
                      <p>Premier succès débloqué</p>
                      <span>Il y a 1 heure</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <Clock className="activity-icon" />
                    <div className="activity-content">
                      <p>Dernière connexion</p>
                      <span>Maintenant</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="stats-tab"
            >
              <h3>Statistiques détaillées</h3>
              <div className="detailed-stats">
                <div className="stat-section">
                  <h4>Stats de base</h4>
                  <div className="stat-list">
                    <div className="stat-item">
                      <span>Santé:</span>
                      <span>{stats.health || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Mana:</span>
                      <span>{stats.mana || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Attaque:</span>
                      <span>{stats.attack || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Défense:</span>
                      <span>{stats.defense || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Attaque magique:</span>
                      <span>{stats.magic_attack || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Défense magique:</span>
                      <span>{stats.magic_defense || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Vitesse:</span>
                      <span>{stats.speed || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Taux critique:</span>
                      <span>{((stats.critical_rate || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                      <span>Dégâts critiques:</span>
                      <span>{((stats.critical_damage || 1) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dungeons' && (
            <motion.div
              key="dungeons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="dungeons-tab"
            >
              <h3>Donjons recommandés</h3>
              <div className="dungeons-grid">
                {recommendedDungeons.slice(0, 6).map(dungeon => (
                  <div key={dungeon.id} className="dungeon-card">
                    <h4>{dungeon.display_name}</h4>
                    <p>{dungeon.description}</p>
                    <div className="dungeon-info">
                      <span>Niveau: {dungeon.level_requirement}</span>
                      <span>Difficulté: {dungeon.difficulty_display_name}</span>
                      <span className={dungeon.can_enter ? 'can-enter' : 'cannot-enter'}>
                        {dungeon.can_enter ? 'Accessible' : 'Verrouillé'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'quests' && (
            <motion.div
              key="quests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="quests-tab"
            >
              <h3>Quêtes recommandées</h3>
              <div className="quests-grid">
                {recommendedQuests.slice(0, 6).map(quest => (
                  <div key={quest.id} className="quest-card">
                    <h4>{quest.title}</h4>
                    <p>{quest.description}</p>
                    <div className="quest-info">
                      <span>Niveau: {quest.min_level}</span>
                      <span>Type: {quest.quest_type_display_name}</span>
                      <span className={quest.can_accept ? 'can-accept' : 'cannot-accept'}>
                        {quest.can_accept ? 'Disponible' : 'Verrouillée'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="achievements-tab"
            >
              <h3>Progrès des succès</h3>
              <div className="achievement-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(unlockedAchievements.length / achievements.length) * 100}%` }}
                  />
                </div>
                <p>{unlockedAchievements.length} / {achievements.length} succès débloqués</p>
              </div>
              <div className="achievements-grid">
                {achievements.slice(0, 6).map(achievement => (
                  <div key={achievement.id} className={`achievement-card ${achievement.unlocked_at ? 'unlocked' : 'locked'}`}>
                    <Trophy className="achievement-icon" />
                    <div className="achievement-content">
                      <h4>{achievement.title}</h4>
                      <p>{achievement.description}</p>
                      <span className="achievement-rarity">{achievement.rarity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="inventory-tab"
            >
              <h3>Inventaire</h3>
              <div className="inventory-stats">
                <div className="inventory-stat">
                  <span>Objets totaux:</span>
                  <span>{inventory.length}</span>
                </div>
                <div className="inventory-stat">
                  <span>Objets équipés:</span>
                  <span>{equippedItems.length}</span>
                </div>
              </div>
              <div className="inventory-grid">
                {inventory.slice(0, 12).map(item => (
                  <div key={item.id} className={`item-card ${item.equipped ? 'equipped' : ''}`}>
                    <div className="item-rarity" style={{ backgroundColor: item.rarity_color }}></div>
                    <h4>{item.item_display_name}</h4>
                    <p>{item.item_description}</p>
                    <div className="item-info">
                      <span>Niveau: {item.level_requirement}</span>
                      <span>Rareté: {item.rarity_display_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="skills-tab"
            >
              <h3>Compétences</h3>
              <div className="skills-stats">
                <div className="skill-stat">
                  <span>Compétences apprises:</span>
                  <span>{learnedSkills.length} / {skills.length}</span>
                </div>
              </div>
              <div className="skills-grid">
                {skills.slice(0, 8).map(skill => (
                  <div key={skill.id} className={`skill-card ${skill.learned_level > 0 ? 'learned' : 'not-learned'}`}>
                    <BookOpen className="skill-icon" />
                    <div className="skill-content">
                      <h4>{skill.display_name}</h4>
                      <p>{skill.description}</p>
                      <div className="skill-info">
                        <span>Niveau: {skill.level_requirement}</span>
                        <span>Type: {skill.type}</span>
                        {skill.learned_level > 0 && (
                          <span className="learned-level">Niveau {skill.learned_level}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardPage;
