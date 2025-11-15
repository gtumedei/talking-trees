"use client";

import { Button } from "react-bootstrap";
import { useState, useContext, useEffect, FormEvent } from "react";
import { UserContext } from "@/app/layout";
import { useRouter } from "next/navigation";
import styles from "./Login.module.css";
import BackButton from "@component/ui/BackButton";
import { checkUserCredentials, registerUser, addTreeToUser } from "@service/userServices";
import { UserContextType} from '@service/types/interface_context';
import {UserDb} from '@service/types/interface_db'
import { isValidUser } from "@/backend/treeServices";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const { user, setUser, userTree } = useContext(UserContext) as UserContextType;
  const router = useRouter();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    if (isValidUser(user)) {
      router.push("/pages/user");
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const result = await checkUserCredentials(username, password);
        if (result.success) {
          const res = result.user || {} as UserDb
          setUser(res);
          if (userTree) await addTreeToUser(username, userTree);
          await sleep(1000);
        } else {
          setError(result.error || 'Error!');
        }
      } else {
        const result = await registerUser({username, password, email});
        if (result.success) {
          const res = result.user || {} as UserDb
          setUser(res);
          if (userTree) await addTreeToUser(username, userTree);
          await sleep(1000);
        } else {
          setError(result.error || 'Error!');
        }
      }
    } catch (err) {
      setError("Errore durante il login/registrazione");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (username.length < 3) {
      setError("Username deve essere di almeno 3 caratteri");
      return false;
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setError("Username può contenere solo lettere, numeri e underscore");
      return false;
    }
    if (password.length < 4) {
      setError("Password deve essere di almeno 4 caratteri");
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      setError("Le password non corrispondono");
      return false;
    }
    return true;
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  if (isValidUser(user)) return null;

  return (
    <div className={styles.container}>
      <BackButton bg={true} />
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.switchContainer}>
            <button
              className={`${styles.switchButton} ${isLogin ? styles.active : ""}`}
              onClick={() => !isLogin && switchMode()}
              type="button"
            >
              Accedi
            </button>
            <button
              className={`${styles.switchButton} ${!isLogin ? styles.active : ""}`}
              onClick={() => isLogin && switchMode()}
              type="button"
            >
              Registrati
            </button>
          </div>
          <h2 className={styles.title}>{isLogin ? "Accedi!" : "Crea Account"}</h2>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

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

          <SubmitButton loading={loading} isLogin={isLogin} />
        </form>

        <SwitchLink isLogin={isLogin} loading={loading} onSwitch={switchMode} />
      </div>
    </div>
  );
}

// --- COMPONENTI DI SUPPORTO ---
interface FormFieldProps {
  label: string;
  type: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  required?: boolean;
  minLength?: number;
}

function FormField({
  label,
  type,
  id,
  value,
  onChange,
  placeholder,
  disabled,
  required = false,
  minLength,
}: FormFieldProps) {
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

interface SubmitButtonProps {
  loading: boolean;
  isLogin: boolean;
}

function SubmitButton({ loading, isLogin }: SubmitButtonProps) {
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
          {isLogin ? "Accesso in corso..." : "Registrazione in corso..."}
        </div>
      ) : isLogin ? (
        "ACCEDI"
      ) : (
        "REGISTRATI"
      )}
    </Button>
  );
}

interface SwitchLinkProps {
  isLogin: boolean;
  loading: boolean;
  onSwitch: () => void;
}

function SwitchLink({ isLogin, loading, onSwitch }: SwitchLinkProps) {
  return (
    <div className={styles.switchLink}>
      <span>{isLogin ? "Non hai un account?" : "Hai già un account?"}</span>
      <button
        className={styles.linkButton}
        onClick={onSwitch}
        disabled={loading}
        type="button"
      >
        {isLogin ? "Registrati" : "Accedi"}
      </button>
    </div>
  );
}
