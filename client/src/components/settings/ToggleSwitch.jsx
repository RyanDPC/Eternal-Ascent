import React from 'react';
import './ToggleSwitch.css';

const ToggleSwitch = ({ 
  checked, 
  onChange, 
  disabled = false, 
  size = 'medium',
  label,
  description 
}) => {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`toggle-container toggle-${size}`}>
      <div className="toggle-wrapper">
        <button
          type="button"
          className={`toggle-switch ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={handleToggle}
          onKeyDown={handleKeyPress}
          disabled={disabled}
          role="switch"
          aria-checked={checked}
          aria-label={label}
          tabIndex={disabled ? -1 : 0}
        >
          <div className="toggle-slider" />
        </button>
        
        {label && (
          <label 
            className="toggle-label"
            onClick={!disabled ? handleToggle : undefined}
          >
            {label}
          </label>
        )}
      </div>
      
      {description && (
        <p className="toggle-description">{description}</p>
      )}
    </div>
  );
};

export default ToggleSwitch;
