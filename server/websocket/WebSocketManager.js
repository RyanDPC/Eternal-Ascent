// Gestionnaire WebSocket pour l'API RPG Dungeon

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { EventEmitter } = require('events');

class WebSocketManager extends EventEmitter {
  constructor(server) {
    super();
    this.server = server;
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket
    this.rooms = new Map(); // roomId -> Set of userIds
    this.initialize();
  }

  initialize() {
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleError.bind(this));

    console.log('🔌 WebSocket Server initialisé sur /ws');
  }

  verifyClient(info) {
    const token = this.extractTokenFromUrl(info.req.url);
    if (!token) {
      return false;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eterna_secret_key');
      info.req.user = decoded;
      return true;
    } catch (error) {
      console.error('Token WebSocket invalide:', error.message);
      return false;
    }
  }

  extractTokenFromUrl(url) {
    const urlObj = new URL(url, 'http://localhost');
    return urlObj.searchParams.get('token');
  }

  handleConnection(ws, req) {
    const userId = req.user.userId;
    const username = req.user.username;

    console.log(`🔌 Nouvelle connexion WebSocket: ${username} (${userId})`);

    // Stocker la connexion
    this.clients.set(userId, ws);
    ws.userId = userId;
    ws.username = username;

    // Envoyer un message de bienvenue
    this.sendToUser(userId, {
      type: 'connection',
      message: 'Connexion WebSocket établie',
      timestamp: new Date().toISOString()
    });

    // Gérer les messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Erreur parsing message WebSocket:', error);
        this.sendToUser(userId, {
          type: 'error',
          message: 'Message invalide',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Gérer la déconnexion
    ws.on('close', () => {
      console.log(`🔌 Déconnexion WebSocket: ${username} (${userId})`);
      this.clients.delete(userId);
      this.removeUserFromAllRooms(userId);
    });

    // Gérer les erreurs
    ws.on('error', (error) => {
      console.error(`Erreur WebSocket pour ${username}:`, error);
      this.clients.delete(userId);
    });
  }

  handleMessage(ws, message) {
    const { type, data } = message;
    const userId = ws.userId;

    switch (type) {
      case 'join_room':
        this.joinRoom(userId, data.roomId);
        break;
      case 'leave_room':
        this.leaveRoom(userId, data.roomId);
        break;
      case 'chat_message':
        this.handleChatMessage(userId, data);
        break;
      case 'combat_action':
        this.handleCombatAction(userId, data);
        break;
      case 'guild_message':
        this.handleGuildMessage(userId, data);
        break;
      case 'trade_request':
        this.handleTradeRequest(userId, data);
        break;
      case 'pvp_challenge':
        this.handlePvPChallenge(userId, data);
        break;
      default:
        console.log(`Type de message WebSocket non reconnu: ${type}`);
    }
  }

  handleError(error) {
    console.error('Erreur WebSocket Server:', error);
  }

  // Méthodes de gestion des salles
  joinRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(userId);
    
    this.sendToUser(userId, {
      type: 'room_joined',
      roomId,
      message: `Vous avez rejoint la salle ${roomId}`,
      timestamp: new Date().toISOString()
    });

    // Notifier les autres utilisateurs
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      userId,
      username: this.getUsername(userId),
      roomId,
      timestamp: new Date().toISOString()
    }, userId);
  }

  leaveRoom(userId, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      
      this.sendToUser(userId, {
        type: 'room_left',
        roomId,
        message: `Vous avez quitté la salle ${roomId}`,
        timestamp: new Date().toISOString()
      });

      // Notifier les autres utilisateurs
      this.broadcastToRoom(roomId, {
        type: 'user_left',
        userId,
        username: this.getUsername(userId),
        roomId,
        timestamp: new Date().toISOString()
      }, userId);
    }
  }

  removeUserFromAllRooms(userId) {
    for (const [roomId, users] of this.rooms.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        this.broadcastToRoom(roomId, {
          type: 'user_left',
          userId,
          username: this.getUsername(userId),
          roomId,
          timestamp: new Date().toISOString()
        }, userId);
      }
    }
  }

  // Méthodes de chat
  handleChatMessage(userId, data) {
    const { roomId, message, targetUserId } = data;
    
    const chatMessage = {
      type: 'chat_message',
      userId,
      username: this.getUsername(userId),
      message,
      roomId,
      timestamp: new Date().toISOString()
    };

    if (targetUserId) {
      // Message privé
      this.sendToUser(targetUserId, chatMessage);
      this.sendToUser(userId, chatMessage);
    } else if (roomId) {
      // Message de salle
      this.broadcastToRoom(roomId, chatMessage, userId);
    } else {
      // Message global
      this.broadcastToAll(chatMessage, userId);
    }
  }

  // Méthodes de combat
  handleCombatAction(userId, data) {
    const { action, targetId, roomId } = data;
    
    const combatMessage = {
      type: 'combat_action',
      userId,
      username: this.getUsername(userId),
      action,
      targetId,
      roomId,
      timestamp: new Date().toISOString()
    };

    if (roomId) {
      this.broadcastToRoom(roomId, combatMessage, userId);
    } else {
      this.broadcastToAll(combatMessage, userId);
    }
  }

  // Méthodes de guilde
  handleGuildMessage(userId, data) {
    const { guildId, message } = data;
    
    const guildMessage = {
      type: 'guild_message',
      userId,
      username: this.getUsername(userId),
      guildId,
      message,
      timestamp: new Date().toISOString()
    };

    // Envoyer à tous les membres de la guilde
    this.broadcastToGuild(guildId, guildMessage, userId);
  }

  // Méthodes de trading
  handleTradeRequest(userId, data) {
    const { targetUserId, items, gold } = data;
    
    const tradeMessage = {
      type: 'trade_request',
      fromUserId: userId,
      fromUsername: this.getUsername(userId),
      targetUserId,
      items,
      gold,
      timestamp: new Date().toISOString()
    };

    this.sendToUser(targetUserId, tradeMessage);
    this.sendToUser(userId, {
      ...tradeMessage,
      message: 'Demande de trade envoyée'
    });
  }

  // Méthodes PvP
  handlePvPChallenge(userId, data) {
    const { targetUserId, challengeType } = data;
    
    const pvpMessage = {
      type: 'pvp_challenge',
      fromUserId: userId,
      fromUsername: this.getUsername(userId),
      targetUserId,
      challengeType,
      timestamp: new Date().toISOString()
    };

    this.sendToUser(targetUserId, pvpMessage);
    this.sendToUser(userId, {
      ...pvpMessage,
      message: 'Défi PvP envoyé'
    });
  }

  // Méthodes utilitaires
  sendToUser(userId, message) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcastToRoom(roomId, message, excludeUserId = null) {
    if (this.rooms.has(roomId)) {
      for (const userId of this.rooms.get(roomId)) {
        if (userId !== excludeUserId) {
          this.sendToUser(userId, message);
        }
      }
    }
  }

  broadcastToAll(message, excludeUserId = null) {
    for (const [userId, ws] of this.clients.entries()) {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  broadcastToGuild(guildId, message, excludeUserId = null) {
    // Cette méthode devrait être implémentée avec une requête à la base de données
    // pour récupérer les membres de la guilde
    console.log(`Broadcast to guild ${guildId}:`, message);
  }

  getUsername(userId) {
    const ws = this.clients.get(userId);
    return ws ? ws.username : 'Unknown';
  }

  getConnectedUsers() {
    return Array.from(this.clients.keys());
  }

  getRoomUsers(roomId) {
    return this.rooms.has(roomId) ? Array.from(this.rooms.get(roomId)) : [];
  }

  getStats() {
    return {
      connectedUsers: this.clients.size,
      rooms: this.rooms.size,
      totalRooms: Array.from(this.rooms.keys()),
      connectedUserIds: this.getConnectedUsers()
    };
  }

  // Méthodes pour les notifications
  sendNotification(userId, notification) {
    this.sendToUser(userId, {
      type: 'notification',
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  broadcastNotification(notification, excludeUserId = null) {
    this.broadcastToAll({
      type: 'notification',
      ...notification,
      timestamp: new Date().toISOString()
    }, excludeUserId);
  }

  // Méthodes pour les événements de jeu
  broadcastGameEvent(event) {
    this.broadcastToAll({
      type: 'game_event',
      ...event,
      timestamp: new Date().toISOString()
    });
  }

  broadcastRoomEvent(roomId, event) {
    this.broadcastToRoom(roomId, {
      type: 'game_event',
      ...event,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = WebSocketManager;

