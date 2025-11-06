"use client";

import { useEffect, useState, useContext } from "react";
import Tree from "@component/tree/Tree";
import NoTree from "@component/tree/NoTree";
import { UserContext } from "@app/layout";
import { buildTreeContext } from "@service/TreeContextBuilder"; // Importa la funzione
import LoginButton from "@component/ui/LoginButton";

export default function Page() {
  const { 
    userTree, 
    setUserTree, 
    setUserSpecies, 
    setChatbotInitialized,
    setUserCoords 
  } = useContext(UserContext);

  const [treesDataset, setTreesDataset] = useState([]);
  const [speciesDataset, setSpeciesDataset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRandomTree, setIsRandomTree] = useState(true);
  const [error, setError] = useState(null);
  const [chatbotLoading, setChatbotLoading] = useState(false);

  // Carico i dataset dall'API
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        console.log("📡 Iniziando caricamento dataset...");
        const response = await fetch('/api/loadDataset');
        if (!response.ok) {
          throw new Error('Failed to load tree data');
        }
        
        const data = await response.json();
        console.log("📊 Dataset ricevuto:", data);
        
        setTreesDataset(data.trees || []);
        setSpeciesDataset(data.species || []);
        setError(null);
        
      } catch (err) {
        console.error('Error loading datasets:', err);
        setError(err.message);
      }
    };

    loadDatasets();
  }, []);

  // Funzione per inizializzare il chatbot
  const initializeChatbotWithTree = async (tree, species) => {
    if (!tree) return;
    
    setChatbotLoading(true);
    try {
      console.log("🤖 Inizializzazione chatbot RAG...");
      
      // Costruisci il contesto usando la funzione importata
      const context = await buildTreeContext(tree, species);
      console.log("📝 Contesto generato per RAG:", context);
      
      // Inizializza il chatbot con il contesto
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          tree: tree,
          species: species,
          context: context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chatbot');
      }

      const data = await response.json();
      
      if (data.success) {
        console.log("✅ Chatbot RAG inizializzato con successo");
        setChatbotInitialized(true);
      } else {
        throw new Error(data.error || 'Chatbot initialization failed');
      }
      
    } catch (err) {
      console.error('❌ Errore inizializzazione chatbot:', err);
      // Non blocchiamo l'app se il chatbot fallisce
    } finally {
      setChatbotLoading(false);
    }
  };

  // Funzione per cercare albero in base alle coordinate
  const findTreeByCoordinates = (lat, lng) => {
    console.log("🔍 INIZIO RICERCA ALBERO");
    console.log("Coordinate utente:", { lat, lng });
    console.log("Numero totale di alberi nel dataset:", treesDataset.length);

    if (!treesDataset.length) {
      console.log("❌ Dataset alberi vuoto!");
      return null;
    }

    // cerca albero entro 200 metri
    const foundTree = treesDataset.find((t, index) => {
      const treeLat = parseFloat(t.lat);
      const treeLng = parseFloat(t.lon);
  
      if (isNaN(treeLat) || isNaN(treeLng)) {
        console.log(`❌ Coordinate non valide per albero ${index}`);
        return false;
      }

      const dx = (treeLat - lat) * 111000;
      const dy = (treeLng - lng) * 85000;
      const dist = Math.sqrt(dx * dx + dy * dy);

      return dist < 200;
    });

    return foundTree || null;
  };

  // Funzione per processare la ricerca dell'albero
  const processTreeSearch = async (lat, lng) => {
    const foundTree = findTreeByCoordinates(lat, lng);

    if (foundTree) {
      console.log("🌳 ALBERO TROVATO!", foundTree);
      setUserTree(foundTree);

      let foundSpecies = null;
      if (foundTree.index_specie) {
        const idx = parseInt(foundTree.index_specie);
        foundSpecies = speciesDataset[idx] || null;
        console.log("🌿 Specie trovata:", foundSpecies);
        setUserSpecies(foundSpecies);
      } else {
        console.log("ℹ️  Nessuna specie associata all'albero");
        setUserSpecies(null);
      }

      // Inizializza il chatbot in parallelo
      initializeChatbotWithTree(foundTree, foundSpecies);
    } else {
      console.log("❌ NESSUN ALBERO TROVATO nelle vicinanze");
      setUserTree(null);
      setUserSpecies(null);
    }

    setLoading(false);
  };

  // Effetto principale per gestire la logica di caricamento
  useEffect(() => {
    // SE userTree ESISTE GIÀ, mostra direttamente la pagina
    if (userTree) {
      console.log("✅ userTree già presente, mostro direttamente Tree");
      setLoading(false);
      return;
    }

    // ALTRIMENTI procedi con la ricerca
    console.log("🔄 userTree non trovato, avvio ricerca...");

    // Avvia la geolocalizzazione
    if (navigator.geolocation) {
      console.log("📍 Browser supporta geolocalizzazione");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          console.log("📍 Posizione ottenuta:", pos.coords);
          
          // PER TEST - coordinate temporanee
          const lat = 43.99872834108618;
          const lng = 12.433481099993726;
          
          setUserCoords({ lat, lng }); 
          
          // Se i dataset sono già caricati, cerca immediatamente l'albero
          if (treesDataset.length > 0 && speciesDataset.length > 0) {
            await processTreeSearch(lat, lng);
          }
        },
        (err) => {
          console.error("❌ Errore geolocalizzazione:", err);
          setError("Geolocalizzazione fallita: " + err.message);
          setLoading(false);
        }
      );
    } else {
      console.error("❌ Geolocalizzazione non supportata");
      setError("Geolocalizzazione non supportata dal browser");
      setLoading(false);
    }
  }, []); // Eseguito solo al mount

  // Effetto per gestire la ricerca quando i dataset sono pronti
  useEffect(() => {
    const handleDatasetReadySearch = async () => {
      // Solo se userTree non esiste e abbiamo coordinate (simulate per il test)
      if (!userTree && treesDataset.length > 0 && speciesDataset.length > 0) {
        const lat = 43.99872834108618;
        const lng = 12.433481099993726;
        await processTreeSearch(lat, lng);
      }
    };

    handleDatasetReadySearch();
  }, [treesDataset, speciesDataset]); // Eseguito quando i dataset sono caricati

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <p className="fw-bold">⏳ Caricamento alberi in corso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <p className="text-danger fw-bold">❌ Errore: {error}</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => window.location.reload()}
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <main>
        <LoginButton />
        {userTree ? <Tree /> : <NoTree />}
        
        {/* Indicatore del caricamento del chatbot che non blocca la pagina */}
        {chatbotLoading && (
          <div className="position-fixed bottom-0 end-0 m-3">
            <div className="alert alert-info d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Caricamento chatbot...</span>
              </div>
              <span>Inizializzazione chatbot in corso...</span>
            </div>
          </div>
        )}
      </main>
    </>
  );
}