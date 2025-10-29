"use client";

import { useContext } from "react";
import Link from "next/link";
import { UserContext } from "../../layout";
import { FaUser, FaSignInAlt, FaUserCircle } from "react-icons/fa";
import styles from './LoginButton.module.css';

export default function LoginButton() {
  const { user } = useContext(UserContext);

  return (
    <div className={styles.loginButtonContainer}>
      {user ? (
        <UserProfileButton username={user.username} />
      ) : (
        <LoginLinkButton />
      )}
    </div>
  );
}

// Componente per il bottone profilo utente (loggato)
function UserProfileButton({ username }) {
  return (
    <Link href="/pages/user" className={styles.profileButton}>
      <div className={styles.iconWrapper}>
        <FaUserCircle className={styles.userIcon} />
      </div>
      <span className={styles.userName}>{username}</span>
    </Link>
  );
}

// Componente per il bottone login (non loggato)
function LoginLinkButton() {
  return (
    <Link href="/pages/login" className={styles.loginButton}>
      <div className={styles.iconWrapper}>
        <FaSignInAlt className={styles.loginIcon} />
      </div>
      <span className={styles.loginText}>Login</span>
    </Link>
  );
}