"use client";

import { useState } from 'react';
import { 
  initializeFirebaseData, 
  clearFirebaseData, 
  checkDatabaseStatus 
} from '../../services/initFirebaseData';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);

  const handleInitialize = async () => {
    setLoading(true);
    setMessage('');
    
    const result = await initializeFirebaseData();
    setMessage(result.message || result.error);
    setLoading(false);
  };

  const handleClear = async () => {
    if (!window.confirm('Sei sicuro di voler cancellare TUTTI i dati?')) {
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    const result = await clearFirebaseData();
    setMessage(result.message || result.error);
    setLoading(false);
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setMessage('');
    
    const result = await checkDatabaseStatus();
    if (result.success) {
      setStatus(result.data);
      setMessage('Stato database aggiornato');
    } else {
      setMessage(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h2 className="h4 mb-0">🛠️ Pannello Amministrativo Firebase</h2>
            </div>
            
            <div className="card-body">
              {/* Messaggi */}
              {message && (
                <div className={`alert ${message.includes('❌') ? 'alert-danger' : 'alert-success'} mb-4`}>
                  {message}
                </div>
              )}

              {/* Pulsanti Azioni */}
              <div className="d-grid gap-2 d-md-flex justify-content-md-start mb-4">
                <button
                  onClick={handleInitialize}
                  disabled={loading}
                  className="btn btn-success me-md-2"
                >
                  {loading ? '⏳ Inizializzazione...' : '🚀 Inizializza Database'}
                </button>
                
                <button
                  onClick={handleCheckStatus}
                  disabled={loading}
                  className="btn btn-info me-md-2"
                >
                  🔍 Controlla Stato
                </button>
                
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="btn btn-danger"
                >
                  🗑️ Cancella Tutti i Dati
                </button>
              </div>

              {/* Stato Database */}
              {status && (
                <div className="mt-4">
                  <h5 className="mb-3">📊 Stato Attuale del Database:</h5>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">👤 Users</h6>
                          <p className="card-text h4 text-primary">{status.users.count}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">🌳 User Trees</h6>
                          <p className="card-text h4 text-success">{status.user_trees.count}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">💬 Comments</h6>
                          <p className="card-text h4 text-warning">{status.comments.count}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">📸 Photos</h6>
                          <p className="card-text h4 text-info">{status.photos.count}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dettagli Users */}
                  {status.users.documents.length > 0 && (
                    <div className="mt-3">
                      <h6>Utenti:</h6>
                      <ul className="list-group">
                        {status.users.documents.map(user => (
                          <li key={user.id} className="list-group-item">
                            <strong>ID:</strong> {user.id}<br />
                            <strong>Username:</strong> {user.username}<br />
                            <strong>Email:</strong> {user.email}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Informazioni */}
              <div className="mt-4 p-3 bg-light rounded">
                <h6>ℹ️ Informazioni:</h6>
                <p className="mb-1">
                  <strong>Inizializza Database:</strong> Crea dati di esempio per testing
                </p>
                <p className="mb-1">
                  <strong>Controlla Stato:</strong> Mostra quanti documenti ci sono in ogni collezione
                </p>
                <p className="mb-0">
                  <strong>Cancella Dati:</strong> Rimuove TUTTI i dati (usare con cautela)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}