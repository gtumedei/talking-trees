"use client";

import { useEffect, useState } from "react";
import Tree from "./Tree";
import NoTree from "./NoTree";
import { UserContext } from "./context/UserContext";

// mock dataset (provvisorio finché non importi quello vero)
const mockDataset = [
  {
    id: 1,
    name: "Cipresso di San Francesco",
    species: "Cipresso comune (Cupressus sempervirens L.)",
    location: "Emilia Romagna, Rimini, Verucchio",
    lat: 48.8566,
    lng: 2.3522,
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

// funzione per calcolare la distanza in metri tra due coordinate (formula haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // raggio terrestre in metri
  const toRad = (x: number) => (x * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distanza in metri
}

export default function Page() {
  const [tree, setTree] = useState<any | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          console.log("📍 Coordinate dispositivo:", lat, lng);

          // cerca nel dataset un albero entro 200 metri
          const found = mockDataset.find((t) => {
            const dist = getDistance(lat, lng, t.lat, t.lng);
            console.log(`Distanza da ${t.name}: ${dist.toFixed(1)}m`);
            return dist <= 200;
          });

          setTree(found ?? null);
        },
        (err) => {
          console.error("❌ Errore geolocalizzazione:", err);
        }
      );
    } else {
      console.error("Geolocalizzazione non supportata");
    }
  }, []);

  return (
    <UserContext.Provider value={tree}>
      {tree ? <Tree tree={tree} /> : <NoTree />}
    </UserContext.Provider>
  );
}
