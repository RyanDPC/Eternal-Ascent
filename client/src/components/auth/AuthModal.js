import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Mail, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import databaseService from '../../services/databaseService';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer les messages d'erreur/succès lors de la saisie
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Le nom d\'utilisateur est requis');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (!isLogin && !formData.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (!isLogin && formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Connexion
        const response = await databaseService.authenticateUser({
          username: formData.username,
          password: formData.password
        });

        setSuccess('Connexion réussie !');
        setTimeout(() => {
          onAuthSuccess(response);
          onClose();
        }, 1500);

      } else {
        // Création de compte
        const response = await databaseService.createUser({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });

        setSuccess('Compte créé avec succès !');
        setTimeout(() => {
          onAuthSuccess(response);
          onClose();
        }, 1500);
      }

    } catch (error) {
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="auth-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="auth-modal"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="auth-modal-header">
            <h2>{isLogin ? 'Connexion' : 'Créer un compte'}</h2>
            <button
              className="close-btn"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X size={20} />
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Nom d'utilisateur */}
            <div className="form-group">
              <label htmlFor="username">
                <User size={16} />
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Entrez votre nom d'utilisateur"
                disabled={isLoading}
                required
              />
            </div>

            {/* Email (uniquement pour l'inscription) */}
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Entrez votre email"
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            {/* Mot de passe */}
            <div className="form-group">
              <label htmlFor="password">
                <Lock size={16} />
                Mot de passe
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Entrez votre mot de passe"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmation du mot de passe (uniquement pour l'inscription) */}
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <Lock size={16} />
                  Confirmer le mot de passe
                </label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirmez votre mot de passe"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Messages d'erreur et de succès */}
            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                className="success-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {success}
              </motion.div>
            )}

            {/* Bouton de soumission */}
            <motion.button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {isLogin ? 'Se connecter' : 'Créer le compte'}
                </>
              )}
            </motion.button>
          </form>

          {/* Basculer entre connexion et inscription */}
          <div className="auth-mode-toggle">
            <span>
              {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            </span>
            <button
              type="button"
              className="toggle-btn"
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isLogin ? 'Créer un compte' : 'Se connecter'}
            </button>
          </div>

          {/* Informations supplémentaires */}
          <div className="auth-info">
            <p>
              {isLogin 
                ? 'Connectez-vous pour accéder à votre personnage et sauvegarder votre progression.'
                : 'Créez un compte pour commencer votre aventure et sauvegarder votre progression.'
              }
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
