"use client";

import { useEffect, useState, useContext } from "react";
import Tree from "../component/tree/Tree";
import NoTree from "../component/tree/NoTree";
import { UserContext } from "../layout";
import { chatbotAPI } from "../services/chatbotAPI";

export default function Page() {
  const { userTree, setUserTree, setUserSpecies, setChatbotInitialized } = useContext(UserContext);

  const [treesDataset, setTreesDataset] = useState([]);
  const [speciesDataset, setSpeciesDataset] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRandomTree, setIsRandomTree] = useState(true);
  const [error, setError] = useState(null);

  // Carico i dataset dall'API
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response = await fetch('/services');
        if (!response.ok) {
          throw new Error('Failed to load tree data');
        }
        
        const data = await response.json();
        setTreesDataset(data.trees || []);
        setSpeciesDataset(data.species || []);
        setError(null);
      } catch (err) {
        console.error('Error loading datasets:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadDatasets();
  }, []);

  
  // Inizializza il chatbot quando viene trovato un albero
  const initializeChatbotWithTree = async (tree, species) => {
    try {
      console.log("🤖 Inizializzazione chatbot con albero...");
      
      // Estrai solo i dati essenziali per il debug
      const essentialTreeData = {
        soprannome: tree.soprannome,
        'specie nome volgare': tree['specie nome volgare'],
        'specie nome scientifico': tree['specie nome scientifico'],
        eta: tree.eta,
        'altezza (m)': tree['altezza (m)'],
        'circonferenza fusto (cm)': tree['circonferenza fusto (cm)'],
        comune: tree.comune,
        provincia: tree.provincia,
        regione: tree.regione,
        lat: tree.lat,
        lng: tree.lng
      };
      
      const essentialSpeciesData = species ? {
        nome_famiglia: species.nome_famiglia,
        nome_genere: species.nome_genere
      } : null;
      
      console.log("🌳 Dati essenziali albero:", essentialTreeData);
      console.log("🌿 Dati essenziali specie:", essentialSpeciesData);
      
      const result = await chatbotAPI.initializeChatbot(essentialTreeData, essentialSpeciesData);
      
      if (result.success) {
        setChatbotInitialized(true);
        console.log("✅ Chatbot inizializzato:", result.tree_name);
      } else {
        console.warn("⚠ Chatbot non inizializzato:", result.error);
      }
    } catch (error) {
      console.error("❌ Errore inizializzazione chatbot:", error);
    }
  };

  // Geolocalizzazione e ricerca albero
  useEffect(() => {
    if (!treesDataset.length || !speciesDataset.length) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = parseFloat(pos.coords.latitude);
          const lng = parseFloat(pos.coords.longitude);
          
          if (isRandomTree && userTree === null) {
            const randomTree = treesDataset[Math.floor(Math.random() * treesDataset.length)];
            if (randomTree) {
              const newTree = { ...randomTree, lat, lng };
              setTreesDataset((prev) => [...prev, newTree]);
              setIsRandomTree(false);
              console.log("🌳 Albero random aggiunto:", newTree);
            }
          }

          // cerca albero entro 200 metri
          const foundTree = treesDataset.find((t) => {
            const treeLat = parseFloat(t.lat);
            const treeLng = parseFloat(t.lng);
            if (isNaN(treeLat) || isNaN(treeLng)) return false;

            const dx = (treeLat - lat) * 111000;
            const dy = (treeLng - lng) * 85000;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < 200;
          });

          if (foundTree) {
            setUserTree(foundTree);

            // cerca specie associata
            let foundSpecies = null;
            if (foundTree.index_specie) {
              const idx = parseInt(foundTree.index_specie);
              foundSpecies = speciesDataset[idx] || null;
              setUserSpecies(foundSpecies);
            } else {
              setUserSpecies(null);
            }

            // INIZIALIZZA IL CHATBOT QUI!
            await initializeChatbotWithTree(foundTree, foundSpecies);

          } else {
            setUserTree(null);
            setUserSpecies(null);
          }

          setLoading(false);
        },
        (err) => {
          console.error("Errore geolocalizzazione:", err);
          setError("Geolocalizzazione fallita: " + err.message);
          setLoading(false);
        }
      );
    } else {
      setError("Geolocalizzazione non supportata dal browser");
      setLoading(false);
    }
  }, [treesDataset, speciesDataset, setUserTree, setUserSpecies]);

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

  return <>
    <div>
      {user ? (
        <div className="d-flex align-items-center gap-3">
          <span>Ciao, {user.email}</span>
          <button 
            onClick={handleLogout}
            className="btn btn-outline-secondary btn-sm"
          >
            Logout
          </button>
        </div>
      ) : (
        <Link href="/login" className="btn btn-primary btn-sm">
          Login / Registrati
        </Link>
      )}
    </div>
    {userTree ? <Tree /> : <NoTree />}
  </>;
}