"use client";

import { Button } from "react-bootstrap";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "@/app/layout";
import { useRouter } from "next/navigation";
import styles from "./Login.module.css";
import BackButton from "@component/ui/BackButton";
import { checkUserCredentials, registerUser } from "@/app/services/userServices";


export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user, setUser, userTree } = useContext(UserContext); // 🔥 includiamo userTree
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/pages/user");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const result = await checkUserCredentials(username, password);
        if (result.success) {
          setUser(result.user);
          await addTreeToUser(username, userTree);
        } else {
          setError(result.error);
        }
      } else {
        const result = await registerUser(username, password, email);
        if (result.success) {
          setUser(result.user);
          await addTreeToUser(username, userTree);
        } else {
          setError(result.error);
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

  // 🔥 funzione per creare la struttura user-tree in Firebase
  const ensureUserTreeInFirebase = async (username, userTree) => {
    try {
      if (!userTree) return;

      const safeTreeId = userTree["id scheda"].replace(/\//g, ".");
      const userDocRef = doc(db, "user-tree", username);

      // verifica se esiste il documento utente
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {}); // crea documento utente
        console.log("🆕 Creato documento utente:", username);
      }

      // documento dell'albero nella subcollection tree
      const treeDocRef = doc(collection(userDocRef, "tree"), safeTreeId);
      const treeSnap = await getDoc(treeDocRef);

      if (!treeSnap.exists()) {
        const lat = userTree.lat || "";
        const lon = userTree.lon || "";
        const coordinates = `${lat},${lon}`;

        await setDoc(treeDocRef, {
          soprannome: userTree.soprannome || "Senza nome",
          specie: userTree["specie nome scientifico"] || "Specie sconosciuta",
          luogo: userTree.comune || "Comune sconosciuto",
          regione: userTree.regione || "Regione sconosciuta",
          coordinates,
          comments: [],
        });
        console.log("🌳 Creato nuovo documento tree per", safeTreeId);
      }
    } catch (error) {
      console.error("❌ Errore nella creazione di user-tree:", error);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  if (user) return null;

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

function SwitchLink({ isLogin, loading, onSwitch }) {
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
