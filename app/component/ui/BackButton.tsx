"use client";

import { IoClose } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { UserContext } from "@/app/layout"; // Importa il contesto
import { Button, Modal } from "react-bootstrap"; // Importa i componenti di Bootstrap
import styles from "./BackButton.module.css"; // Assicurati di avere il CSS appropriato

interface BackButtonProps {
  bg?: boolean;
  message?: string;
}

export default function BackButton({ bg = false, message = '' }: BackButtonProps) {
  const router = useRouter();
  const userContext = useContext(UserContext);
  const [show, setShow] = useState(true)

  const [showModal, setShowModal] = useState(false); // Stato per mostrare/nascondere il messaggio

  if (!userContext) {
    return null; // Se il contesto non è disponibile, non mostrare il bottone
  }

  const { mainroute } = userContext; // Prendi la mainroute dal contesto

  const handleBackButtonClick = () => {
    if (message) {
      setShow(false)
      setShowModal(true); // Mostra il modal se c'è un messaggio
    } else {
      handleConfirm(); // Se non c'è messaggio, vai alla mainroute
    }
  };

  const handleConfirm = () => {
    router.push(mainroute);
  };

  const handleCancel = () => {
    // Chiudi il modal se l'utente preme il cross
    setShowModal(false);
    setShow(true)
  };

  return (
    <>
      {show ?
      <button
        className={bg ? styles.backButtonBg : styles.backButton}
        onClick={handleBackButtonClick} // Usa il nuovo handler
      >
        <IoClose size={20} />
      </button> : <></>
      }

      {/* Modal che si apre quando viene passato un messaggio */}
      <Modal 
        show={showModal} 
        onHide={handleCancel} 
        centered // Centra il modal
        size="sm" // Modal più piccolo (small)
        className="custom-modal w-75 text-center" // Classe personalizzata per il modal
        style={{marginLeft:"12.5%"}}
      >
        <Modal.Header closeButton>
          <Modal.Title className={styles.backButtonTitle}>Conferma Azione</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message} {/* Mostra il messaggio passato come prop */}
        </Modal.Body>
        <Modal.Footer>
          {/* Flex container per i bottoni */}
          <div className="d-flex justify-content-around w-100">
            <Button 
              variant="success" 
              onClick={handleConfirm} 
              className="rounded-circle p-3 d-flex justify-content-center align-items-center" 
              style={{ width: '40px', height: '40px'}}
            >
              ✓
            </Button>
            <Button 
              variant="danger" 
              onClick={handleCancel} 
              className="rounded-circle p-3 d-flex justify-content-center align-items-center" 
              style={{ width: '40px', height: '40px'}}
            >
              ✗
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}
