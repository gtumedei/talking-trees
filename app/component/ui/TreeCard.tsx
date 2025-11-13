import React from 'react';
import { FaDownload, FaComment, FaMapMarkerAlt } from 'react-icons/fa';
import RegionSVG from "@component/maps/RegionMap";
import styles from './TreeCard.module.css'; // Assumo che i tuoi stili siano definiti qui

// Definiamo un'interfaccia per le props
interface TreeCardProps {
  id: string;
  soprannome: string;
  specie: string;
  luogo: string | null;
  regione: string;
  coordinates?: string; // coordinate sono opzionali
  comments?: string[]; // I commenti sono opzionali
}

const TreeCard: React.FC<TreeCardProps> = ({
  id,
  soprannome,
  specie,
  luogo,
  regione,
  coordinates = '',
  comments = [],
}) => {
    // Dizionario di corrispondenza tra valori "sporchi" e nomi standard delle regioni
    const regioneMap: { [key: string]: string } = {
    'Lombardia': 'Lombardy',
    'Sardegna': 'Sardegna',
    'ValleDAosta': 'Valle d\'Aosta',
    'Basilicata': 'Basilicata',
    'Emilia': 'Emilia-Romagna',
    'Bolzano': 'Alto Adige/Südtirol',
    'Abruzzo': 'Abruzzo',
    'Campania': 'Campania',
    'Veneto': 'Veneto',
    'Lazio': 'Lazio',
    'Toscana': 'Tuscany',
    'Puglia': 'Puglia',
    'Trento': 'Trentino-Alto Adige',
    'Molise': 'Molise',
    'Friuli': 'Friuli Venezia Giulia',
    'Calabria': 'Calabria',
    'Sicilia': 'Sicilia',
    'Marche': 'Marche',
    'Liguria': 'Liguria',
    'Piemonte': 'Piedmont',
    'Umbria': 'Umbria',
    };

    // Funzione per standardizzare il nome della regione
    function standardizzaRegione(valore: string): string {
    // Se il valore è null o undefined, restituiamo subito "Regione non trovata"
    if (!valore) return "Regione non trovata";

    // Rimuoviamo spazi e facciamo una ricerca case-insensitive nel dizionario
    const valoreStandard = Object.keys(regioneMap).find(key => 
        key.trim().replace(/\s+/g, '').toLowerCase() === valore.trim().replace(/\s+/g, '').toLowerCase()
    );

    // Se troviamo una corrispondenza, restituiamo il valore standard
    if (valoreStandard) {
        return regioneMap[valoreStandard];
    }

    // Se non troviamo alcuna corrispondenza, restituiamo "Regione non trovata"
    return "Regione non trovata";
    }
  const [lat, lon] = coordinates?.split(",") || [];
  const latNum = lat ? parseFloat(lat) : NaN; // Converte lat in numero
  const lonNum = lon ? parseFloat(lon) : NaN; // Converte lon in numero

  const mapsUrl = lat && lon
    ? `https://www.google.com/maps?q=${lat},${lon}`
    : `https://www.google.com/maps/search/${encodeURIComponent(luogo || "")}`;

  const [treeImage, setTreeImage] = React.useState({img:"/tree/tree-default.png", style: styles.treeImageDefault});

    React.useEffect(() => {
    const path = `/tree/${id.replace(/[\/\\]/g, "-")}.png`;
    fetch(path, { method: "HEAD" })
        .then(res => {
        if (res.ok) setTreeImage({img:path, style: styles.treeImage});
        })
        .catch(() => setTreeImage({img:"/tree/tree-default.png", style: styles.treeImageDefault}));
    }, [id]);
    

  const downloadTreeInfo = () => {
    const treeData = {
      id,
      soprannome,
      specie,
      luogo,
      regione,
      coordinates,
      comments,
      dataEsportazione: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(treeData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `albero-${id.replace(/[\/\\]/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`card ${styles.treeCard} h-100 border-0 shadow-sm`}>
      <div className={styles.cardImageContainer}>
        <div
          className={treeImage.style}
          style={{ backgroundImage: `url(${treeImage.img})` }}
        ></div>
        <div className={styles.regionOverlay}>
          <RegionSVG regione={standardizzaRegione(regione)} lat={latNum} lon={lonNum} />
        </div>
        <div className={styles.gradientOverlay}></div>
      </div>

      <div className={`card-body position-relative ${styles.cardContent}`}>
        <button
          onClick={downloadTreeInfo}
          className={`btn btn-sm ${styles.downloadButton}`}
          title="Scarica informazioni albero"
        >
          <FaDownload className={styles.downloadIcon} />
        </button>
        <div className="mx-2 lh-sm">
          <h5 className={`card-title ${styles.treeName}`}>{soprannome}</h5>
          <p className={styles.specieText}>
            <span>{specie}</span>
          </p>

          {/* Commenti */}
          {comments.length > 0 && (
            <div>
              <div className={styles.commentsList}>
                {comments.slice(0, 2).map((comment, i) => (
                  <div key={i} className={styles.commentItem}>
                    <FaComment className={`text-myrtle me-2 ${styles.commentIcon}`} />
                    <p className={`${styles.commentText} mb-1`}>"{comment}"</p>
                  </div>
                ))}
                {comments.length > 2 && (
                  <div className={styles.moreComments}>
                    <small className="text-muted">
                      +{comments.length - 2} altri commenti...
                    </small>
                  </div>
                )}
              </div>
            </div>
          )}

          {luogo && (
            <div className="text-center my-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.detail}
              >
                <FaMapMarkerAlt className={`me-1 ${styles.detailIcon}`} />
                <span className={`${styles.detailText} text-myrtle`}>
                  {luogo} ({regione})
                </span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreeCard;
