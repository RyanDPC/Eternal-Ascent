import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCog, 
  FaUser, 
  FaBell, 
  FaPalette, 
  FaShieldAlt, 
  FaInfoCircle, 
  FaExclamationTriangle,
  FaSave,
  FaUndo,
  FaSignOutAlt,
  FaTrash,
  FaUserShield,
  FaVolumeUp,
  FaVolumeMute,
  FaEye,
  FaEyeSlash,
  FaGlobe,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import ToggleSwitch from './ToggleSwitch';
import ThemeToggle from './ThemeToggle';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [character, setCharacter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    // User Preferences
    username: '',
    email: '',
    language: 'en',
    timezone: 'UTC',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    soundNotifications: true,
    messageNotifications: true,
    systemNotifications: true,
    
    // Privacy & Security
    profileVisibility: 'public',
    allowFriendRequests: true,
    showOnlineStatus: true,
    allowDirectMessages: true,
    twoFactorAuth: false,
    
    // Appearance
    theme: 'dark',
    fontSize: 'medium',
    compactMode: false,
    showAvatars: true,
    showTimestamps: true,
    
    // Audio & Video
    microphoneEnabled: true,
    cameraEnabled: false,
    audioQuality: 'high',
    videoQuality: 'medium',
    echoCancellation: true,
    noiseSuppression: true,
    
    // Game Settings
    autoSave: true,
    showFPS: false,
    particleEffects: true,
    shadows: true,
    antiAliasing: true,
    
    // System
    autoUpdate: true,
    crashReporting: false,
    telemetry: false,
    debugMode: false
  });

  // Original settings for reset functionality
  const [originalSettings, setOriginalSettings] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Simulate API call to load user settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, create mock character data
      const mockCharacter = {
        id: 'char_001',
        name: 'Shadow Monarch',
        level: 99,
        rank: 'S',
        class: 'Necromancer',
        guild: 'Shadow Guild',
        lastLogin: new Date().toISOString()
      };
      
      setCharacter(mockCharacter);
      
      // Set mock settings
      const mockSettings = {
        ...settings,
        username: mockCharacter.name,
        email: 'shadow.monarch@shadowguild.com',
        language: 'en',
        timezone: 'UTC',
        theme: 'dark'
      };
      
      setSettings(mockSettings);
      setOriginalSettings(mockSettings);
      setLoading(false);
    } catch (err) {
      setError('Failed to load settings');
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOriginalSettings(settings);
      setHasChanges(false);
      
      // Show success message (you could use a toast notification here)
      alert('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Clear local storage, cookies, etc.
      localStorage.clear();
      navigate('/login');
    }
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      'Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.'
    );
    
    if (confirmDelete) {
      const finalConfirm = window.confirm(
        'This is your final warning. Deleting your account will:\n' +
        '• Remove all your characters and progress\n' +
        '• Delete all your messages and conversations\n' +
        '• Cancel any active subscriptions\n' +
        '• This action is irreversible\n\n' +
        'Type "DELETE" to confirm:'
      );
      
      if (finalConfirm) {
        // Handle account deletion
        alert('Account deletion requested. Please contact support for final confirmation.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#4ecdc4';
      case 'offline': return '#95a5a6';
      case 'away': return '#f39c12';
      case 'busy': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <div className="loading-spinner spinning">
            <FaCog />
          </div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-page">
        <div className="settings-error">
          <h2>Error Loading Settings</h2>
          <p>{error}</p>
          <button onClick={loadSettings}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="settings-page">
        <div className="settings-no-character">
          <h2>No Character Found</h2>
          <p>Please create or select a character to access settings.</p>
          <button onClick={() => navigate('/character-select')}>
            Select Character
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Customize your Solo Leveling experience</p>
        
        {/* Character Info Banner */}
        <div className="character-info-banner">
          <span>
            <FaUserShield />
            {character.name} (Level {character.level})
          </span>
          <span>
            <FaGlobe />
            {character.class} • {character.rank} Rank
          </span>
          <span>
            <FaInfoCircle />
            Guild: {character.guild}
          </span>
        </div>
      </div>

      {/* Settings Actions */}
      <div className="settings-actions">
        <button 
          className="save-settings-btn"
          onClick={saveSettings}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <>
              <FaCog className="spinning" />
              Saving...
            </>
          ) : (
            <>
              <FaSave />
              Save Settings
            </>
          )}
        </button>
        
        <button 
          className="reset-settings-btn"
          onClick={resetSettings}
          disabled={!hasChanges}
        >
          <FaUndo />
          Reset Changes
        </button>
      </div>

      {/* Settings Sections */}
      <div className="settings-sections">
        {/* User Preferences */}
        <div className="settings-section">
          <div className="section-header">
            <FaUser />
            <h3>User Preferences</h3>
          </div>
          
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <span>Username:</span>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => handleSettingChange('username', e.target.value)}
                  placeholder="Enter username"
                />
              </label>
            </div>
            
            <div className="setting-item">
              <label>
                <span>Email:</span>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange('email', e.target.value)}
                  placeholder="Enter email"
                />
              </label>
            </div>
            
            <div className="setting-item">
              <label>
                <span>Language:</span>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                </select>
              </label>
            </div>
            
            <div className="setting-item">
              <label>
                <span>Timezone:</span>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="GMT">GMT</option>
                  <option value="CET">Central European Time</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <div className="section-header">
            <FaBell />
            <h3>Notifications</h3>
          </div>
          
          <div className="settings-grid">
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.emailNotifications}
                onChange={(value) => handleSettingChange('emailNotifications', value)}
                label="Email Notifications"
                description="Receive notifications via email"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.pushNotifications}
                onChange={(value) => handleSettingChange('pushNotifications', value)}
                label="Push Notifications"
                description="Receive push notifications in your browser"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.soundNotifications}
                onChange={(value) => handleSettingChange('soundNotifications', value)}
                label="Sound Notifications"
                description="Play sounds for notifications"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.messageNotifications}
                onChange={(value) => handleSettingChange('messageNotifications', value)}
                label="Message Notifications"
                description="Notify about new messages"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.systemNotifications}
                onChange={(value) => handleSettingChange('systemNotifications', value)}
                label="System Notifications"
                description="Receive system and maintenance notifications"
              />
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="settings-section">
          <div className="section-header">
            <FaShieldAlt />
            <h3>Privacy & Security</h3>
          </div>
          
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <span>Profile Visibility:</span>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.allowFriendRequests}
                onChange={(value) => handleSettingChange('allowFriendRequests', value)}
                label="Allow Friend Requests"
                description="Let other players send you friend requests"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.showOnlineStatus}
                onChange={(value) => handleSettingChange('showOnlineStatus', value)}
                label="Show Online Status"
                description="Display your online status to other players"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.allowDirectMessages}
                onChange={(value) => handleSettingChange('allowDirectMessages', value)}
                label="Allow Direct Messages"
                description="Receive private messages from other players"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.twoFactorAuth}
                onChange={(value) => handleSettingChange('twoFactorAuth', value)}
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-section">
          <div className="section-header">
            <FaPalette />
            <h3>Appearance</h3>
          </div>
          
          <div className="settings-grid">
            <div className="setting-item">
              <ThemeToggle
                theme={settings.theme}
                onThemeChange={(value) => handleSettingChange('theme', value)}
              />
            </div>
            
            <div className="setting-item">
              <label>
                <span>Font Size:</span>
                <select
                  value={settings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </label>
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.compactMode}
                onChange={(value) => handleSettingChange('compactMode', value)}
                label="Compact Mode"
                description="Use a more compact layout"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.showAvatars}
                onChange={(value) => handleSettingChange('showAvatars', value)}
                label="Show Avatars"
                description="Display user avatars in the interface"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.showTimestamps}
                onChange={(value) => handleSettingChange('showTimestamps', value)}
                label="Show Timestamps"
                description="Display timestamps for messages and events"
              />
            </div>
          </div>
        </div>

        {/* Audio & Video */}
        <div className="settings-section">
          <div className="section-header">
            <FaVolumeUp />
            <h3>Audio & Video</h3>
          </div>
          
          <div className="settings-grid">
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.microphoneEnabled}
                onChange={(value) => handleSettingChange('microphoneEnabled', value)}
                label="Enable Microphone"
                description="Allow microphone access for voice chat"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.cameraEnabled}
                onChange={(value) => handleSettingChange('cameraEnabled', value)}
                description="Allow camera access for video chat"
              />
            </div>
            
            <div className="setting-item">
              <label>
                <span>Audio Quality:</span>
                <select
                  value={settings.audioQuality}
                  onChange={(e) => handleSettingChange('audioQuality', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            
            <div className="setting-item">
              <label>
                <span>Video Quality:</span>
                <select
                  value={settings.videoQuality}
                  onChange={(e) => handleSettingChange('videoQuality', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.echoCancellation}
                onChange={(value) => handleSettingChange('echoCancellation', value)}
                label="Echo Cancellation"
                description="Reduce echo in voice chat"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.noiseSuppression}
                onChange={(value) => handleSettingChange('noiseSuppression', value)}
                label="Noise Suppression"
                description="Filter out background noise"
              />
            </div>
          </div>
        </div>

        {/* Game Settings */}
        <div className="settings-section">
          <div className="section-header">
            <FaCog />
            <h3>Game Settings</h3>
          </div>
          
          <div className="settings-grid">
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.autoSave}
                onChange={(value) => handleSettingChange('autoSave', value)}
                label="Auto Save"
                description="Automatically save your progress"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.showFPS}
                onChange={(value) => handleSettingChange('showFPS', value)}
                label="Show FPS Counter"
                description="Display frames per second counter"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.particleEffects}
                onChange={(value) => handleSettingChange('particleEffects', value)}
                label="Particle Effects"
                description="Enable visual particle effects"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.shadows}
                onChange={(value) => handleSettingChange('shadows', value)}
                label="Shadows"
                description="Enable dynamic shadows"
              />
            </div>
            
            <div className="setting-item">
              <ToggleSwitch
                checked={settings.antiAliasing}
                onChange={(value) => handleSettingChange('antiAliasing', value)}
                label="Anti-Aliasing"
                description="Smooth jagged edges in graphics"
              />
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="settings-section">
          <div className="section-header">
            <FaInfoCircle />
            <h3>System Information</h3>
          </div>
          
          <div className="system-info">
            <div className="info-item">
              <span>Client Version:</span>
              <strong>1.0.0</strong>
            </div>
            
            <div className="info-item">
              <span>Server Status:</span>
              <span className="status-indicator" style={{ color: getStatusColor('online') }}>
                Online
              </span>
            </div>
            
            <div className="info-item">
              <span>Last Login:</span>
              <strong>{new Date(character.lastLogin).toLocaleString()}</strong>
            </div>
            
            <div className="info-item">
              <span>Account Created:</span>
              <strong>2024-01-01</strong>
            </div>
            
            <div className="info-item">
              <span>Total Playtime:</span>
              <strong>1,247 hours</strong>
            </div>
            
            <div className="info-item">
              <span>Characters:</span>
              <strong>3</strong>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section danger-zone">
          <div className="section-header">
            <FaExclamationTriangle />
            <h3>Danger Zone</h3>
          </div>
          
          <p style={{ marginBottom: '20px', color: '#e74c3c' }}>
            These actions are irreversible. Please proceed with caution.
          </p>
          
          <div className="danger-actions">
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt />
              Logout
            </button>
            
            <button className="delete-account-btn" onClick={handleDeleteAccount}>
              <FaTrash />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
