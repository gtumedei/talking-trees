// ./services/TreeContextBuilder.jsx
import { weatherReflection } from './WeatherContextBuilder';

/**
 * Crea una struttura dati direttamente per l'albero
 */
async function buildTreeStructure(tree, species, luogoData, pollutionData, historicalData, weatherData) {
  const sections = [];

  // Funzioni sincrone
  const albero = buildDatiAlbero(tree);
  const descrizione = buildDatiDescrizione(tree);
  const botanica = buildDatiSpecie(species);
  const ecologia = buildEcologicalSection(species, pollutionData);
  const luogo = buildDatiLuogo(tree, luogoData);
  const storia = buildHistoricalSection(tree, historicalData);
  const salute = buildHealthSection(tree, weatherData);

  [albero, descrizione, botanica, ecologia, luogo, salute, storia].forEach(s => {
    if (s) sections.push(s);
  });

  return {
    treeId: tree["id scheda"] || tree.id || null,
    name: tree.soprannome || tree["specie nome volgare"],
    sections
  };
}


/**
 * Trasforma la struttura in una stringa di contesto completa,
 * includendo solo i dati effettivamente presenti.
 */
function buildContextString(treeStructure) {
  if (!treeStructure?.sections?.length) return "";

  const s = Object.fromEntries(
    treeStructure.sections.map(sec => [sec.type, sec.content])
  );

  const parts = [];

  // 🌳 DATI ALBERO
  if (s["DATI_ALBERO"]) {
    const d = s["DATI_ALBERO"];
    const datiAlbero = [];

    if (d.nome) datiAlbero.push(`- Nome: ${d.nome}`);
    if (d.altezza || d.circonferenza)
      datiAlbero.push(
        `- Dimensioni: ${d.altezza ? `altezza ${d.altezza}` : ""}${
          d.altezza && d.circonferenza ? ", " : ""
        }${d.circonferenza ? `circonferenza fusto ${d.circonferenza}` : ""}`
      );
    if (d.criteri) datiAlbero.push(`- Criteri monumentalità: "${d.criteri.trim()}"`);

    if (datiAlbero.length) {
      parts.push("DATI ALBERO:");
      parts.push(...datiAlbero);
    }
  }

  // 📝 DESCRIZIONE
  if (s["DATI_DESCRIZIONE"]?.trim()) {
    parts.push("\nDATI DESCRIZIONE:");
    parts.push(s["DATI_DESCRIZIONE"].trim());
  }

  // 🌱 SPECIE
  if (s["DATI_SPECIE_BOTANICHE"]) {
    const sp = s["DATI_SPECIE_BOTANICHE"];
    const specie = [];

    if (sp.nome_comune || sp.nome_scientifico)
      specie.push(`- Specie: ${sp.nome_comune || ""}${sp.nome_comune && sp.nome_scientifico ? " - " : ""}${sp.nome_scientifico ? `(nome scientifico: ${sp.nome_scientifico})` : ""}`);

    const caratteristiche = [];
    if (sp.portamento) caratteristiche.push(`portamento ${sp.portamento}`);
    if (sp.tipologia) caratteristiche.push(sp.tipologia);
    if (sp.info_densita_chioma)
      caratteristiche.push(
        `chioma ${sp.info_densita_chioma.toLowerCase() === "densa" ? "densa" : sp.info_densita_chioma.toLowerCase()}`
      );
    if (sp.info_forma_chioma) caratteristiche.push(sp.info_forma_chioma.toLowerCase());
    if (sp.info_colori_autunnali) caratteristiche.push(`colori autunnali: ${sp.info_colori_autunnali}`);
    if (sp.info_frutti) caratteristiche.push(`frutti: ${sp.info_frutti}`);
    if (sp.info_fioritura) caratteristiche.push(`fioritura: ${sp.info_fioritura}`);

    if (caratteristiche.length)
      specie.push(`- Caratteristiche specie: ${caratteristiche.join(", ")}`);
    if (sp.habitat) specie.push(`- Habitat specie: ${sp.habitat}`);
    if (sp.size_altezza || sp.size_chioma)
      specie.push(
        `- Dimensioni (specie):${
          sp.size_altezza ? ` Altezza: ${sp.size_altezza}` : ""
        }${sp.size_chioma ? `, Chioma: ${sp.size_chioma}` : ""}`
      );

    if (specie.length) {
      parts.push("\nDATI SPECIE BOTANICHE:");
      parts.push(...specie);
    }
  }

  // 🌿 ECOLOGIA
  if (s["DATI_ECOLOGICI/AMBIENTALI"]) {
    const ecoData = s["DATI_ECOLOGICI/AMBIENTALI"];
    const eco = Object.entries(ecoData).filter(([nome, obj]) => obj?.valore?.trim());

    if (eco.length) {
      parts.push("\nDATI ECOLOGICI/AMBIENTALI:");
      eco.forEach(([nome, obj]) => {
        const valore = obj.valore;
        const descrizione = obj.descrizione?.descrizione || "";
        parts.push(`- ${valore}`);
        if (descrizione) parts.push(`  Descrizione: ${descrizione}`);
      });
    }
  }


  // 🩺 SALUTE
  if (s["DATI_SALUTE"]) {
    const h = s["DATI_SALUTE"];
    const salute = [];
    if (h.stato_salute && h.stato_salute != 'Non specificato') salute.push(`- Stato di salute: ${h.stato_salute}`);
    if (h.condizioni_meteo) salute.push(`${h.condizioni_meteo}`);

    if (salute.length) {
      parts.push("\nDATI SALUTE:");
      parts.push(...salute);
    }
  }

  // 🕰️ STORIA
  if (s["DATI_STORICI"]) {
    const hs = s["DATI_STORICI"];
    const storia = [];
    if (hs.eta) storia.push(`- Età: ${hs.eta}`);
    if (hs.eventi) storia.push(`- Eventi avvenuti durante la vita: ${hs.eventi}`);

    if (storia.length) {
      parts.push("\nDATI STORICI:");
      parts.push(...storia);
    }
  }

  // 📍 LUOGO
  if (s["DATI_LUOGO"]) {
    const l = s["DATI_LUOGO"];
    const luogo = [];
    if (l.comune || l.provincia || l.regione || l.popolazione || l.superficie) {
      luogo.push(
        `- Luogo: ${
          l.comune ? `(comune: ${l.comune})` : ""
        }${l.provincia ? `, (provincia: ${l.provincia})` : ""}${
          l.regione ? `, (regione: ${l.regione})` : ""
        }${l.popolazione ? `, (popolazione: ${l.popolazione})` : ""}${
          l.superficie ? `, (superficie: ${l.superficie})` : ""
        }`
      );
    }
    if (l.desc) luogo.push(`- Descrizione territorio: ${l.desc}`);
    if (l.contesto_storico) luogo.push(`- Contesto storico: ${l.contesto_storico}`);
    if (l.contesto_culturale) luogo.push(`- Contesto culturale: ${l.contesto_culturale}`);

    if (luogo.length) {
      parts.push("\nDATI LUOGO:");
      parts.push(...luogo);
    }
  }

  return parts.join("\n").trim();
}


