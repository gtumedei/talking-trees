"use client";

import { useEffect, useState, useContext, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Tree from "@component/tree/Tree";
import NoTree from "@component/tree/NoTree";
import { UserContext } from "@/app/layout";
import { buildTreeContext } from "@service/TreeContextBuilder";
import LoginButton from "@component/ui/LoginButton";
import { UserSpeciesType, UserTreeType, UserContextType } from "@/backend/types/interface_context";
import { isValidTree } from "@/backend/treeServices";

interface Coordinates {
  lat: number;
  lng: number;
}

interface RagResult {
  ragStructure: any;
  id_spacevector: string;
}

function PageContent() {
  const searchParams = useSearchParams();
  //const variant : TreeProps = searchParams.get("variant") || "statico";
  const rawVariant = searchParams.get("variant");
  const variant = rawVariant === "scientifico" || rawVariant === "narrativo"
      ? rawVariant : "statico";

  const test = searchParams.get("test");

  const {userTree, setUserTree, setUserSpecies, setUserCoords, setDocument, setIdSpacevector,} = useContext(UserContext) as UserContextType;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTestCoordinates = (): Coordinates | null => {
    switch (test) {
      case "1":
        return { lat: 43.99872834108618, lng: 12.433481099993726 };
      case "2":
        return { lat: 44.49197405160085, lng: 11.345286337978994 };
      case "3":
        return { lat: 45.69867777777, lng: 9.78363888888889 };
      default:
        return null;
    }
  };

  const initializeChatbotWithTree = async (tree: UserTreeType | null, species: UserSpeciesType | null) => {
    if (!tree) return;
    try {
      const result: RagResult = await buildTreeContext(tree, species, variant);
      setDocument(result.ragStructure);
      setIdSpacevector(result.id_spacevector);
    } catch (error) {
      console.error("❌ Errore nell'inizializzazione della struttura RAG:", error);
    }
  };

  const fetchTreeByCoordinates = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/findTreeByCoordinates?lat=${lat}&lng=${lng}`);
      const data = await res.json();

      if (res.ok && data.tree) {
        setUserTree(data.tree);
        setUserSpecies(data.species || null);
        await initializeChatbotWithTree(data.tree, data.species || null);
      } else {
        setUserTree({} as UserTreeType);
        setUserSpecies({} as UserSpeciesType);
      }
    } catch (err: any) {
      console.error("❌ Errore nella fetch dell'albero:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          fetchTreeByCoordinates(coords.lat, coords.lng);
        },
        (err) => {
          console.error("❌ Errore geolocalizzazione:", err);
          setError("Geolocalizzazione fallita: " + err.message);
          setLoading(false);
        }
      );
    } else {
      setError("Geolocalizzazione non supportata dal browser");
      setLoading(false);
    }
  };

  const handleTestCoordinates = () => {
    const testCoords = getTestCoordinates();
    if (testCoords) {
      setUserCoords(testCoords);
      fetchTreeByCoordinates(testCoords.lat, testCoords.lng);
    }
  };

  useEffect(() => {
    console.log(test);
    if (userTree) {
      setLoading(false);
      return;
    }
    test ? handleTestCoordinates() : handleGeolocation();
  }, []);

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <p className="fw-bold">⏳ Caricamento alberi in corso...</p>
      </div>
    );

  if (error)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <p className="text-danger fw-bold">❌ Errore: {error}</p>
          <button className="btn btn-primary mt-3" onClick={() => window.location.reload()}>
            Riprova
          </button>
        </div>
      </div>
    );

  return (
    <main>
      <LoginButton />
      {isValidTree(userTree) ? <Tree variant={variant} /> : <NoTree />}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="d-flex justify-content-center align-items-center vh-100">
          <p className="fw-bold">⏳ Caricamento...</p>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
