import React from 'react';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import './ThemeToggle.css';

const ThemeToggle = ({ 
  theme, 
  onThemeChange, 
  disabled = false,
  size = 'medium'
}) => {
  const themes = [
    { value: 'light', icon: FaSun, label: 'Light' },
    { value: 'dark', icon: FaMoon, label: 'Dark' },
    { value: 'auto', icon: FaDesktop, label: 'Auto' }
  ];

  const handleThemeChange = (newTheme) => {
    if (!disabled && onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  const getCurrentThemeIcon = () => {
    const currentTheme = themes.find(t => t.value === theme);
    if (currentTheme) {
      const IconComponent = currentTheme.icon;
      return <IconComponent />;
    }
    return <FaMoon />;
  };

  return (
    <div className={`theme-toggle theme-toggle-${size}`}>
      <div className="theme-toggle-label">
        <span>Theme:</span>
        <div className="current-theme">
          {getCurrentThemeIcon()}
          <span>{themes.find(t => t.value === theme)?.label}</span>
        </div>
      </div>
      
      <div className="theme-options">
        {themes.map((themeOption) => {
          const IconComponent = themeOption.icon;
          const isActive = theme === themeOption.value;
          
          return (
            <button
              key={themeOption.value}
              type="button"
              className={`theme-option ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => handleThemeChange(themeOption.value)}
              disabled={disabled}
              aria-label={`Switch to ${themeOption.label} theme`}
              title={`Switch to ${themeOption.label} theme`}
            >
              <IconComponent />
              <span className="theme-option-label">{themeOption.label}</span>
              
              {isActive && (
                <div className="active-indicator">
                  <div className="active-dot" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeToggle;
