import React, { useState } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Settings, 
  ToggleSwitch, 
  ThemeToggle, 
  SettingsDemo,
  Inventory,
  Guilds
} from '../index';
import './ComponentsDemo.css';

const ComponentsDemo = () => {
  const [activeComponent, setActiveComponent] = useState('settings');
  const [demoSettings, setDemoSettings] = useState({
    notifications: true,
    sound: false,
    theme: 'dark',
    autoSave: true,
    showFPS: false
  });

  const components = [
    { id: 'settings', name: 'Settings', component: Settings },
    { id: 'inventory', name: 'Inventory', component: Inventory },
    { id: 'guilds', name: 'Guilds', component: Guilds },
    { id: 'toggle-switch', name: 'ToggleSwitch', component: ToggleSwitch },
    { id: 'theme-toggle', name: 'ThemeToggle', component: ThemeToggle },
    { id: 'settings-demo', name: 'SettingsDemo', component: SettingsDemo }
  ];

  const handleSettingChange = (key, value) => {
    setDemoSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderComponent = () => {
    const component = components.find(c => c.id === activeComponent);
    
    if (!component) return null;

    const ComponentToRender = component.component;

    switch (component.id) {
      case 'toggle-switch':
        return (
          <div className="demo-container">
            <h2>ToggleSwitch Component</h2>
            <div className="demo-grid">
              <div className="demo-item">
                <h3>Small Size</h3>
                <ToggleSwitch
                  size="small"
                  checked={demoSettings.notifications}
                  onChange={(value) => handleSettingChange('notifications', value)}
                  label="Notifications"
                  description="Receive push notifications"
                />
              </div>
              <div className="demo-item">
                <h3>Medium Size (Default)</h3>
                <ToggleSwitch
                  checked={demoSettings.sound}
                  onChange={(value) => handleSettingChange('sound', value)}
                  label="Sound Effects"
                  description="Play sound effects"
                />
              </div>
              <div className="demo-item">
                <h3>Large Size</h3>
                <ToggleSwitch
                  size="large"
                  checked={demoSettings.autoSave}
                  onChange={(value) => handleSettingChange('autoSave', value)}
                  label="Auto Save"
                  description="Automatically save progress"
                />
              </div>
              <div className="demo-item">
                <h3>Disabled State</h3>
                <ToggleSwitch
                  checked={false}
                  onChange={() => {}}
                  disabled={true}
                  label="Disabled Setting"
                  description="This setting is currently disabled"
                />
              </div>
            </div>
          </div>
        );

      case 'theme-toggle':
        return (
          <div className="demo-container">
            <h2>ThemeToggle Component</h2>
            <div className="demo-grid">
              <div className="demo-item">
                <h3>Medium Size (Default)</h3>
                <ThemeToggle
                  theme={demoSettings.theme}
                  onThemeChange={(value) => handleSettingChange('theme', value)}
                />
              </div>
              <div className="demo-item">
                <h3>Small Size</h3>
                <ThemeToggle
                  size="small"
                  theme={demoSettings.theme}
                  onThemeChange={(value) => handleSettingChange('theme', value)}
                />
              </div>
              <div className="demo-item">
                <h3>Large Size</h3>
                <ThemeToggle
                  size="large"
                  theme={demoSettings.theme}
                  onThemeChange={(value) => handleSettingChange('theme', value)}
                />
              </div>
            </div>
          </div>
        );

      case 'settings-demo':
        return (
          <div className="demo-container">
            <SettingsDemo />
          </div>
        );

      default:
        return (
          <div className="demo-container">
            <ComponentToRender />
          </div>
        );
    }
  };

  return (
    <AuthProvider>
    <div className="components-demo">
      <motion.div className="demo-header" 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>🎮 Composants Solo Leveling</h1>
        <p>Démonstration de tous les composants créés</p>
      </motion.div>

      {/* Navigation des composants */}
      <motion.div
        className="component-navigation"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="nav-tabs">
          {components.map((comp) => (
            <button
              key={comp.id}
              className={`nav-tab ${activeComponent === comp.id ? 'active' : ''}`}
              onClick={() => setActiveComponent(comp.id)}
            >
              {comp.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Affichage du composant actif */}
      <motion.div
        className="component-display"
        key={activeComponent}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderComponent()}
      </motion.div>

      {/* État des paramètres de démonstration */}
      <motion.div
        className="demo-state"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h3>État des Paramètres de Démonstration</h3>
        <div className="state-display">
          <pre>{JSON.stringify(demoSettings, null, 2)}</pre>
        </div>
      </motion.div>
    </div>
    </AuthProvider>
  );
};

export default ComponentsDemo;
