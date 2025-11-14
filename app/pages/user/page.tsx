"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserContext } from "@/app/layout";
import { FaEnvelope, FaLeaf } from "react-icons/fa";
import ButtonBack from "@component/ui/BackButton";
import TreeCard from "@component/ui/TreeCard";
import styles from "./User.module.css";
import LoginButton from "@component/ui/LoginButton";
import { getUserTrees } from "@/backend/treeServices";
import { UserContextType } from "@/backend/types/interface_context";
import { ElemListTree, UserDb } from "@/backend/types/interface_db";

export default function UserPage() {
  const {user} = useContext(UserContext) as UserContextType;
  const router = useRouter();
  const [trees, setTrees] = useState<ElemListTree[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      router.push("/pages/login");
      return;
    }

    const load = async () => {
      const data = await getUserTrees(user.username) as ElemListTree[];
      setTrees(data);
      setLoading(false);
    };

    load();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={`${styles.userCard} text-center p-5`}>
          <p className="my-5"></p>
          <div className={`mt-5 mx-auto spinner-border text-myrtle ${styles.spinner}`} role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="mt-3 mb-5 py-5 fw-bold text-myrtle">Caricamento profilo...</p>
        </div>
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
          <UserInfoSection user={user} />
          <VisitedTreesSection listTrees={trees} />
        </div>
      </div>
    </div>
  );
}

function UserInfoSection({ user }: { user: UserDb }) {
  const {username, email} = user
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


function VisitedTreesSection({ listTrees }: { listTrees: ElemListTree[] })  {
  console.log(listTrees)
  if (!listTrees || listTrees.length === 0) {
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
        Alberi Visitati ({listTrees.length})
      </h2>
      <div className="row g-4">
        {listTrees.map((tree, index) => (
          <div key={tree.id || index} className="col-12 col-md-6 col-lg-4">
            <TreeCard tree={tree} />
          </div>
        ))}
      </div>
    </section>
  );
}
