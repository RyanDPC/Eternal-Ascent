import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error/success messages when user types
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        setSuccess('Connexion réussie ! Redirection...');
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setError(result.error || 'Erreur de connexion');
      }
      
    } catch (error) {
      setError(error.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-header">
          <h1>🔐 Connexion</h1>
          <p>Connectez-vous à votre compte Eternal Ascent</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Error and Success Messages */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}
          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <div className="input-wrapper">
              <User size={20} className="input-icon" />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Votre nom d'utilisateur"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Votre mot de passe"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-wrapper">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Se souvenir de moi
            </label>
            <a href="#" className="forgot-password">Mot de passe oublié ?</a>
          </div>

          <button
            type="submit"
            className="auth-btn primary"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Pas encore de compte ?{' '}
            <a href="/register" className="auth-link">Créer un compte</a>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="demo-credentials">
          <h3>🧪 Compte de démonstration</h3>
          <p>Utilisez ces identifiants pour tester l'application :</p>
          <div className="demo-info">
            <div className="demo-item">
              <strong>Nom d'utilisateur:</strong> testuser
            </div>
            <div className="demo-item">
              <strong>Mot de passe:</strong> password
            </div>
            <div className="demo-item">
              <strong>✅ Compte créé et testé avec succès !</strong>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