// =============================================
// FUNZIONI DI SUPPORTO
// =============================================

/**DATI ALBERO */
function buildDatiAlbero(tree) {
  if (!tree) return null;

  return {
    id: 'tree_data',
    type: 'DATI_ALBERO',
    content: {
      nome: tree.soprannome || tree["specie nome volgare"] || "Albero monumentale",
      altezza: tree["altezza_clear"] ? `${tree["altezza_clear"]}m` : null,
      circonferenza: tree["circonferenza_clear"] ? `${tree["circonferenza_clear"]}cm` : null,
      criteri: tree["criteri di monumentalità"] || null
    },
    metadata: { source: 'tree_dataset' }
  };
}

/**DATI DESCRIZIONE */
function buildDatiDescrizione(tree) {
  if (!tree?.desc) return null;

  return {
    id: 'tree_description',
    type: 'DATI_DESCRIZIONE',
    content: tree.desc.trim(),
    metadata: { source: 'tree_dataset' }
  };
}


/**DATI SPECIE*/
function buildDatiSpecie(species) {
  if (!species) return null;

  return {
    id: 'species_data',
    type: 'DATI_SPECIE_BOTANICHE',
    content: {
      nome_comune: species.nome_comune,
      nome_scientifico: species.nome_specie,
      portamento: species.info_portamento || species.portamento,
      tipologia: species.info_tipologia,
      chioma_forma: species.info_forma_chioma || species.forma_chioma,
      chioma_densita: species.info_densita_chioma,
      colori_autunnali: species.info_colori_autunnali,
      frutti: species.info_frutti,
      fioritura: species.info_fioritura,
      habitat: species.habitat,
      size_altezza: species.size_altezza,
      size_chioma: species.size_chioma
    },
    metadata: { source: 'species_dataset' }
  };
}

