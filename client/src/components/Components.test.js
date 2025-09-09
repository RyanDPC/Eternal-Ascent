import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { 
  Settings, 
  ToggleSwitch, 
  ThemeToggle, 
  SettingsDemo,
  Inventory,
  Guilds,
  ComponentsDemo
} from './index';

// Wrapper pour les composants qui nécessitent le router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

// Mock pour framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  }
}));

// Mock pour lucide-react
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon">🔍</span>,
  Filter: () => <span data-testid="filter-icon">🔧</span>,
  Grid: () => <span data-testid="grid-icon">⊞</span>,
  List: () => <span data-testid="list-icon">☰</span>,
  TrendingUp: () => <span data-testid="trending-icon">📈</span>,
  Users2: () => <span data-testid="users-icon">👥</span>,
  Target: () => <span data-testid="target-icon">🎯</span>,
  Award: () => <span data-testid="award-icon">🏆</span>,
  Sword: () => <span data-testid="sword-icon">⚔️</span>,
  Shield: () => <span data-testid="shield-icon">🛡️</span>,
  Zap: () => <span data-testid="zap-icon">⚡</span>,
  Heart: () => <span data-testid="heart-icon">❤️</span>,
  Star: () => <span data-testid="star-icon">⭐</span>,
  Crown: () => <span data-testid="crown-icon">👑</span>,
  Gem: () => <span data-testid="gem-icon">💎</span>,
  Coins: () => <span data-testid="coins-icon">💰</span>,
  Eye: () => <span data-testid="eye-icon">👁️</span>,
  EyeOff: () => <span data-testid="eye-off-icon">🙈</span>,
  Settings: () => <span data-testid="settings-icon">⚙️</span>,
  User: () => <span data-testid="user-icon">👤</span>,
  Lock: () => <span data-testid="lock-icon">🔒</span>,
  Volume2: () => <span data-testid="volume-icon">🔊</span>,
  Monitor: () => <span data-testid="monitor-icon">🖥️</span>,
  Gamepad2: () => <span data-testid="gamepad-icon">🎮</span>,
  Save: () => <span data-testid="save-icon">💾</span>,
  Trash2: () => <span data-testid="trash-icon">🗑️</span>,
  Plus: () => <span data-testid="plus-icon">➕</span>,
  Minus: () => <span testid="minus-icon">➖</span>,
  X: () => <span data-testid="x-icon">❌</span>,
  Info: () => <span data-testid="info-icon">ℹ️</span>
}));

// Mock pour react-icons/fa
jest.mock('react-icons/fa', () => ({
  FaCog: () => <span data-testid="fa-cog-icon">⚙️</span>,
  FaBell: () => <span data-testid="fa-bell-icon">🔔</span>,
  FaShieldAlt: () => <span data-testid="fa-shield-icon">🛡️</span>,
  FaPalette: () => <span data-testid="fa-palette-icon">🎨</span>,
  FaVolumeUp: () => <span data-testid="fa-volume-icon">🔊</span>,
  FaGamepad: () => <span data-testid="fa-gamepad-icon">🎮</span>,
  FaDesktop: () => <span data-testid="fa-desktop-icon">🖥️</span>,
  FaUser: () => <span data-testid="fa-user-icon">👤</span>,
  FaLock: () => <span data-testid="fa-lock-icon">🔒</span>,
  FaEye: () => <span data-testid="fa-eye-icon">👁️</span>,
  FaEyeSlash: () => <span data-testid="fa-eye-slash-icon">🙈</span>,
  FaSave: () => <span data-testid="fa-save-icon">💾</span>,
  FaTrash: () => <span data-testid="fa-trash-icon">🗑️</span>,
  FaPlus: () => <span data-testid="fa-plus-icon">➕</span>,
  FaMinus: () => <span data-testid="fa-minus-icon">➖</span>,
  FaTimes: () => <span data-testid="fa-times-icon">❌</span>,
  FaInfo: () => <span data-testid="fa-info-icon">ℹ️</span>
}));

// Mock pour localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock pour window.confirm
global.window.confirm = jest.fn(() => true);

describe('Components Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ToggleSwitch', () => {
    test('renders correctly with default props', () => {
      render(<ToggleSwitch checked={false} onChange={() => {}} />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    test('handles click events', () => {
      const handleChange = jest.fn();
      render(<ToggleSwitch checked={false} onChange={handleChange} />);
      
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    test('supports different sizes', () => {
      const { rerender } = render(<ToggleSwitch size="small" checked={false} onChange={() => {}} />);
      expect(screen.getByRole('switch')).toHaveClass('toggle-switch', 'small');
      
      rerender(<ToggleSwitch size="large" checked={false} onChange={() => {}} />);
      expect(screen.getByRole('switch')).toHaveClass('toggle-switch', 'large');
    });
  });

  describe('ThemeToggle', () => {
    test('renders all theme options', () => {
      render(<ThemeToggle theme="dark" onThemeChange={() => {}} />);
      
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('Auto')).toBeInTheDocument();
    });

    test('highlights active theme', () => {
      render(<ThemeToggle theme="dark" onThemeChange={() => {}} />);
      
      const darkButton = screen.getByText('Dark').closest('button');
      expect(darkButton).toHaveClass('active');
    });

    test('handles theme change', () => {
      const handleThemeChange = jest.fn();
      render(<ThemeToggle theme="dark" onThemeChange={handleThemeChange} />);
      
      const lightButton = screen.getByText('Light').closest('button');
      fireEvent.click(lightButton);
      
      expect(handleThemeChange).toHaveBeenCalledWith('light');
    });
  });

  describe('Settings', () => {
    test('renders settings sections', () => {
      render(
        <RouterWrapper>
          <Settings />
        </RouterWrapper>
      );
      
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });
  });

  describe('Inventory', () => {
    test('renders inventory page', () => {
      render(<Inventory />);
      
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Character Info')).toBeInTheDocument();
    });

    test('displays inventory controls', () => {
      render(<Inventory />);
      
      expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
      expect(screen.getByText('All Types')).toBeInTheDocument();
      expect(screen.getByText('Sort by:')).toBeInTheDocument();
    });
  });

  describe('Guilds', () => {
    test('renders guilds page', () => {
      render(<Guilds />);
      
      expect(screen.getByText('Guilds')).toBeInTheDocument();
      expect(screen.getByText('Join a Guild')).toBeInTheDocument();
    });

    test('displays guild controls', () => {
      render(<Guilds />);
      
      expect(screen.getByPlaceholderText('Search guilds...')).toBeInTheDocument();
      expect(screen.getByText('All Ranks')).toBeInTheDocument();
      expect(screen.getByText('All Status')).toBeInTheDocument();
    });
  });

  describe('ComponentsDemo', () => {
    test('renders demo header', () => {
      render(<ComponentsDemo />);
      
      expect(screen.getByText('🎮 Composants Solo Leveling')).toBeInTheDocument();
      expect(screen.getByText('Démonstration de tous les composants créés')).toBeInTheDocument();
    });

    test('displays component navigation', () => {
      render(<ComponentsDemo />);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Guilds')).toBeInTheDocument();
    });

    test('switches between components', () => {
      render(<ComponentsDemo />);
      
      const inventoryTab = screen.getByText('Inventory');
      fireEvent.click(inventoryTab);
      
      expect(inventoryTab).toHaveClass('active');
    });
  });
});
