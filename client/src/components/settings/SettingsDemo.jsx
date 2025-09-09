import React, { useState } from 'react';
import ToggleSwitch from './ToggleSwitch';
import ThemeToggle from './ThemeToggle';
import './SettingsDemo.css';

const SettingsDemo = () => {
  const [demoSettings, setDemoSettings] = useState({
    notifications: true,
    sound: false,
    theme: 'dark',
    autoSave: true,
    showFPS: false
  });

  const handleSettingChange = (key, value) => {
    setDemoSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="settings-demo">
      <div className="demo-header">
        <h2>Settings Components Demo</h2>
        <p>Test the new settings components</p>
      </div>

      <div className="demo-section">
        <h3>ToggleSwitch Examples</h3>
        
        <div className="demo-grid">
          <div className="demo-item">
            <h4>Small Size</h4>
            <ToggleSwitch
              size="small"
              checked={demoSettings.notifications}
              onChange={(value) => handleSettingChange('notifications', value)}
              label="Notifications"
              description="Receive push notifications"
            />
          </div>

          <div className="demo-item">
            <h4>Medium Size (Default)</h4>
            <ToggleSwitch
              checked={demoSettings.sound}
              onChange={(value) => handleSettingChange('sound', value)}
              label="Sound Effects"
              description="Play sound effects"
            />
          </div>

          <div className="demo-item">
            <h4>Large Size</h4>
            <ToggleSwitch
              size="large"
              checked={demoSettings.autoSave}
              onChange={(value) => handleSettingChange('autoSave', value)}
              label="Auto Save"
              description="Automatically save progress"
            />
          </div>

          <div className="demo-item">
            <h4>Disabled State</h4>
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

      <div className="demo-section">
        <h3>ThemeToggle Examples</h3>
        
        <div className="demo-grid">
          <div className="demo-item">
            <h4>Medium Size (Default)</h4>
            <ThemeToggle
              theme={demoSettings.theme}
              onThemeChange={(value) => handleSettingChange('theme', value)}
            />
          </div>

          <div className="demo-item">
            <h4>Small Size</h4>
            <ThemeToggle
              size="small"
              theme={demoSettings.theme}
              onThemeChange={(value) => handleSettingChange('theme', value)}
            />
          </div>

          <div className="demo-item">
            <h4>Large Size</h4>
            <ThemeToggle
              size="large"
              theme={demoSettings.theme}
              onThemeChange={(value) => handleSettingChange('theme', value)}
            />
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>Current Settings State</h3>
        <div className="demo-state">
          <pre>{JSON.stringify(demoSettings, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default SettingsDemo;
