import React from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import AdvancedGuildSystem from './AdvancedGuildSystem';
import './Guilds.css';

const Guilds = () => {
  return (
    <AuthProvider>
      <AdvancedGuildSystem />
    </AuthProvider>
  );
};

export default Guilds;