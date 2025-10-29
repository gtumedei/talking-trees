"use client";

import { useState, useEffect, useContext } from "react";
import { getUserProfile } from "../services/userService";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { UserContext } from "../../layout";

export default function UserPage() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      router.push('/login');
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
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <p className="fw-bold">⏳ Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h2 className="h4 mb-0">👤 Il Mio Profilo</h2>
            </div>
            
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="row mb-4">
                <div className="col-md-6">
                  <h5>Informazioni Account</h5>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Email:</strong> {user.email || 'Non specificata'}</p>
                </div>
              </div>

              {userData?.userTree && (
                <div className="mb-4">
                  <h5>🌳 I Miei Alberi Visitati</h5>
                  {userData.userTree.treeId && userData.userTree.treeId.length > 0 ? (
                    <div className="list-group">
                      {userData.userTree.treeId.map((treeId, index) => (
                        <div key={index} className="list-group-item">
                          <strong>{userData.userTree.soprannome?.[index] || treeId}</strong>
                          <br />
                          <small>
                            Specie: {userData.userTree.specie?.[index] || 'N/A'} | 
                            Luogo: {userData.userTree.luogo?.[index] || 'N/A'}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">Nessun albero visitato ancora.</p>
                  )}
                </div>
              )}

              {userData?.userTree?.commentsDetails && userData.userTree.commentsDetails.length > 0 && (
                <div className="mb-4">
                  <h5>💬 I Miei Commenti</h5>
                  <div className="list-group">
                    {userData.userTree.commentsDetails.map((comment) => (
                      <div key={comment.id} className="list-group-item">
                        <p className="mb-1">{comment.text}</p>
                        <small className="text-muted">
                          Albero: {comment.id_tree} | 
                          Data: {comment.date?.toDate?.().toLocaleDateString('it-IT') || 'N/A'}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="d-flex gap-2">
                <Link href="/" className="btn btn-outline-primary">
                  ← Torna alla Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}