"use client";

import { Modal, Button, Row, Col } from "react-bootstrap";
import { FaHeart, FaHeartbeat, FaSkull, FaLeaf, FaTree } from "react-icons/fa";
import styles from "./HealthStatus.module.css";
import { useState, useContext, JSX } from "react";
import { UserContext } from "@/app/layout";
import { saveHealthStatus } from "@/backend/userServices";

// Definisci il tipo per il livello di salute
interface HealthLevel {
  level: number;
  label: string;
  color: string;
  icon: JSX.Element; // Elemento React per l'icona
}

const HealthStatus: React.FC = () => {
  const userContext = useContext(UserContext)
  const {userTree} = userContext || {};
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<number | null>(null); // Livello di salute selezionato
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false); // Se è stato già inviato
  const [isLoading, setIsLoading] = useState<boolean>(false); // Se è in corso il salvataggio
  const [isSubmit, setIsSubmit] = useState<boolean>(false); // Se il salvataggio è stato completato

  const healthLevels: HealthLevel[] = [
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

  const handleStatusClick = (level: number): void => {
    setCurrentStatus(level);
  };

  const handleSubmit = async (): Promise<void> => {
    // Passiamo la logica di salvataggio a userServices
    if (userTree) {
      await saveHealthStatus(
        currentStatus,
        healthLevels,
        userTree,
        setIsLoading,
        setHasSubmitted,
        setShowModal,
        setIsSubmit
      );
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
