import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

const UserInfo = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="user-info">
        <span className="user-status">Non connecté</span>
      </div>
    );
  }

  return (
    <div className="user-info">
      <div className="user-details">
        <User size={16} className="user-icon" />
        <span className="username">{user.username || 'Utilisateur'}</span>
      </div>
      <button 
        className="logout-btn" 
        onClick={logout}
        title="Se déconnecter"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
};

export default UserInfo;


