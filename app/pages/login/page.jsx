"use client";

import { Button } from "react-bootstrap";
import { useState, useContext, useEffect } from "react";
import { checkUserCredentials, registerUser } from '@service/userService';
import { UserContext } from '@/app/layout';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';
import BackButton from "@component/ui/BackButton";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { user, setUser } = useContext(UserContext);
  const router = useRouter();

  // Usa useEffect per il reindirizzamento invece di farlo durante il render
  useEffect(() => {
    if (user) {
      router.push('/pages/user'); // Reindirizza alla pagina utente
    }
  }, [user, router]);

  const validateForm = () => {
    // Validazione username
    if (username.length < 3) {
      setError('Username deve essere di almeno 3 caratteri');
      return false;
    }

    // Validazione caratteri speciali username
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setError('Username può contenere solo lettere, numeri e underscore');
      return false;
    }

    // Validazione password
    if (password.length < 4) {
      setError('Password deve essere di almeno 4 caratteri');
      return false;
    }

    // Validazione conferma password (solo per registrazione)
    if (!isLogin && password !== confirmPassword) {
      setError('Le password non corrispondono');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validazione lato client
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      let result;
      
      if (isLogin) {
        // Login - controlla se l'utente è nel database
        result = await checkUserCredentials(username, password);
        
        if (result.success) {
          // Utente trovato e password corretta
          setUser(result.user);
          // Il reindirizzamento avverrà tramite useEffect
        } else {
          // Utente non trovato o password errata
          setError(result.error || 'Credenziali non valide');
        }
      } else {
        // Registrazione - controlla che l'username non sia già presente
        result = await registerUser(username, password, email || null);
        
        if (result.success) {
          // Registrazione completata
          setUser(result.user);
          // Il reindirizzamento avverrà tramite useEffect
        } else {
          setError(result.error || 'Errore durante la registrazione');
        }
      }
    } catch (error) {
      setError(error.message || 'Si è verificato un errore imprevisto');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  // Se l'utente è già loggato, mostra null mentre useEffect gestisce il reindirizzamento
  if (user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <BackButton bg={true} /> 
      <div className={styles.loginCard}>
        {/* Header con switch */}
        <div className={styles.header}>
          <div className={styles.switchContainer}>
            <button
              className={`${styles.switchButton} ${isLogin ? styles.active : ''}`}
              onClick={() => !isLogin && switchMode()}
              type="button"
            >
              Accedi
            </button>
            <button
              className={`${styles.switchButton} ${!isLogin ? styles.active : ''}`}
              onClick={() => isLogin && switchMode()}
              type="button"
            >
              Registrati
            </button>
          </div>
          <h2 className={styles.title}>
            {isLogin ? 'Accedi!' : 'Crea Account'}
          </h2>
        </div>

        {/* Messaggio di errore */}
        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <FormField
            label="Username *"
            type="text"
            id="username"
            value={username}
            onChange={setUsername}
            placeholder="Inserisci il tuo username"
            disabled={loading}
            required
            minLength={3}
          />

          {!isLogin && (
            <FormField
              label="Email"
              type="email"
              id="email"
              value={email}
              onChange={setEmail}
              placeholder="email@esempio.com (opzionale)"
              disabled={loading}
            />
          )}

          <span className="mt-1"></span>

          <FormField
            label="Password *"
            type="password"
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="Inserisci la password"
            disabled={loading}
            required
            minLength={4}
          />

          {!isLogin && (
            <FormField
              label="Conferma Password *"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Conferma la password"
              disabled={loading}
              required
              minLength={4}
            />
          )}

          <SubmitButton 
            loading={loading} 
            isLogin={isLogin} 
          />
        </form>

        <SwitchLink 
          isLogin={isLogin} 
          loading={loading} 
          onSwitch={switchMode} 
        />
      </div>
    </div>
  );
}

// Componente per i campi del form
function FormField({ 
  label, 
  type, 
  id, 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  required = false, 
  minLength 
}) {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        type={type}
        className={styles.input}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        minLength={minLength}
      />
    </div>
  );
}

// Componente per il bottone di submit
function SubmitButton({ loading, isLogin }) {
  return (
    <Button 
      variant="primary"
      type="submit"
      className={`${styles.submitButton} myrtle`}
      disabled={loading}
    >
      {loading ? (
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          {isLogin ? 'Accesso in corso...' : 'Registrazione in corso...'}
        </div>
      ) : (
        isLogin ? 'ACCEDI' : 'REGISTRATI'
      )}
    </Button>
  );
}

// Componente per il link di switch
function SwitchLink({ isLogin, loading, onSwitch }) {
  return (
    <div className={styles.switchLink}>
      <span>
        {isLogin ? 'Non hai un account?' : 'Hai già un account?'}
      </span>
      <button
        className={styles.linkButton}
        onClick={onSwitch}
        disabled={loading}
        type="button"
      >
        {isLogin ? 'Registrati' : 'Accedi'}
      </button>
    </div>
  );
}