/**DATI_ECOLOGICI/AMBIENTALI */
function buildEcologicalSection(species, pollutionData) {
  const inquinanti = {
    "CO₂": species.info_abbattimento_co2,
    "NO₂": species.info_abbattimento_no2,
    "O₃": species.info_abbattimento_o3,
    "PM10": species.info_abbattimento_pm10,
    "SO₂": species.info_abbattimento_so2,
  };

  const pollutantInfo = {
    "CO₂": {descrizione: "La CO₂ è l'anidride carbonica, un gas serra che contribuisce al riscaldamento globale."}, //🌱
    "PM10": {descrizione: "Il PM10 è un insieme di particelle sottili sospese nell'aria, dannose per l'apparato respiratorio."},//💨
    "O₃": {descrizione: "L'O₃ (ozono troposferico) è un inquinante secondario che si forma in presenza di sole e smog."},//☀️
    "NO₂": {descrizione: "Il NO₂ (biossido di azoto) deriva dai gas di scarico e influisce sulla salute dei polmoni."}, //🌫️
    "SO₂": {descrizione: "Il SO₂ (biossido di zolfo) è prodotto da combustioni industriali e può causare piogge acide."} //🏭
  };

  const ecologicalParts = {};

  for (const [nome, valore] of Object.entries(inquinanti)) {
    if (!valore) continue; // salta inquinanti senza dati

    // costruisce la stringa base di abbattimento
    let info = `Abbattimento ${nome}: ${valore}`;

    // aggiunge eventuali dettagli numerici se presenti
    if (nome === "CO₂" && species.abbattimento_co2) {
      info += ` (${species.abbattimento_co2})`;
    } else if (nome === "PM10" && species.abbattimento_pm10) {
      info += ` (${species.abbattimento_pm10})`;
    }

    // aggiunge eventuali frasi extra generate dai dati esterni
    if (pollutionData) {
      const frasiExtra = generatePollutionSentences(pollutionData, nome, valore);
      if (frasiExtra?.length) {
        info += ` → ${frasiExtra.join(', ')}`;
      }
    }

    ecologicalParts[nome] = {
      valore: info,
      descrizione: pollutantInfo[nome] || ""
    };
  }

  if (Object.keys(ecologicalParts).length === 0) return null;

  return {
    id: "ecological_data",
    type: "DATI_ECOLOGICI/AMBIENTALI",
    content: ecologicalParts,
    metadata: { source: "pollution_data" },
  };
}


/**DATI LUOGO*/
function buildDatiLuogo(tree, placeData = {}) {
  const luogo = Array.isArray(placeData)
    ? placeData.find(p => p.comune === tree.comune)
    : placeData.comune === tree.comune
      ? placeData
      : null;
  return {
    id: 'place_data',
    type: 'DATI_LUOGO',
    content: {
      comune: tree.comune,
      provincia: tree.provincia,
      regione: tree.regione,
      popolazione: luogo.num_residenti,
      superficie: luogo.superficie,
      descrizione: luogo.desc,
      contesto_storico: luogo.storia,
      contesto_culturale: luogo.culturale
    },
    metadata: { source: 'geo_dataset' }
  };
}


/**DATI SALUTE */
function buildHealthSection(tree, weatherString) {
  const statoSalute = tree.stato_salute || 'Non specificato';
  const descrizioneMeteo = weatherString || 'Nessuna informazione meteorologica disponibile.';

  return {
    id: 'health_data',
    type: 'DATI_SALUTE',
    content: {
      stato_salute: statoSalute,
      condizioni_meteo: descrizioneMeteo
    },
    tags: ['#SALUTE', '#AMBIENTE', '#CONDIZIONI_METEO'],
    metadata: {
      source: 'tree_health',
      confidence: 0.7,
      temporalContext: 'presente'
    }
  };
}

