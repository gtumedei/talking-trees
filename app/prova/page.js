"use client";

import { useEffect, useState, useContext } from "react";
import { useSearchParams } from "next/navigation";
import Tree from "@component/tree/Tree";
import NoTree from "@component/tree/NoTree";
import { UserContext } from "@/app/layout";
import { buildTreeContext } from "@service/TreeContextBuilder";
import LoginButton from "@component/ui/LoginButton";

export default function Page() {
  const searchParams = useSearchParams();
  
  // Prendi i parametri dall'URL
  const variant = searchParams.get('variant') || 'statico';
  const test = searchParams.get('test');
  
  const { 
    userTree, 
    setUserTree, 
    setUserSpecies, 
    setUserCoords,
    setDocument
  } = useContext(UserContext);

  const [treesDataset, setTreesDataset] = useState([]);
  const [speciesDataset, setSpeciesDataset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Coordinate di test
  const getTestCoordinates = () => {
    switch(test) {
      case '1':
        return { lat: 43.99872834108618, lng: 12.433481099993726 };
      case '2':
        return { lat: 44.49197405160085, lng: 11.345286337978994 };
      default:
        return null;
    }
  };

  // Carico i dataset dall'API
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        console.log("📡 Iniziando caricamento dataset...");
        console.log("🎛️  Variant dall'URL:", variant);
        console.log("🧪 Test mode:", test || 'disattivato');
        
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
  }, [variant, test]);

  // Funzione per inizializzare il chatbot
  const initializeChatbotWithTree = async (tree, species) => {
    if (!tree) return;
    try {
      // Costruisci il contesto usando la funzione importata
      const document = await buildTreeContext(tree, species);
      
      // Salva il document nel context
      if (setDocument) {
        setDocument(document);
        console.log("📄 Document salvato nel context:", document);
      }
    } catch (error) {
      console.error("❌ Errore nell'inizializzazione dei documenti:", error);
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

  // Funzione per gestire la geolocalizzazione
  const handleGeolocation = () => {
    if (navigator.geolocation) {
      console.log("📍 Browser supporta geolocalizzazione");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          console.log("📍 Posizione reale ottenuta:", pos.coords);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
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
  };

  // Funzione per gestire le coordinate di test
  const handleTestCoordinates = () => {
    const testCoords = getTestCoordinates();
    if (testCoords) {
      const { lat, lng } = testCoords;
      
      setUserCoords({ lat, lng });
      
      // Se i dataset sono già caricati, cerca immediatamente l'albero
      if (treesDataset.length > 0 && speciesDataset.length > 0) {
        processTreeSearch(lat, lng);
      }
    }
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

    // Se è attiva la modalità test, usa le coordinate di test
    if (test) {
      handleTestCoordinates();
    } else {
      // Altrimenti usa la geolocalizzazione reale
      handleGeolocation();
    }
  }, []); // Eseguito solo al mount

  // Effetto per gestire la ricerca quando i dataset sono pronti
  useEffect(() => {
    const handleDatasetReadySearch = async () => {
      // Solo se userTree non esiste e abbiamo coordinate
      if (!userTree && treesDataset.length > 0 && speciesDataset.length > 0) {
        if (test) {
          // Modalità test - usa le coordinate di test
          const testCoords = getTestCoordinates();
          if (testCoords) {
            await processTreeSearch(testCoords.lat, testCoords.lng);
          }
        } else {
          // Modalità normale - usa le coordinate simulate (per ora)
          // Questo verrà sostituito dalla geolocalizzazione reale
          const lat = 43.99872834108618;
          const lng = 12.433481099993726;
          await processTreeSearch(lat, lng);
        }
      }
    };

    handleDatasetReadySearch();
  }, [treesDataset, speciesDataset, test]); // Eseguito quando i dataset sono caricati

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
        {userTree ? <Tree variant={variant} /> : <NoTree />}
      </main>
    </>
  );
}