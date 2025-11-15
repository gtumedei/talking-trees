"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import { UserContext } from "@/app/layout";
import { FaSignInAlt, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { logoutUser } from "@/backend/userServices";
import { useRouter } from "next/navigation";
import Modal from "react-bootstrap/Modal"; // Assicurati di importare Modal
import Button from "react-bootstrap/Button"; // Assicurati di importare Button
import styles from './LoginButton.module.css';
import { UserDb } from "@/backend/types/interface_db";
import { isValidUser } from "@/backend/treeServices";

// Definisci il tipo delle props per il componente LoginButton
interface LoginButtonProps {
  logout?: boolean;
}

const LoginButton: React.FC<LoginButtonProps> = ({ logout = false }) => {
  const context = useContext(UserContext);
  const { user, setUser, mainroute } = context!;
  const router = useRouter();
  const [showModal, setShowModal] = useState<boolean>(false); // Stato per il modal
  const message = 'Sei sicuro di voler eseguire il logout?';

  // Funzione per mostrare il Modal
  const handleLogoutClick = () => {
    setShowModal(true);
  };

  // Funzione per confermare il logout
  const handleConfirmLogout = () => {
    logoutUser();
    setUser({} as UserDb);
    setShowModal(false); // Nascondi il modal
  };

  // Funzione per annullare il logout
  const handleCancel = () => {
    setShowModal(false); // Chiudi il modal senza fare logout
  };

  return (
    <div className={styles.loginButtonContainer}>
      {isValidUser(user) ? (
        logout ? (
          <button 
            onClick={handleLogoutClick}
            className={styles.logoutButton}
            title="Esci dall'account"
          >
            <div className={styles.iconWrapper}>
              <FaSignOutAlt className={styles.logoutIcon} />
            </div>
            <span className={styles.logoutText}>Logout</span>
          </button>
        ) : (
          <UserProfileButton username={user.username} />
        )
      ) : (
        <LoginLinkButton />
      )}

      {/* Modal di conferma per il logout */}
      <Modal
        show={showModal}
        onHide={handleCancel}
        centered
        size="sm"
        className="custom-modal w-75 text-center"
        style={{ marginLeft: "12.5%" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Conferma Azione</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-around w-100">
            <Button
              variant="success"
              onClick={handleConfirmLogout}
              className="rounded-circle p-3 d-flex justify-content-center align-items-center"
              style={{ width: "40px", height: "40px" }}
            >
              ✓
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              className="rounded-circle p-3 d-flex justify-content-center align-items-center"
              style={{ width: "40px", height: "40px" }}
            >
              ✗
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Componente per il bottone profilo utente (loggato)
interface UserProfileButtonProps {
  username: string;
}

const UserProfileButton: React.FC<UserProfileButtonProps> = ({ username }) => {
  return (
    <Link href="pages/user" className={styles.profileButton}>
      <div className={styles.iconWrapper}>
        <FaUserCircle className={styles.userIcon} />
      </div>
      <span className={styles.userName}>{username}</span>
    </Link>
  );
};

// Componente per il bottone login (non loggato)
const LoginLinkButton: React.FC = () => {
  return (
    <Link href="pages/login" className={styles.loginButton}>
      <div className={styles.iconWrapper}>
        <FaSignInAlt className={styles.loginIcon} />
      </div>
      <span className={styles.loginText}>Login</span>
    </Link>
  );
};

export default LoginButton;