/**DATI STORICI */
function buildHistoricalSection(tree, historicalData) { 
  if (!tree.eta) return null;

  const currentYear = new Date().getFullYear();
  const age = parseInt(tree.eta.match(/\d+/));
  if (isNaN(age)) return null;

  const yearMin = currentYear - age;
  const filteredEvents = historicalData.filter(
    e => e.year >= yearMin && e.year <= currentYear
  );

  // Prendi fino a 3 eventi casuali
  const sampled = filteredEvents
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(e => `(${e.year} ${e.text})`);

  const eventiString = sampled.join(', ');

  return {
    id: 'historical_data',
    type: 'DATI_STORICI',
    content: {eta: tree.eta,
              eventi: eventiString},
    tags: ['#STORIA', '#TEMPO', '#LONGEVITA', '#CRONOLOGIA'],
    metadata: {
      source: 'tree_age',
      wordCount: (tree.eta + ' ' + eventiString).split(/\s+/).length,
      confidence: 0.8,
      temporalContext: 'storico'
    }
  };
}


// =============================================
// FUNZIONI DI SUPPORTO GENERALI
// =============================================

/** Carica tutti i dataset asincroni in parallelo */
async function loadAsyncData(tree, species) {
  const promises = [];

  // Dati inquinanti
  const pollutionPromise = (species && hasPollutionData(species))
    ? loadPollutionData()
    : Promise.resolve(null);
  promises.push(pollutionPromise);

  // Dati luogo
  promises.push(loadPlaceData());

  // Dati storici
  promises.push(loadHistoricalData());

  // Condizioni meteo
  const weatherPromise = (tree.lat && tree.lon)
    ? weatherReflection(tree.lat, tree.lon)
    : Promise.resolve(null);
  promises.push(weatherPromise);

  // Ritorna i risultati come oggetto strutturato
  const [pollutionData, placeData, historicalData, weatherData] = await Promise.all(promises);
  return { pollutionData, placeData, historicalData, weatherData };
}

/**
 * Carica dati inquinanti
 */
async function loadPollutionData() {
  try {
    const response = await fetch('/api/addDataset');
    if (!response.ok) return null;
    
    const rawData = await response.json();
    return Array.isArray(rawData) && Array.isArray(rawData[0]) ? rawData[0] :
           rawData.pollution && Array.isArray(rawData.pollution) ? rawData.pollution :
           Array.isArray(rawData) ? rawData : null;
  } catch (error) {
    console.warn('Impossibile caricare dati inquinanti:', error);
    return null;
  }
}

/**
 * Carica dati luogo
 */
async function loadPlaceData() {
  try {
    const response = await fetch('/api/addDataset');
    if (!response.ok) return null;
    
    const rawData = await response.json();
    return rawData && rawData.locations && Array.isArray(rawData.locations) ? rawData.locations :
           Array.isArray(rawData) && rawData.length === 2 && Array.isArray(rawData[1]) ? rawData[1] : null;
  } catch (error) {
    console.warn('Impossibile caricare dati luoghi:', error);
    return null;
  }
}

async function loadHistoricalData() {
  try {
    const response = await fetch('/api/addDataset');
    if (!response.ok) return null;

    const rawData = await response.json();
    // dataset tipo CSV convertito in JSON
    if (Array.isArray(rawData)) return rawData;
    if (rawData.events && Array.isArray(rawData.events)) return rawData.events;
    return null;
  } catch (error) {
    console.warn('Impossibile caricare dataset storico:', error);
    return null;
  }
}

/** * Verifica se ci sono dati sugli inquinanti */ 
function hasPollutionData(species) { 
  return species.info_abbattimento_co2 || species.info_abbattimento_no2 || 
    species.info_abbattimento_o3 || species.info_abbattimento_pm10 || species.info_abbattimento_so2; 
}

