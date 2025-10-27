"use client";
import { IoClose } from "react-icons/io5";
import { useRouter } from "next/navigation";
import styles from "./BackButton.module.css";

export default function BackButton() {
  const router = useRouter();

  return (
    <button className={styles.backButton} onClick={() => router.back()}>
      <IoClose  size={20} />
    </button>
  );
}
