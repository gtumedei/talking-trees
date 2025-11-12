"use client";

import { useContext } from "react";
import Link from "next/link";
import { UserContext } from "@/app/layout";
import { FaSignInAlt, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { logoutUser } from "@service/userService";
import { useRouter } from 'next/navigation';
import styles from './LoginButton.module.css';

export default function LoginButton({ logout = false }) {
  const { user, setUser } = useContext(UserContext);
  const router = useRouter();

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    router.push('/');
  };

  return (
    <div className={styles.loginButtonContainer}>
      {user ? (
        logout ? (
          <LogoutButton onLogout={handleLogout} />
        ) : (
          <UserProfileButton username={user.username} />
        )
      ) : (
        <LoginLinkButton />
      )}
    </div>
  );
}

// Componente per il bottone profilo utente (loggato)
function UserProfileButton({ username }) {
  return (
    <Link href="pages/user" className={styles.profileButton}>
      <div className={styles.iconWrapper}>
        <FaUserCircle className={styles.userIcon} />
      </div>
      <span className={styles.userName}>{username}</span>
    </Link>
  );
}

// Componente per il bottone logout (variante compatta)
function LogoutButton({ onLogout }) {
  return (
    <button 
      onClick={onLogout}
      className={styles.logoutButton}
      title="Esci dall'account"
    >
      <div className={styles.iconWrapper}>
        <FaSignOutAlt className={styles.logoutIcon} />
      </div>
      <span className={styles.logoutText}>Logout</span>
    </button>
  );
}

// Componente per il bottone login (non loggato)
function LoginLinkButton() {
  return (
    <Link href="pages/login" className={styles.loginButton}>
      <div className={styles.iconWrapper}>
        <FaSignInAlt className={styles.loginIcon} />
      </div>
      <span className={styles.loginText}>Login</span>
    </Link>
  );
}