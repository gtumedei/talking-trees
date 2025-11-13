"use client";

import { IoClose } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { UserContext } from "@/app/layout"; // Importa il contesto
import styles from "./BackButton.module.css";

export default function BackButton({ bg = false }) {
  const router = useRouter();
  const userContext = useContext(UserContext);

  if (!userContext) {
    return null; // Se il contesto non è disponibile, non mostrare il bottone
  }

  const { mainroute } = userContext; // Prendi la mainroute dal contesto

  const handleBackButtonClick = () => {
    // Reindirizza alla route salvata in mainroute
    router.push(mainroute);
  };

  return (
    <button
      className={bg ? styles.backButtonBg : styles.backButton}
      onClick={handleBackButtonClick} // Usa il nuovo handler
    >
      <IoClose size={20} />
    </button>
  );
}
