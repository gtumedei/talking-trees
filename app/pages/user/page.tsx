"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserContext } from "@/app/layout";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { FaEnvelope, FaLeaf } from "react-icons/fa";
import ButtonBack from "@component/ui/BackButton";
import TreeCard from "@component/ui/TreeCard";
import styles from "./User.module.css";
import LoginButton from "@component/ui/LoginButton";
import { getUserTrees } from "@/app/services/treeServices";

// Defining the types for user and tree data
interface User {
  username: string;
  email: string;
}

interface Tree {
  id: string;
  [key: string]: any; // Represents other properties of a tree
}

export default function UserPage() {
  const context = useContext(UserContext);
  const user = context?.user;
  const router = useRouter();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      router.push("/pages/login");
      return;
    }

    const load = async () => {
      const data = await getUserTrees(user.username);
      setTrees(data);
      setLoading(false);
    };

    load();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div
        className={`${styles.loadingContainer} d-flex flex-column justify-content-center align-items-center`}
      >
        <div
          className={`spinner-border text-myrtle ${styles.spinner}`}
          role="status"
        >
          <span className="visually-hidden">Caricamento...</span>
        </div>
        <p className="mt-3 fw-bold text-myrtle">Caricamento profilo...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={`${styles.pageHeader} container-fluid`}>
        <div className="row align-items-center">
          <div className="col-auto">
            <ButtonBack bg={true} />
          </div>
          <div className="col-auto">
            <LoginButton logout={true} />
          </div>
        </div>
      </div>

      <div className={`${styles.userCard} container-fluid p-0`}>
        <div className={styles.content}>
          <UserInfoSection username={user.username} email={user.email} />
          <VisitedTreesSection trees={trees} />
        </div>
      </div>
    </div>
  );
}

// 👤 Info utente
interface UserInfoSectionProps {
  username: string;
  email: string;
}

function UserInfoSection({ username, email }: UserInfoSectionProps) {
  return (
    <section className={`${styles.section} mb-4`}>
      <div className="text-center mb-3">
        <h2 className={`${styles.username} mb-1`}>{username}</h2>
        {/* Rende l'email visibile solo se è definita */}
        {email && (
          <p className={`${styles.userEmail} mb-0 text-muted`}>
            <FaEnvelope className={`${styles.emailIcon} me-2`} />
            {email}
          </p>
        )}
      </div>
    </section>
  );
}


// 🌳 Sezione alberi visitati
interface VisitedTreesSectionProps {
  trees: Tree[];
}

function VisitedTreesSection({ trees }: VisitedTreesSectionProps) {
  if (!trees || trees.length === 0) {
    return (
      <section className={styles.section}>
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <FaLeaf className={`${styles.emptyIcon} mb-3`} />
            <h3 className="h5 text-muted mb-3">Nessun albero visitato ancora</h3>
            <Link href="/" className="btn btn-myrtle">
              Esplora gli alberi
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={`${styles.sectionTitle} mb-4`}>
        Alberi Visitati ({trees.length})
      </h2>
      <div className="row g-4">
        {trees.map((tree, index) => (
          <div key={tree.id || index} className="col-12 col-md-6 col-lg-4">
            <TreeCard soprannome={tree?.soprannome} specie={tree?.specie} luogo={tree?.luogo} regione={tree?.regione} {...tree} />
          </div>
        ))}
      </div>
    </section>
  );
}
