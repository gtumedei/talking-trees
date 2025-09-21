"use client";

import { useEffect, useState, useContext } from "react";
import Tree from "../Tree";
import NoTree from "../NoTree";
import { UserContext } from "../layout";

export default function Page() {
  const { userTree, setUserTree, setUserSpecies } = useContext(UserContext);

  const [treesDataset, setTreesDataset] = useState([]);
  const [speciesDataset, setSpeciesDataset] = useState([]);
  const [isRandomTree, setIsRandomTree] = useState(true);
  const [loading, setLoading] = useState(true);

  // Carico i dataset dai CSV
  useEffect(() => {
    Promise.all([
      fetch("/db/df_specie.csv")
        .then((res) => res.text())
        .then((text) => {
          const rows = text.split("\n").map((r) => r.split("$"));
          const headers = rows[0];
          return rows.slice(1).map((row) =>
            Object.fromEntries(row.map((val, i) => [headers[i], val]))
          );
        }),
      fetch("/db/df_abaco_check.csv")
        .then((res) => res.text())
        .then((text) => {
          const rows = text.split("\n").map((r) => r.split("$"));
          const headers = rows[0];
          return rows.slice(1).map((row) =>
            Object.fromEntries(row.map((val, i) => [headers[i], val]))
          );
        }),
    ]).then(([trees, species]) => {
      setTreesDataset(trees);
      setSpeciesDataset(species);
    });
  }, []);

  // Geolocalizzazione e ricerca albero
  useEffect(() => {
    if (!treesDataset.length || !speciesDataset.length) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude);
          const lng = parseFloat(pos.coords.longitude);

          // copio un albero random dal dataset e lo metto alle coordinate correnti
          if (isRandomTree && userTree === null) {
            console.log(isRandomTree, userTree);
            const randomTree =
              treesDataset[Math.floor(Math.random() * treesDataset.length)];
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
            if (foundTree.index_specie) {
              const idx = parseInt(foundTree.index_specie);
              const foundSpecies = speciesDataset[idx];
              setUserSpecies(foundSpecies || null);
            } else {
              setUserSpecies(null);
            }
          } else {
            if (!userTree) {
              setUserTree(null);
              setUserSpecies(null);
            }
          }

          setLoading(false); // ✅ abbiamo finito caricamento
        },
        (err) => {
          console.error("Errore geolocalizzazione:", err);
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, [treesDataset, speciesDataset, userTree, isRandomTree, setUserTree, setUserSpecies]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <p className="fw-bold">⏳ Caricamento in corso...</p>
      </div>
    );
  }

  return <>{userTree ? <Tree /> : <NoTree />}</>;
}
