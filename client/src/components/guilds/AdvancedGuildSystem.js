import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Crown, 
  Shield, 
  Trophy, 
  Star, 
  Plus, 
  Search, 
  Settings, 
  UserPlus, 
  MessageCircle, 
  X,
  Filter,
  Grid,
  List,
  TrendingUp,
  Users2,
  Target,
  Award,
  Sword,
  MapPin,
  Hammer,
  Calendar,
  Zap,
  Building,
  Mountain,
  Flame,
  Sword as RaidIcon,
  Map as TerritoryIcon,
  Hammer as ProjectIcon,
  Calendar as EventIcon,
  Eye,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Coins,
  Gem
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/databaseService';
import './AdvancedGuildSystem.css';

const AdvancedGuildSystem = () => {
  const [guilds, setGuilds] = useState([]);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [showGuildDetails, setShowGuildDetails] = useState(false);
  const [showCreateGuild, setShowCreateGuild] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('level');
  const [viewMode, setViewMode] = useState('grid');
  
  // États pour les fonctionnalités avancées
  const [activeTab, setActiveTab] = useState('overview');
  const [guildRaids, setGuildRaids] = useState([]);
  const [guildProjects, setGuildProjects] = useState([]);
  const [guildEvents, setGuildEvents] = useState([]);
  const [guildTerritories, setGuildTerritories] = useState([]);
  const [showRaidModal, setShowRaidModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [userGuild, setUserGuild] = useState(null);
  const [userGuildRank, setUserGuildRank] = useState(null);
  
  const { user } = useAuth();

  // Charger les données des guildes et du personnage
  useEffect(() => {
    const loadGuildData = async () => {
      try {
        setLoading(true);
        
        // Charger les guildes disponibles (même sans utilisateur connecté)
        const availableGuilds = await databaseService.getGuilds();
        setGuilds(availableGuilds);
        console.log('Guildes chargées depuis l\'API:', availableGuilds);
        
        // Charger les données du personnage si connecté
        if (user && user.id) {
          const current = await databaseService.getCurrentCharacterData();
          setCharacter(current.character || current);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des guildes:', err);
        setError('Impossible de charger les données des guildes');
        // Fallback vers des guildes dynamiques
        await loadDynamicGuilds();
      } finally {
        setLoading(false);
      }
    };

    loadGuildData();
  }, [user]);

  // Charger des guildes dynamiques en cas d'erreur API
  const loadDynamicGuilds = async () => {
    try {
      // Utiliser le service de base de données pour générer des guildes dynamiques
      const dynamicGuilds = await databaseService.generateDynamicGuilds(3);
      setGuilds(dynamicGuilds);
    } catch (err) {
      console.error('Erreur lors de la génération de guildes dynamiques:', err);
      setGuilds([]);
    }
  };

  // Charger les données détaillées d'une guilde
  const loadGuildDetails = async (guildId) => {
    try {
      const guildDetails = await databaseService.getGuild(guildId);
      setSelectedGuild(guildDetails);
      
      // Charger les données spécifiques si l'utilisateur est membre
      if (guildDetails.members && guildDetails.members.some(member => member.character_id === character?.id)) {
        setUserGuild(guildDetails);
        const userMember = guildDetails.members.find(member => member.character_id === character?.id);
        setUserGuildRank(userMember?.rank);
        
        // Charger les raids, projets et événements
        const [raids, projects, events] = await Promise.all([
          databaseService.getGuildRaids(guildId),
          databaseService.getGuildProjects(guildId),
          databaseService.getGuildEvents(guildId)
        ]);
        
        setGuildRaids(raids);
        setGuildProjects(projects);
        setGuildEvents(events);
        setGuildTerritories(guildDetails.territories || []);
      } else {
        // Utiliser les données de la liste des guildes pour la démonstration
        const guildFromList = guilds.find(g => g.id === guildId);
        if (guildFromList) {
          setSelectedGuild(guildFromList);
          setGuildRaids(guildFromList.raids || []);
          setGuildProjects(guildFromList.projects || []);
          setGuildEvents(guildFromList.events || []);
          setGuildTerritories(guildFromList.territories || []);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des détails de la guilde:', err);
      setError('Impossible de charger les détails de la guilde');
    }
  };

  // Rejoindre une guilde
  const handleJoinGuild = async (guildId) => {
    try {
      await databaseService.joinGuild(guildId);
      setError(null);
      // Recharger les données
      loadGuildDetails(guildId);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'adhésion à la guilde');
    }
  };

  // Quitter une guilde
  const handleLeaveGuild = async (guildId) => {
    try {
      await databaseService.leaveGuild(guildId);
      setError(null);
      setUserGuild(null);
      setUserGuildRank(null);
      setShowGuildDetails(false);
    } catch (err) {
      setError(err.message || 'Erreur lors de la sortie de la guilde');
    }
  };

  // Démarrer un raid
  const handleStartRaid = async (raidData) => {
    try {
      if (!userGuild) return;
      await databaseService.startGuildRaid(userGuild.id, raidData);
      setError(null);
      // Recharger les raids
      const raids = await databaseService.getGuildRaids(userGuild.id);
      setGuildRaids(raids);
    } catch (err) {
      setError(err.message || 'Erreur lors du démarrage du raid');
    }
  };

  // Rejoindre un raid
  const handleJoinRaid = async (raidId) => {
    try {
      await databaseService.joinGuildRaid(raidId);
      setError(null);
      // Recharger les raids
      if (userGuild) {
        const raids = await databaseService.getGuildRaids(userGuild.id);
        setGuildRaids(raids);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'adhésion au raid');
    }
  };

  // Démarrer un projet
  const handleStartProject = async (projectData) => {
    try {
      if (!userGuild) return;
      await databaseService.startGuildProject(userGuild.id, projectData);
      setError(null);
      // Recharger les projets
      const projects = await databaseService.getGuildProjects(userGuild.id);
      setGuildProjects(projects);
    } catch (err) {
      setError(err.message || 'Erreur lors du démarrage du projet');
    }
  };

  // Contribuer à un projet
  const handleContributeToProject = async (projectId, contribution) => {
    try {
      await databaseService.contributeToGuildProject(projectId, contribution);
      setError(null);
      // Recharger les projets
      if (userGuild) {
        const projects = await databaseService.getGuildProjects(userGuild.id);
        setGuildProjects(projects);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la contribution au projet');
    }
  };

  // Créer un événement
  const handleCreateEvent = async (eventData) => {
    try {
      if (!userGuild) return;
      await databaseService.createGuildEvent(userGuild.id, eventData);
      setError(null);
      // Recharger les événements
      const events = await databaseService.getGuildEvents(userGuild.id);
      setGuildEvents(events);
    } catch (err) {
      setError(err.message || 'Erreur lors de la création de l\'événement');
    }
  };

  // Filtrer et trier les guildes
  const filteredGuilds = guilds.filter(guild => {
    const matchesSearch = guild.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guild.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRank = filterRank === 'all' || guild.level >= parseInt(filterRank);
    const matchesStatus = filterStatus === 'all' || guild.status === filterStatus;
    return matchesSearch && matchesRank && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'level':
        return b.level - a.level;
      case 'members':
        return b.current_members - a.current_members;
      case 'honor':
        return b.guild_honor - a.guild_honor;
      default:
        return 0;
    }
  });

  // Obtenir la couleur de rareté
  const getRarityColor = (level) => {
    if (level >= 20) return '#f39c12'; // Legendary
    if (level >= 15) return '#9b59b6'; // Epic
    if (level >= 10) return '#3498db'; // Rare
    if (level >= 5) return '#2ecc71'; // Uncommon
    return '#95a5a6'; // Common
  };

  // Obtenir l'icône de statut
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Play size={16} className="text-green-500" />;
      case 'completed': return <CheckCircle size={16} className="text-blue-500" />;
      case 'scheduled': return <Clock size={16} className="text-yellow-500" />;
      case 'failed': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="advanced-guild-system">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement du système de guildes...</p>
          <p>Guildes chargées: {guilds.length}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-guild-system">
      {/* Debug info */}
      <div style={{background: 'rgba(255,0,0,0.1)', padding: '10px', margin: '10px', border: '1px solid red'}}>
        <p>DEBUG: Guildes chargées: {guilds.length}</p>
        <p>DEBUG: Loading: {loading.toString()}</p>
        <p>DEBUG: Error: {error || 'Aucune erreur'}</p>
      </div>
      
      {/* Header */}
      <div className="guild-header">
        <div className="header-content">
          <h1><Crown className="header-icon" /> Système de Guildes Avancé</h1>
          <p>Rejoignez des guildes, participez aux raids, construisez ensemble et dominez les territoires</p>
        </div>
        
        {userGuild && (
          <div className="user-guild-info">
            <div className="guild-badge">
              <Shield size={20} />
              <span>{userGuild.display_name}</span>
              <span className="rank-badge">{userGuildRank}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="guild-navigation">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Users size={20} />
            <span>Vue d'ensemble</span>
          </button>
          
          {userGuild && (
            <>
              <button 
                className={`nav-tab ${activeTab === 'raids' ? 'active' : ''}`}
                onClick={() => setActiveTab('raids')}
              >
                <RaidIcon size={20} />
                <span>Raids de Guilde</span>
              </button>
              
              <button 
                className={`nav-tab ${activeTab === 'territories' ? 'active' : ''}`}
                onClick={() => setActiveTab('territories')}
              >
                <TerritoryIcon size={20} />
                <span>Territoires</span>
              </button>
              
              <button 
                className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveTab('projects')}
              >
                <ProjectIcon size={20} />
                <span>Projets</span>
              </button>
              
              <button 
                className={`nav-tab ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                <EventIcon size={20} />
                <span>Événements</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="guild-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="tab-content"
            >
              {/* Filtres et recherche */}
              <div className="guild-filters">
                <div className="search-box">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher une guilde..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="filter-controls">
                  <select value={filterRank} onChange={(e) => setFilterRank(e.target.value)}>
                    <option value="all">Tous les niveaux</option>
                    <option value="5">Niveau 5+</option>
                    <option value="10">Niveau 10+</option>
                    <option value="15">Niveau 15+</option>
                    <option value="20">Niveau 20+</option>
                  </select>
                  
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="level">Trier par niveau</option>
                    <option value="members">Trier par membres</option>
                    <option value="honor">Trier par honneur</option>
                  </select>
                  
                  <div className="view-toggle">
                    <button 
                      className={viewMode === 'grid' ? 'active' : ''}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid size={16} />
                    </button>
                    <button 
                      className={viewMode === 'list' ? 'active' : ''}
                      onClick={() => setViewMode('list')}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Liste des guildes */}
              <div className={`guilds-container ${viewMode}`}>
                {filteredGuilds.map((guild, index) => (
                  <motion.div
                    key={guild.id}
                    className="guild-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      loadGuildDetails(guild.id);
                      setShowGuildDetails(true);
                    }}
                  >
                    <div className="guild-card-header">
                      <div className="guild-info">
                        <h3>{guild.display_name}</h3>
                        <div className="guild-level" style={{ color: getRarityColor(guild.level) }}>
                          Niveau {guild.level}
                        </div>
                      </div>
                      <div className="guild-stats">
                        <div className="stat">
                          <Users size={16} />
                          <span>{guild.current_members}/{guild.max_members}</span>
                        </div>
                        <div className="stat">
                          <Trophy size={16} />
                          <span>{guild.guild_honor.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="guild-description">{guild.description}</p>
                    
                    <div className="guild-features">
                      {guild.territories && guild.territories.length > 0 && (
                        <div className="feature">
                          <MapPin size={14} />
                          <span>{guild.territories.length} territoire(s)</span>
                        </div>
                      )}
                      {guild.projects && guild.projects.length > 0 && (
                        <div className="feature">
                          <Hammer size={14} />
                          <span>{guild.projects.length} projet(s)</span>
                        </div>
                      )}
                      {guild.raids && guild.raids.length > 0 && (
                        <div className="feature">
                          <Sword size={14} />
                          <span>{guild.raids.filter(r => r.status === 'active').length} raid(s) actif(s)</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="guild-actions">
                      <button 
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinGuild(guild.id);
                        }}
                      >
                        <UserPlus size={16} />
                        Rejoindre
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadGuildDetails(guild.id);
                          setShowGuildDetails(true);
                        }}
                      >
                        <Eye size={16} />
                        Détails
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tab Raids */}
          {activeTab === 'raids' && userGuild && (
            <motion.div
              key="raids"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="tab-content"
            >
              <div className="section-header">
                <h2><RaidIcon size={24} /> Raids de Guilde</h2>
                {['leader', 'officer'].includes(userGuildRank) && (
                  <button 
                    className="btn-primary"
                    onClick={() => setShowRaidModal(true)}
                  >
                    <Plus size={16} />
                    Démarrer un Raid
                  </button>
                )}
              </div>

              <div className="raids-grid">
                {guildRaids.map((raid) => (
                  <div key={raid.id} className="raid-card">
                    <div className="raid-header">
                      <h3>{raid.raid_name}</h3>
                      <div className="raid-status">
                        {getStatusIcon(raid.status)}
                        <span>{raid.status}</span>
                      </div>
                    </div>
                    
                    <div className="raid-boss">
                      <div className="boss-info">
                        <h4>{raid.boss_name}</h4>
                        <span className="boss-level">Niveau {raid.boss_level}</span>
                      </div>
                      <div className="boss-hp">
                        <div className="hp-bar">
                          <div 
                            className="hp-fill" 
                            style={{ width: `${(raid.current_hp / raid.max_hp) * 100}%` }}
                          ></div>
                        </div>
                        <span>{raid.current_hp.toLocaleString()}/{raid.max_hp.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="raid-participants">
                      <Users size={16} />
                      <span>{raid.current_participants}/{raid.max_participants} participants</span>
                    </div>
                    
                    {raid.status === 'active' && raid.current_participants < raid.max_participants && (
                      <button 
                        className="btn-primary"
                        onClick={() => handleJoinRaid(raid.id)}
                      >
                        Rejoindre le Raid
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tab Territoires */}
          {activeTab === 'territories' && userGuild && (
            <motion.div
              key="territories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="tab-content"
            >
              <div className="section-header">
                <h2><TerritoryIcon size={24} /> Territoires Contrôlés</h2>
              </div>

              <div className="territories-grid">
                {guildTerritories.map((territory) => (
                  <div key={territory.id} className="territory-card">
                    <div className="territory-header">
                      <h3>{territory.territory_name}</h3>
                      <span className="territory-type">{territory.territory_type}</span>
                    </div>
                    
                    <div className="territory-level">
                      <span>Niveau {territory.level}</span>
                    </div>
                    
                    <div className="territory-defense">
                      <Shield size={16} />
                      <span>Défense: {territory.defense_points}/{territory.max_defense_points}</span>
                    </div>
                    
                    {territory.resource_production && (
                      <div className="territory-production">
                        <Gem size={16} />
                        <span>Production active</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tab Projets */}
          {activeTab === 'projects' && userGuild && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="tab-content"
            >
              <div className="section-header">
                <h2><ProjectIcon size={24} /> Projets de Guilde</h2>
                {['leader', 'officer'].includes(userGuildRank) && (
                  <button 
                    className="btn-primary"
                    onClick={() => setShowProjectModal(true)}
                  >
                    <Plus size={16} />
                    Nouveau Projet
                  </button>
                )}
              </div>

              <div className="projects-grid">
                {guildProjects.map((project) => (
                  <div key={project.id} className="project-card">
                    <div className="project-header">
                      <h3>{project.project_name}</h3>
                      <span className="project-type">{project.project_type}</span>
                    </div>
                    
                    <div className="project-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(project.current_progress / project.required_progress) * 100}%` }}
                        ></div>
                      </div>
                      <span>{project.current_progress}/{project.required_progress}</span>
                    </div>
                    
                    <div className="project-level">
                      <span>Niveau {project.level}/{project.max_level}</span>
                    </div>
                    
                    <button 
                      className="btn-secondary"
                      onClick={() => handleContributeToProject(project.id, 100)}
                    >
                      Contribuer (100)
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tab Événements */}
          {activeTab === 'events' && userGuild && (
            <motion.div
              key="events"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="tab-content"
            >
              <div className="section-header">
                <h2><EventIcon size={24} /> Événements de Guilde</h2>
                {['leader', 'officer'].includes(userGuildRank) && (
                  <button 
                    className="btn-primary"
                    onClick={() => setShowEventModal(true)}
                  >
                    <Plus size={16} />
                    Créer un Événement
                  </button>
                )}
              </div>

              <div className="events-grid">
                {guildEvents.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <h3>{event.event_name}</h3>
                      <div className="event-status">
                        {getStatusIcon(event.status)}
                        <span>{event.status}</span>
                      </div>
                    </div>
                    
                    <div className="event-type">
                      <span>{event.event_type}</span>
                    </div>
                    
                    <div className="event-time">
                      <Clock size={16} />
                      <span>{new Date(event.start_time).toLocaleString()}</span>
                    </div>
                    
                    {event.max_participants && (
                      <div className="event-participants">
                        <Users size={16} />
                        <span>{event.current_participants}/{event.max_participants}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedGuildSystem;
