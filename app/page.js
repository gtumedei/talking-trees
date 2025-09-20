"use client";

import { useEffect, useState, useContext } from "react";
import Tree from "./Tree";
import NoTree from "./NoTree";
import { UserContext } from "./layout";

// Dataset alberi monumentali (mock provvisorio)
const treesDataset = [
  {
    id: 1,
    name: "Cipresso di San Francesco",
    species: "Cupressus sempervirens L.",
    nome_volgare_x: "Cipresso comune",
    location: "Emilia Romagna, Rimini, Verucchio",
    lat: 44.1417835,
    lng: 12.2443475,
    image: "/01.L797.RN.08.png",
    dimensions: {
      circ: "650 cm",
      height: "25 m",
    },
    criteria: [
      "Architettura vegetale",
      "Età e/o dimensioni",
      "Pregio paesaggistico",
      "Valore storico, culturale, religioso",
    ],
    age: "800 anni",
  },
];

// Dataset specie (mock provvisorio)
const speciesDataset = [
  {
    nome_comune: "Ippocastano rosso",
    nome_specie: "Aesculus x carnea",
    nome_genere: "Aesculus",
    nome_famiglia: "Sapindaceae",
    descrizione: "Specie decidua, naturalizzata in Italia, originata dall'ibridazione di A. pavia e A. hippocastanum",
    size_altezza: "9-18",
    size_classe: "II°",
    info_tipologia: "Decidua",
    habitat_litorale: "No",
    habitat_pianura: "Sì",
    habitat_collina: "Sì",
    habitat_montagna: "No",
    "habitat_alloctona/esotica": "Sì",
    info_forma_chioma: "Arrotondata",
    info_densita_chioma: "Densa",
    info_stagione_fioritura: null,
    info_fioritura: "Vistosa, infiorescenza rossa",
    info_frutti: null,
    info_colori_autunnali: "Giallo",
    info_portamento: "Arboreo",
    size_chioma: "Grande (15-25m)",
    size_altezza_max: "18",
    forma_chioma: "arrotondata",
    epoca_di_fioritura: null,
    portamento: "Arboreo",
    habitat: "litorale, pianura, collina, montagna, alloctona/esotica"
  }
];


export default function Page() {
  const { setUserTree, setUserSpecies } = useContext(UserContext);
  const [tree, setTree] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          console.log("📍 Coordinate dispositivo:", lat, lng);

          // cerca albero entro 200 metri
          const foundTree = treesDataset.find((t) => {
            const dx = (t.lat - lat) * 111000; // m latitudine
            const dy = (t.lng - lng) * 85000; // m longitudine approx
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < 200;
          });

          if (foundTree) {
            setTree(foundTree);
            setUserTree(foundTree);

            // cerca specie associata
            const foundSpecies = speciesDataset.find(
              (s) => s.code === foundTree.speciesCode
            );
            if (foundSpecies) {
              setUserSpecies(foundSpecies);
            }
          }
        },
        (err) => {
          console.error("Errore geolocalizzazione:", err);
        }
      );
    }
  }, [setUserTree, setUserSpecies]);

  return <>{tree ? <Tree /> : <NoTree />}</>;
}
