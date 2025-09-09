import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from './Settings';
import ToggleSwitch from './ToggleSwitch';
import ThemeToggle from './ThemeToggle';

// Wrapper component for components that need router context
const RouterWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

// Mock react-icons to avoid import issues in tests
jest.mock('react-icons/fa', () => ({
  FaCog: () => <span data-testid="icon-cog">⚙️</span>,
  FaUser: () => <span data-testid="icon-user">👤</span>,
  FaBell: () => <span data-testid="icon-bell">🔔</span>,
  FaPalette: () => <span data-testid="icon-palette">🎨</span>,
  FaShieldAlt: () => <span data-testid="icon-shield">🛡️</span>,
  FaInfoCircle: () => <span data-testid="icon-info">ℹ️</span>,
  FaExclamationTriangle: () => <span data-testid="icon-warning">⚠️</span>,
  FaSave: () => <span data-testid="icon-save">💾</span>,
  FaUndo: () => <span data-testid="icon-undo">↶</span>,
  FaSignOutAlt: () => <span data-testid="icon-logout">🚪</span>,
  FaTrash: () => <span data-testid="icon-trash">🗑️</span>,
  FaUserShield: () => <span data-testid="icon-user-shield">👤🛡️</span>,
  FaVolumeUp: () => <span data-testid="icon-volume">🔊</span>,
  FaVolumeMute: () => <span data-testid="icon-mute">🔇</span>,
  FaEye: () => <span data-testid="icon-eye">👁️</span>,
  FaEyeSlash: () => <span data-testid="icon-eye-slash">🙈</span>,
  FaGlobe: () => <span data-testid="icon-globe">🌍</span>,
  FaMoon: () => <span data-testid="icon-moon">🌙</span>,
  FaSun: () => <span data-testid="icon-sun">☀️</span>,
  FaDesktop: () => <span data-testid="icon-desktop">💻</span>
}));

describe('Settings Components', () => {
  describe('ToggleSwitch', () => {
    test('renders with label and description', () => {
      render(
        <ToggleSwitch
          checked={false}
          onChange={() => {}}
          label="Test Toggle"
          description="Test description"
        />
      );

      expect(screen.getByText('Test Toggle')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    test('calls onChange when clicked', () => {
      const mockOnChange = jest.fn();
      render(
        <ToggleSwitch
          checked={false}
          onChange={mockOnChange}
          label="Test Toggle"
        />
      );

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      expect(mockOnChange).toHaveBeenCalledWith(true);
    });

    test('shows correct checked state', () => {
      render(
        <ToggleSwitch
          checked={true}
          onChange={() => {}}
          label="Test Toggle"
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    test('can be disabled', () => {
      render(
        <ToggleSwitch
          checked={false}
          onChange={() => {}}
          disabled={true}
          label="Test Toggle"
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeDisabled();
    });
  });

  describe('ThemeToggle', () => {
    test('renders all theme options', () => {
      render(
        <ThemeToggle
          theme="dark"
          onThemeChange={() => {}}
        />
      );

      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('Auto')).toBeInTheDocument();
    });

    test('shows current theme as active', () => {
      render(
        <ThemeToggle
          theme="light"
          onThemeChange={() => {}}
        />
      );

      const lightButton = screen.getByText('Light').closest('button');
      expect(lightButton).toHaveClass('active');
    });

    test('calls onThemeChange when theme is selected', () => {
      const mockOnThemeChange = jest.fn();
      render(
        <ThemeToggle
          theme="dark"
          onThemeChange={mockOnThemeChange}
        />
      );

      const lightButton = screen.getByText('Light').closest('button');
      fireEvent.click(lightButton);

      expect(mockOnThemeChange).toHaveBeenCalledWith('light');
    });
  });

  describe('Settings', () => {
    test('renders settings page with header', () => {
      render(
        <RouterWrapper>
          <Settings />
        </RouterWrapper>
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Customize your Solo Leveling experience')).toBeInTheDocument();
    });

    test('shows character information banner', () => {
      render(
        <RouterWrapper>
          <Settings />
        </RouterWrapper>
      );

      // Wait for character data to load
      setTimeout(() => {
        expect(screen.getByText(/Shadow Monarch/)).toBeInTheDocument();
        expect(screen.getByText(/Level 99/)).toBeInTheDocument();
      }, 100);
    });

    test('renders settings sections', () => {
      render(
        <RouterWrapper>
          <Settings />
        </RouterWrapper>
      );

      expect(screen.getByText('User Preferences')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Audio & Video')).toBeInTheDocument();
      expect(screen.getByText('Game Settings')).toBeInTheDocument();
      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    test('shows save and reset buttons', () => {
      render(
        <RouterWrapper>
          <Settings />
        </RouterWrapper>
      );

      expect(screen.getByText('Save Settings')).toBeInTheDocument();
      expect(screen.getByText('Reset Changes')).toBeInTheDocument();
    });
  });
});

// Mock localStorage for tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.confirm for tests
global.confirm = jest.fn(() => true);
