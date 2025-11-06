"use client";

import { Modal, Button, Row, Col } from "react-bootstrap";
import { FaHeart, FaHeartbeat, FaSkull, FaLeaf, FaTree } from "react-icons/fa";
import styles from "./HealthStatus.module.css";
import { useState, useContext } from "react";
import { UserContext } from "@/app/layout";
import { db } from "@service/firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

const HealthStatus = () => {
  const { userTree } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);

  const healthLevels = [
    { 
      level: 1, 
      label: "Critico", 
      color: "#dc3545", 
      icon: <FaSkull size={20} />
    },
    { 
      level: 2, 
      label: "Scarso", 
      color: "#fd7e14", 
      icon: <FaHeartbeat size={20} />
    },
    { 
      level: 3, 
      label: "Discreto", 
      color: "#ffc107", 
      icon: <FaLeaf size={20} />
    },
    { 
      level: 4, 
      label: "Buono", 
      color: "#20c997", 
      icon: <FaTree size={20} />
    },
    { 
      level: 5, 
      label: "Eccellente", 
      color: "#198754", 
      icon: <FaHeart size={20} />
    },
  ];

  // Funzione per pulire l'ID e renderlo valido per Firestore
  const getCleanTreeId = () => {
    if (!userTree || !userTree["id scheda"]) return null;
    
    const rawId = userTree["id scheda"].toString();
    // Rimuove o sostituisce i caratteri non validi
    return rawId.replace(/\//g, '_').replace(/\./g, '_');
  };

  const handleOpenModal = () => {
    if (hasSubmitted) {
      setCurrentStatus(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (!hasSubmitted) {
      setCurrentStatus(null);
    }
  };

  const handleStatusClick = (level) => {
    setCurrentStatus(level);
  };

  const handleSubmit = async () => {
    if (!currentStatus || !userTree) {
      alert("Seleziona uno stato di salute prima di inviare");
      return;
    }

    setIsLoading(true);

    try {
      const cleanTreeId = getCleanTreeId();
      
      if (!cleanTreeId) {
        throw new Error("ID albero non valido");
      }

      // Crea l'oggetto dati da salvare
      const healthEntry = {
        livello: currentStatus,
        livelloLabel: healthLevels.find(h => h.level === currentStatus)?.label,
        timestamp: new Date().toISOString(), // ISO string
      };

      console.log("Tentativo di salvataggio per albero ID:", cleanTreeId);

      // Usa l'ID pulito dell'albero come nome del documento
      const treeDocRef = doc(db, "Salute", cleanTreeId);
      
      // Verifica se il documento esiste già
      const treeDoc = await getDoc(treeDocRef);
      
      if (treeDoc.exists()) {
        // Se il documento esiste, aggiorna l'array storico
        await updateDoc(treeDocRef, {
          storico: arrayUnion(healthEntry)
        });
        console.log("Documento aggiornato");
      } else {
        // Se il documento non esiste, crealo con i primi dati
        await setDoc(treeDocRef, {
          alberoId: cleanTreeId,
          storico: [healthEntry]
        });
        console.log("Nuovo documento creato");
      }

      setHasSubmitted(true);
      setShowModal(false);
      setIsSubmit(true);
      alert(`Stato di salute salvato: Livello ${currentStatus}`);
      
    } catch (error) {
      console.error("Errore nel salvataggio: ", error);
      alert("Errore nel salvataggio dello stato di salute. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Bottone principale */}
      {!isSubmit &&
      <div className="text-center my-2">
        <Button
          variant={hasSubmitted ? "outline-success" : "success"}
          className={`${styles.healthMainButton} px-4 py-2 fw-bold`}
          onClick={handleOpenModal}
          disabled={isLoading}
        >
          <FaHeart className="me-2" />
          {isLoading ? "Salvataggio..." : 
           hasSubmitted ? "Modifica Stato Salute" : "Segnala Stato di Salute"}
        </Button>
      </div>}

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered className={styles.healthModal}>
        <Modal.Header closeButton className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <Modal.Title className={styles.modalTitle}>
              Segnala lo stato di salute
            </Modal.Title>
            <p className={styles.modalDescription}>
              Seleziona il livello di salute attuale dell'albero
            </p>
          </div>
        </Modal.Header>
        
        <Modal.Body className={styles.modalBody}>
          <Row className={styles.healthButtonsRow}>
            {healthLevels.map((health) => (
              <Col key={health.level} className={styles.healthCol}>
                <Button
                  className={`${styles.healthButton} ${
                    currentStatus === health.level ? styles.selected : ""
                  }`}
                  style={{
                    backgroundColor: health.color,
                    borderColor: health.color,
                    opacity: currentStatus === health.level ? 1 : 0.7
                  }}
                  onClick={() => handleStatusClick(health.level)}
                  disabled={isLoading}
                >
                  <div className={styles.buttonContent}>
                    <div className={styles.healthIcon}>
                      {health.icon}
                    </div>
                    <span className={styles.healthLabel}>
                      {health.label}
                    </span>
                    <div className={styles.healthLevel}>
                      Livello {health.level}
                    </div>
                  </div>
                </Button>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        
        <Modal.Footer className={styles.modalFooter}>
          <Button 
            variant="success" 
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!currentStatus || isLoading}
          >
            {isLoading ? "Salvando..." : "Invia Segnalazione"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default HealthStatus;