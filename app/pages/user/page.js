"use client";

import { useState, useEffect, useContext } from "react";
import { getUserProfile, logoutUser } from "@/app/services/userService";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { UserContext } from "@/app/layout";
import { 
  FaTree, FaComment, FaUser, FaEnvelope, FaMapMarkerAlt, 
  FaSignOutAlt, FaHome, FaLeaf, FaCalendarAlt, FaExternalLinkAlt,
  FaDownload 
} from "react-icons/fa";
import ButtonBack from "@/app/component/ui/BackButton";
import styles from './User.module.css';
import LoginButton from "../../component/ui/LoginButton";

export default function UserPage() {
  const { user, setUser } = useContext(UserContext);
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      router.push('/pages/login');
      return;
    }

    const loadUserData = async () => {
      try {
        const result = await getUserProfile(user.id);
        if (result.success) {
          setUserData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Errore nel caricamento del profilo');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${styles.loadingContainer} d-flex flex-column justify-content-center align-items-center`}>
        <div className={`spinner-border text-myrtle ${styles.spinner}`} role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
        <p className="mt-3 fw-bold text-myrtle">Caricamento profilo...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header con Back Button e Logout */}
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
        {/* Messaggio di errore */}
        {error && (
          <div className="alert alert-danger m-3" role="alert">
            <span className="me-2">⚠️</span>
            {error}
          </div>
        )}

        <div className={styles.content}>
          {/* Informazioni Account */}
          <UserInfoSection 
            username={user.username} 
            email={user.email} 
          />

          {/* Alberi Visitati */}
          <VisitedTreesSection userData={userData} />
        </div>
      </div>
    </div>
  );
}

// Componente per le informazioni account
function UserInfoSection({ username, email }) {
  return (
    <section className={`${styles.section} mb-4`}>
      <div className="text-center mb-3">
        <h2 className={`${styles.username} mb-1`}>{username}</h2>
        <p className={`${styles.userEmail} mb-0 text-muted`}>
          <FaEnvelope className={`${styles.emailIcon} me-2`} />
          {email || 'Email non specificata'}
        </p>
      </div>
    </section>
  );
}

// Componente per gli alberi visitati
function VisitedTreesSection({ userData }) {
  if (!userData?.userTree?.treeId || userData.userTree.treeId.length === 0) {
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
        Alberi Visitati ({userData.userTree.treeId.length})
      </h2>
      <div className="row g-4">
        {userData.userTree.treeId.map((treeId, index) => (
          <div key={index} className="col-12 col-md-6 col-lg-4">
            <TreeCard 
              treeId={treeId}
              soprannome={userData.userTree.soprannome?.[index]}
              specie={userData.userTree.specie?.[index]}
              luogo={userData.userTree.luogo?.[index]}
              regione={userData.userTree.regione?.[index]}
              coordinates={userData.userTree.coordinates?.[index]}
              comments={userData.userTree.commentsDetails || []}
              index={index}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// Componente per la card di un albero
function TreeCard({ treeId, soprannome, specie, luogo, regione, coordinates, comments, index }) {
  // Genera il percorso dell'immagine dell'albero
  const treeImage = `/tree/${treeId.replace(/[\/\\]/g, '-')}.png`;
  const defaultTreeImage = '/tree/tree-default.png';
  
  // Genera il percorso dell'immagine della regione
  const regionImage = `/regions/${regione?.toLowerCase().replace(/\s+/g, '-')}_s.png` || '/regions/default-region.jpg';

  // Crea il link per Google Maps
  const mapsUrl = coordinates ? 
    `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}` : 
    `https://www.google.com/maps/search/${encodeURIComponent(luogo || '')}`;

  // Filtra i commenti per questo albero
  const treeComments = comments.filter(comment => comment.id_tree === treeId);

  // Funzione per scaricare le info dell'albero
  const downloadTreeInfo = () => {
    const treeData = {
      id: treeId,
      soprannome: soprannome,
      specie: specie,
      luogo: luogo,
      regione: regione,
      coordinate: coordinates,
      commenti: treeComments,
      dataEsportazione: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(treeData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `albero-${treeId.replace(/[\/\\]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`card ${styles.treeCard} h-100 border-0 shadow-sm`}>
      {/* Immagine di sfondo con overlay */}
      <div className={styles.cardImageContainer}>
        {/* Immagine albero */}
        <div 
          className={styles.treeImage}
          style={{
            backgroundImage: `url(${treeImage}), url(${defaultTreeImage})`
          }}
        ></div>
        
        {/* Overlay regione */}
        <div 
          className={styles.regionOverlay}
          style={{
            backgroundImage: `url(${regionImage})`
          }}
        ></div>
        
        {/* Gradiente overlay */}
        <div className={styles.gradientOverlay}></div>
      </div>

      {/* Contenuto della card */}
      <div className={`card-body position-relative ${styles.cardContent}`}>
        {/* Header con numero e download */}
        <button onClick={downloadTreeInfo} className={`btn btn-sm ${styles.downloadButton}`} title="Scarica informazioni albero">
          <FaDownload className={styles.downloadIcon} />
        </button>
        <div className="mx-2 lh-sm">
          <p className={styles.specieText}><span>{specie}</span></p>
          <h5 className={`card-title ${styles.treeName}`}>{soprannome}</h5>

            {/* Commenti per questo albero */}
            {treeComments.length > 0 && (
              <div className="mt-3">
                <div className={styles.commentsList}>
                  {treeComments.slice(0, 2).map((comment, commentIndex) => (
                    <>
                      {comment.date && (
                        <p className={`${styles.commentDate} text-muted`}>
                          {comment.date.toDate?.().toLocaleDateString('it-IT') || 'N/A'}
                        </p>
                      )}
                      <div key={commentIndex} className={styles.commentItem}>
                        <FaComment className={`text-myrtle me-2 ${styles.commentIcon}`} />
                        <p className={`${styles.commentText} mb-1`}>
                          "{comment.text}"
                        </p>
                    </div>
                    </>
                  ))}
                  {treeComments.length > 2 && (
                    <div className={styles.moreComments}>
                      <small className="text-muted">
                        +{treeComments.length - 2} altri commenti...
                      </small>
                    </div>
                  )}
                </div>
              </div>
            )}

             {luogo && (
              <div className="text-center">
                <a 
                  href={mapsUrl}  
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.detail}  
                >
                  <FaMapMarkerAlt className={`me-1 ${styles.detailIcon}`} />
                  <span className={`${styles.detailText} text-myrtle`}>{luogo} ({regione})</span>
                </a>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}