/** Genera frasi sugli inquinanti (versione semplificata)*/
function generatePollutionSentences(pollutionData, typeInquinante, valoreAlbero) {
  if (!pollutionData) return [`Dati non disponibili per ${typeInquinante}`];

  const mappaInquinanti = {
    "CO₂": "CO2",
    "NO₂": "NO2",
    "O₃": "O3",
    "SO₂": "SO2",
    "PM10": "PM10"
  };
  typeInquinante = mappaInquinanti[typeInquinante] || typeInquinante;

  // Normalizza il dataset
  let dataArray =
    Array.isArray(pollutionData) && Array.isArray(pollutionData[0])
      ? pollutionData[0]
      : pollutionData.pollution && Array.isArray(pollutionData.pollution)
      ? pollutionData.pollution
      : Array.isArray(pollutionData)
      ? pollutionData
      : null;

  if (!dataArray) return [`Dati non disponibili per ${typeInquinante}`];

  // Filtra le righe per inquinante
  const subset = dataArray.filter(item => item && item.inquinante === typeInquinante);
  if (subset.length === 0) return [`Nessuna informazione per ${typeInquinante}`];

  // Scegli quante frasi generare (1 o 2)
  const nFrasi = Math.random() > 0.5 ? 2 : 1;
  const frasi = [];

  for (let i = 0; i < nFrasi; i++) {
    const row = subset[Math.floor(Math.random() * subset.length)];

    try {
      // 🔢 Parsing numeri e unità
      const parseValore = (str) => {
        const match = String(str).trim().match(/^([\d.,]+)\s*([a-zA-Zµμ²³%/]+)?$/);
        if (!match) return { num: NaN, unit: "" };
        return { num: parseFloat(match[1].replace(",", ".")), unit: match[2] || "" };
      };

      const { num: valoreNum, unit: unitValore } = parseValore(row.valore);
      const valoreAlberoNum = parseFloat(valoreAlbero);
      if (isNaN(valoreNum) || isNaN(valoreAlberoNum)) {
        frasi.push(`Abbattimento ${typeInquinante}: ${valoreAlbero}`);
        continue;
      }

      // ⚖️ Calcola rapporto
      const fattore = valoreNum !== 0 ? valoreAlberoNum / valoreNum : 1.0;

      // Scala la dipendenza mantenendo unità
      let nuovaDip = row.dipendenza || "";
      const { num: dipNum, unit: dipUnit } = parseValore(nuovaDip);
      if (!isNaN(dipNum)) {
        const nuovoNum = Math.round(dipNum * fattore * 100) / 100;
        nuovaDip = `${nuovoNum} ${dipUnit}`.trim();
      }

      // ✏️ Costruzione frase
      let frase = row.desc || "";
      frase = frase.replace(/^"|"$/g, "");
      frase = frase.replace(/\{\$valore\}/g, `${valoreAlberoNum} ${unitValore}`.trim());
      frase = frase.replace(/\{\$dipendenza\}/g, nuovaDip);
      frase = frase.replace(/\{\$tempo\}/g, row.tempo || "1 anno");

      // Aggiungi frase generata
      frasi.push(frase);
    } catch (err) {
      console.warn(`Errore in generatePollutionSentences(${typeInquinante}):`, err);
      frasi.push(`Abbattimento ${typeInquinante}: ${valoreAlbero}`);
    }
  }

  return frasi;
}


// =============================================
// METODO PER API
// =============================================
export async function buildTreeContext(tree, species = null, variant="statico") {
  
  const { pollutionData, placeData, historicalData, weatherData } = await loadAsyncData(tree, species);
  const ragStructure = await buildTreeStructure(tree, species, placeData, pollutionData, historicalData, weatherData);
  const context = buildContextString(ragStructure);

  console.log(context)

  if(variant == "statico")
    return {ragStructure: ragStructure, id_spacevector: ''};

  // =============================================
  // 🚀 Chiamata all’endpoint dello Space HuggingFace
  // =============================================
  let id = ''
  try {
    const response = await fetch('https://benny2199-rag-microservice.hf.space/initialize_space', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: context // 👈 il backend ora si aspetta "context" con struttura RAG completa
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Errore backend RAG:', errorData.error || response.statusText);
      throw new Error(errorData.error || `Errore HTTP ${response.status}`);
    }

    const data = await response.json();
    id = data.index_id
    if (!data.success && !data.documents) {
      throw new Error(data.error || 'Errore inizializzazione spazio vettoriale');
    }

    console.log(`✅ Spazio vettoriale inizializzato`);
  } catch (err) {
    console.log('❌ Errore durante la chiamata a initialize_space:');
    console.error('❌ Errore durante la chiamata a initialize_space:', err.message);
  }
  // =============================================
  // 🌿 Ritorna il contesto legacy per compatibilità
  // =============================================
  return {ragStructure: ragStructure, id_spacevector: id};
}