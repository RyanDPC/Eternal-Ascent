import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationSystem';
import { ThemeProvider } from './contexts/ThemeSystem';
import NotificationDisplay from './components/common/NotificationDisplay';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';
import UserInfo from './components/common/UserInfo';

import { Menu, X, Monitor, Smartphone, Globe } from 'lucide-react';
import './App.css';

// Lazy loading des composants
const Login = lazy(() => import('./components/auth/Login'));
const Register = lazy(() => import('./components/auth/Register'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Character = lazy(() => import('./components/character/Character'));
const Quests = lazy(() => import('./components/quests/Quests'));
import Inventory from './components/inventory/Inventory.jsx';
const Dungeons = lazy(() => import('./components/dungeons/Dungeons'));
const GamePage = lazy(() => import('./components/game/GamePage'));
const GuildSystem = lazy(() => import('./components/guilds/Guilds'));
const AdvancedHub = lazy(() => import('./components/advanced/AdvancedHub.jsx'));
const WorldEventsPage = lazy(() => import('./components/advanced/WorldEventsPage.jsx'));
const ShopsPage = lazy(() => import('./components/advanced/ShopsPage.jsx'));
const AuctionsPage = lazy(() => import('./components/advanced/AuctionsPage.jsx'));
const SeasonsPage = lazy(() => import('./components/advanced/SeasonsPage.jsx'));
const LeaderboardsPage = lazy(() => import('./components/advanced/LeaderboardsPage.jsx'));
const FriendsPage = lazy(() => import('./components/advanced/FriendsPage.jsx'));
const MessagesPage = lazy(() => import('./components/advanced/MessagesPage.jsx'));
const CosmeticsPage = lazy(() => import('./components/advanced/CosmeticsPage.jsx'));

function App() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [platform, setPlatform] = useState('web');
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Detect platform
    if (window.electronAPI) {
      setIsElectron(true);
      window.electronAPI.getPlatform().then(setPlatform);
    } else if (window.navigator.userAgent.includes('Mobile')) {
      setPlatform('mobile');
    } else {
      setPlatform('web');
    }
  }, []);

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'win32':
      case 'darwin':
      case 'linux':
        return <Monitor size={16} />;
      case 'mobile':
        return <Smartphone size={16} />;
      default:
        return <Globe size={16} />;
    }
  };

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NotificationProvider>
            <div className="app-container">
              <nav className="main-nav">
                <div className="nav-container">
                  <div className="nav-brand">
                    <h1>🚀 Eternal Ascent</h1>
                    {isElectron && (
                      <span className="platform-indicator">
                        {getPlatformIcon()}
                        {platform === 'win32' ? 'Windows' : 
                         platform === 'darwin' ? 'macOS' : 
                         platform === 'linux' ? 'Linux' : platform}
                      </span>
                    )}
                  </div>
                  
                  {/* Navigation desktop */}
                  <div className="nav-links">
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/character" className="nav-link">Personnage</Link>
                    <Link to="/quests" className="nav-link">Quêtes</Link>
                    <Link to="/inventory" className="nav-link">Inventaire</Link>
                    <Link to="/dungeons" className="nav-link">Donjons</Link>
                    <Link to="/guilds" className="nav-link">Guildes</Link>
                  </div>

                  {/* Informations utilisateur et déconnexion */}
                  <div className="nav-user">
                    <UserInfo />
                  </div>

                  {/* Bouton hamburger mobile */}
                  <button className="nav-toggle" onClick={toggleMobileNav}>
                    <Menu size={24} />
                  </button>
                </div>
              </nav>

              {/* Navigation mobile */}
              <div className={`nav-mobile ${isMobileNavOpen ? 'active' : ''}`}>
                <button className="nav-close" onClick={closeMobileNav}>
                  <X size={24} />
                </button>
                <div className="nav-links">
                  <Link to="/dashboard" className="nav-link" onClick={closeMobileNav}>Dashboard</Link>
                  <Link to="/character" className="nav-link" onClick={closeMobileNav}>Personnage</Link>
                  <Link to="/quests" className="nav-link" onClick={closeMobileNav}>Quêtes</Link>
                  <Link to="/inventory" className="nav-link" onClick={closeMobileNav}>Inventaire</Link>
                  <Link to="/dungeons" className="nav-link" onClick={closeMobileNav}>Donjons</Link>
                  <Link to="/guilds" className="nav-link" onClick={closeMobileNav}>Guildes</Link>
                </div>
              </div>

              <main className="main-content">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/character" element={
                      <ProtectedRoute>
                        <Character />
                      </ProtectedRoute>
                    } />
                    <Route path="/quests" element={
                      <ProtectedRoute>
                        <Quests />
                      </ProtectedRoute>
                    } />
                    <Route path="/inventory" element={
                      <ProtectedRoute>
                        <Inventory />
                      </ProtectedRoute>
                    } />
                    <Route path="/dungeons" element={
                      <ProtectedRoute>
                        <Dungeons />
                      </ProtectedRoute>
                    } />
                    <Route path="/game" element={
                      <ProtectedRoute>
                        <GamePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/guilds" element={
                      <ProtectedRoute>
                        <GuildSystem />
                      </ProtectedRoute>
                    } />
                    <Route path="/advanced" element={
                      <ProtectedRoute>
                        <AdvancedHub />
                      </ProtectedRoute>
                    } />
                    <Route path="/world-events" element={<ProtectedRoute><WorldEventsPage /></ProtectedRoute>} />
                    <Route path="/shops" element={<ProtectedRoute><ShopsPage /></ProtectedRoute>} />
                    <Route path="/auctions" element={<ProtectedRoute><AuctionsPage /></ProtectedRoute>} />
                    <Route path="/seasons" element={<ProtectedRoute><SeasonsPage /></ProtectedRoute>} />
                    <Route path="/leaderboards" element={<ProtectedRoute><LeaderboardsPage /></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                    <Route path="/cosmetics" element={<ProtectedRoute><CosmeticsPage /></ProtectedRoute>} />
                  </Routes>
                </Suspense>
              </main>

                             <NotificationDisplay />
            </div>
          </NotificationProvider>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
