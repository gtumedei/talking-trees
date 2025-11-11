// ./services/TreeContextBuilder.jsx
import { weatherReflection } from './WeatherContextBuilder';

// =============================================
// STRUTTURA DATI PER IL SISTEMA RAG
// =============================================

// =============================================
// METODO 1: CREA STRUTTURA RAG PROCESSABILE
// =============================================

/**
 * Crea una struttura dati direttamente processabile dal sistema RAG
 */
export async function buildRAGStructure(tree, species = null, weatherData = null) {
  if (!tree) return { sections: [], metadata: { treeName: 'Unknown', totalChunks: 0, totalWords: 0, sources: [] } };

  try {
    const sections = [];
    const treeName = tree.soprannome || 'Albero Monumentale';
    
    // Carica dati asincroni in parallelo
    const [pollutionData, placeData, treeReflection] = await loadAsyncData(tree, species);

    // 1. SEZIONE DATI ALBERO (Identità e caratteristiche fisiche)
    const treeDataSection = buildTreeDataSection(tree, treeName);
    if (treeDataSection) sections.push(treeDataSection);

    // 2. SEZIONE DATI BOTANICI (Specie e caratteristiche botaniche)
    const botanicalSections = buildBotanicalSections(tree, species, pollutionData);
    sections.push(...botanicalSections);

    // 3. SEZIONE DATI LUOGO (Contesto geografico e culturale)
    const locationSections = buildLocationSections(tree, placeData);
    sections.push(...locationSections);

    // 4. SEZIONE DATI METEOROLOGICI (Contesto ambientale attuale)
    if (weatherData) {
      const weatherSection = await buildWeatherSection(weatherData, tree, treeReflection);
      if (weatherSection) sections.push(weatherSection);
    }

    // 5. SEZIONE DATI STORICI (Contesto temporale)
    const historicalSection = buildHistoricalSection(tree);
    if (historicalSection) sections.push(historicalSection);

    return {
      sections,
      metadata: {
        treeName,
        totalChunks: sections.length,
        totalWords: sections.reduce((sum, section) => sum + section.metadata.wordCount, 0),
        sources: [...new Set(sections.map(s => s.metadata.source))]
      }
    };

  } catch (error) {
    console.error('Errore nella costruzione della struttura RAG:', error);
    return { sections: [], metadata: { treeName: 'Error', totalChunks: 0, totalWords: 0, sources: [] } };
  }
}

// =============================================
// METODO 2: CREA STRINGA COMPLETA DALLA STRUTTURA
// =============================================

/**
 * Trasforma la struttura RAG in una stringa di contesto completa
 */
export function buildContextString(ragStructure) {
  if (!ragStructure || !ragStructure.sections.length) {
    return "Contesto non disponibile per questo albero.";
  }

  const parts = [];
  
  // Raggruppa le sezioni per tipo per organizzazione logica
  const sectionsByType = ragStructure.sections.reduce((acc, section) => {
    if (!acc[section.type]) acc[section.type] = [];
    acc[section.type].push(section);
    return acc;
  }, {});

  // Costruisci la stringa in ordine logico
  const sectionOrder = [
    'DATI_ALBERO',
    'DATI_BOTANICI', 
    'DATI_ECOLOGICI',
    'DATI_LUOGO',
    'DATI_METEOROLOGICI',
    'DATI_SALUTE',
    'DATI_STORICI'
  ];

  sectionOrder.forEach(sectionType => {
    if (sectionsByType[sectionType]) {
      // Aggiungi header della sezione
      const header = getSectionHeader(sectionType);
      parts.push(header);
      
      // Aggiungi contenuti
      sectionsByType[sectionType].forEach(section => {
        parts.push(section.content);
      });
      
      parts.push(''); // Linea vuota per separazione
    }
  });

  return parts.join('\n').trim();
}

// =============================================
// FUNZIONI DI SUPPORTO PER IL METODO 1
// =============================================

/**
 * Carica tutti i dati asincroni in parallelo
 */
async function loadAsyncData(tree, species) {
  const promises = [];
  
  // Dati inquinanti (se necessari)
  if (species && hasPollutionData(species)) {
    promises.push(loadPollutionData());
  } else {
    promises.push(Promise.resolve(null));
  }
  
  // Dati luogo
  promises.push(loadPlaceData());
  
  // Riflessione albero (se coordinate disponibili)
  if (tree.lat && tree.lon) {
    promises.push(loadTreeReflection(tree));
  } else {
    promises.push(Promise.resolve(null));
  }
  
  return Promise.all(promises);
}

/**
 * Costruisce la sezione dati albero
 */
function buildTreeDataSection(tree, treeName) {
  const contentParts = [];
  
  // Identità
  contentParts.push(`Nome: ${treeName}`);
  
  // Dimensioni e caratteristiche fisiche
  const dimensions = [];
  if (tree.altezza_m) dimensions.push(`Altezza ${tree.altezza_m} metri`);
  if (tree.circonferenza_fusto_cm) dimensions.push(`Circonferenza fusto ${tree.circonferenza_fusto_cm} cm`);
  if (dimensions.length > 0) {
    contentParts.push(`Dimensioni: ${dimensions.join(', ')}`);
  }
  
  if (tree.criteri_monumentalita) {
    contentParts.push(`Criteri di monumentalità: ${tree.criteri_monumentalita}`);
  }
  
  if (tree.desc) {
    contentParts.push(`Descrizione: ${tree.desc}`);
  }
  
  if (contentParts.length <= 1) return null; // Solo nome, sezione non significativa
  
  return {
    id: 'tree_identity',
    type: 'DATI_ALBERO',
    content: contentParts.join('\n'),
    tags: ['#IDENTITA', '#MORFOLOGIA', '#MONUMENTALITA'],
    metadata: {
      source: 'tree_data',
      wordCount: contentParts.join(' ').split(/\s+/).length,
      confidence: 0.9,
      temporalContext: 'presente'
    }
  };
}

/**
 * Costruisce le sezioni botaniche
 */
function buildBotanicalSections(tree, species, pollutionData) {
  const sections = [];
  
  if (!species) return sections;
  
  // Sezione principale botanica
  const botanicalParts = [];
  const nomeSpecie = [];
  
  if (tree.specie_nome_volgare) nomeSpecie.push(tree.specie_nome_volgare);
  if (tree.specie_nome_scientifico) nomeSpecie.push(tree.specie_nome_scientifico);
  if (nomeSpecie.length > 0) {
    botanicalParts.push(`Nome specie: ${nomeSpecie.join(' - ')}`);
  }
  
  if (species.portamento) botanicalParts.push(`Portamento: ${species.portamento}`);
  if (species.info_tipologia) botanicalParts.push(`Tipologia: ${species.info_tipologia}`);
  
  // Chioma
  const chiomaDetails = [];
  if (species.forma_chioma) chiomaDetails.push(`Forma: ${species.forma_chioma}`);
  if (species.info_densita_chioma) chiomaDetails.push(`Densità: ${species.info_densita_chioma}`);
  if (chiomaDetails.length > 0) {
    botanicalParts.push(`Chioma: ${chiomaDetails.join(', ')}`);
  }
  
  // Caratteristiche stagionali
  const seasonalFeatures = [];
  if (species.info_colori_autunnali) seasonalFeatures.push(`Colori autunnali: ${species.info_colori_autunnali}`);
  if (species.info_frutti) seasonalFeatures.push(`Frutti: ${species.info_frutti}`);
  if (species.info_fioritura) {
    const epoca = species.epoca_di_fioritura ? ` (${species.epoca_di_fioritura})` : '';
    seasonalFeatures.push(`Fioritura: ${species.info_fioritura}${epoca}`);
  }
  if (seasonalFeatures.length > 0) {
    botanicalParts.push(seasonalFeatures.join(', '));
  }
  
  if (species.habitat) botanicalParts.push(`Habitat: ${species.habitat}`);
  
  // Dimensioni specie
  const speciesSize = [];
  if (species.size_altezza) speciesSize.push(`Altezza: ${species.size_altezza}`);
  if (species.size_chioma) speciesSize.push(`Chioma: ${species.size_chioma}`);
  if (speciesSize.length > 0) {
    botanicalParts.push(`Dimensioni tipiche: ${speciesSize.join(', ')}`);
  }
  
  if (botanicalParts.length > 0) {
    sections.push({
      id: 'botanical_data',
      type: 'DATI_BOTANICI',
      content: botanicalParts.join('\n'),
      tags: ['#BOTANICA', '#SPECIE', '#MORFOLOGIA', '#FENOLOGIA'],
      metadata: {
        source: 'species_data',
        wordCount: botanicalParts.join(' ').split(/\s+/).length,
        confidence: 0.8,
        temporalContext: 'presente'
      }
    });
  }
  
  // Sezione ecologica (inquinanti)
  const ecologicalSection = buildEcologicalSection(species, pollutionData);
  if (ecologicalSection) sections.push(ecologicalSection);
  
  return sections;
}

/**
 * Costruisce la sezione dati ecologici
 */
function buildEcologicalSection(species, pollutionData) {
  const inquinanti = {
    "CO₂": species.info_abbattimento_co2,
    "NO₂": species.info_abbattimento_no2,
    "O₃": species.info_abbattimento_o3,
    "PM10": species.info_abbattimento_pm10,
    "SO₂": species.info_abbattimento_so2,
  };
  
  const ecologicalParts = [];
  
  Object.entries(inquinanti).forEach(([nome, valore]) => {
    if (valore) {
      let info = `Abbattimento ${nome}: ${valore}`;
      
      // Aggiungi dettagli specifici
      if (nome === "CO₂" && species.abbattimento_co2) {
        info += ` (${species.abbattimento_co2})`;
      } else if (nome === "PM10" && species.abbattimento_pm10) {
        info += ` (${species.abbattimento_pm10})`;
      }
      
      // Aggiungi frasi contestuali se disponibili
      if (pollutionData) {
        const frasiExtra = generatePollutionSentences(pollutionData, nome, valore);
        if (frasiExtra.length > 0) {
          info += ` → ${frasiExtra.join(', ')}`;
        }
      }
      
      ecologicalParts.push(info);
    }
  });
  
  if (ecologicalParts.length === 0) return null;
  
  return {
    id: 'ecological_data',
    type: 'DATI_ECOLOGICI',
    content: ecologicalParts.join('\n'),
    tags: ['#ECOLOGIA', '#INQUINAMENTO', '#SOSTENIBILITA', '#BENEFICI_AMBIENTALI'],
    metadata: {
      source: 'pollution_data',
      wordCount: ecologicalParts.join(' ').split(/\s+/).length,
      confidence: 0.7,
      temporalContext: 'presente'
    }
  };
}

/**
 * Costruisce le sezioni relative al luogo
 */
function buildLocationSections(tree, placeData) {
  const sections = [];
  
  // Sezione base luogo
  const locationParts = [];
  const luogoParts = [];
  
  if (tree.comune) luogoParts.push(tree.comune);
  if (tree.provincia) luogoParts.push(`(${tree.provincia})`);
  if (tree.regione) luogoParts.push(tree.regione);
  
  if (luogoParts.length > 0) {
    locationParts.push(`Luogo: ${luogoParts.join(', ')}`);
  }
  
  if (locationParts.length > 0) {
    sections.push({
      id: 'basic_location',
      type: 'DATI_LUOGO',
      content: locationParts.join('\n'),
      tags: ['#GEOGRAFIA', '#TERRITORIO', '#LOCALIZZAZIONE'],
      metadata: {
        source: 'tree_location',
        wordCount: locationParts.join(' ').split(/\s+/).length,
        confidence: 0.9,
        temporalContext: 'presente'
      }
    });
  }
  
  // Sezione dati culturali approfonditi
  const culturalSection = buildCulturalSection(tree, placeData);
  if (culturalSection) sections.push(culturalSection);
  
  return sections;
}

/**
 * Costruisce la sezione dati culturali
 */
function buildCulturalSection(tree, placeData) {
  if (!placeData || !Array.isArray(placeData) || !tree.comune) return null;
  
  try {
    const datiComune = placeData.filter(item => 
      item && item.comune && 
      item.comune.toString().toLowerCase().trim() === tree.comune.toString().toLowerCase().trim()
    );
    
    if (datiComune.length === 0) return null;
    
    const datoComune = datiComune[0];
    const culturalParts = [];
    
    // Dati demografici e territoriali
    if (datoComune.num_residenti) {
      culturalParts.push(`Popolazione: ${datoComune.num_residenti} abitanti`);
    }
    if (datoComune.superficie) {
      culturalParts.push(`Superficie: ${datoComune.superficie} km²`);
    }
    
    // Dati culturali e storici
    if (datoComune.desc) {
      culturalParts.push(`Descrizione territorio: ${datoComune.desc}`);
    }
    if (datoComune.storia) {
      culturalParts.push(`Contesto storico: ${datoComune.storia}`);
    }
    if (datoComune.culturale) {
      culturalParts.push(`Contesto culturale: ${datoComune.culturale}`);
    }
    
    if (culturalParts.length === 0) return null;
    
    return {
      id: 'cultural_data',
      type: 'DATI_LUOGO',
      content: culturalParts.join('\n'),
      tags: ['#CULTURA', '#STORIA', '#DEMOGRAFIA', '#TERRITORIO'],
      metadata: {
        source: 'place_data',
        wordCount: culturalParts.join(' ').split(/\s+/).length,
        confidence: 0.7,
        temporalContext: 'storico'
      }
    };
    
  } catch (error) {
    console.warn('Errore nel processare dati culturali:', error);
    return null;
  }
}

/**
 * Costruisce la sezione meteorologica
 */
async function buildWeatherSection(weatherData, tree, treeReflection) {
  try {
    let content = '';
    
    if (treeReflection) {
      content = treeReflection;
    } else {
      const weatherContext = await generateWeatherContext(weatherData, tree);
      content = weatherContext;
    }
    
    if (!content || content.includes('❌ Errore')) return null;
    
    // Aggiungi stato salute se disponibile
    let fullContent = '';
    if (tree.stato_salute) {
      fullContent += `Stato salute: ${tree.stato_salute}\n\n`;
    }
    fullContent += content;
    
    return {
      id: 'weather_health',
      type: 'DATI_METEOROLOGICI',
      content: fullContent,
      tags: ['#METEOROLOGIA', '#SALUTE', '#CLIMA', '#AMBIENTE'],
      metadata: {
        source: 'weather_data',
        wordCount: fullContent.split(/\s+/).length,
        confidence: 0.6,
        temporalContext: 'presente'
      }
    };
    
  } catch (error) {
    console.warn('Errore nella costruzione sezione meteorologica:', error);
    return null;
  }
}

/**
 * Costruisce la sezione storica
 */
function buildHistoricalSection(tree) {
  if (!tree.eta) return null;
  
  return {
    id: 'historical_data',
    type: 'DATI_STORICI',
    content: `Età: ${tree.eta}`,
    tags: ['#STORIA', '#TEMPO', '#LONGEVITA', '#CRONOLOGIA'],
    metadata: {
      source: 'tree_age',
      wordCount: tree.eta.split(/\s+/).length,
      confidence: 0.8,
      temporalContext: 'storico'
    }
  };
}

// =============================================
// FUNZIONI DI SUPPORTO GENERALI
// =============================================

/**
 * Header per le sezioni
 */
function getSectionHeader(sectionType) {
  const headers = {
    'DATI_ALBERO': 'DATI ALBERO:',
    'DATI_BOTANICI': 'DATI SPECIE BOTANICHE:',
    'DATI_ECOLOGICI': 'DATI ECOLOGICI:',
    'DATI_LUOGO': 'DATI LUOGO:',
    'DATI_METEOROLOGICI': 'DATI METEOROLOGICI E SALUTE:',
    'DATI_SALUTE': 'DATI SALUTE:',
    'DATI_STORICI': 'DATI STORICI:'
  };
  
  return headers[sectionType] || `${sectionType.replace('_', ' ')}:`;
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

/**
 * Carica riflessione albero
 */
async function loadTreeReflection(tree) {
  try {
    return await weatherReflection(tree.lat, tree.lon);
  } catch (error) {
    console.warn('Impossibile caricare riflessione albero:', error);
    return null;
  }
}

/**
 * Verifica se ci sono dati sugli inquinanti
 */
function hasPollutionData(species) {
  return species.info_abbattimento_co2 ||
         species.info_abbattimento_no2 ||
         species.info_abbattimento_o3 ||
         species.info_abbattimento_pm10 ||
         species.info_abbattimento_so2;
}

/**
 * Genera frasi sugli inquinanti (versione semplificata)
 */
function generatePollutionSentences(pollutionData, typeInquinante, valoreAlbero) {
  // Implementazione semplificata - mantenere la logica originale se necessaria
  const frasi = [];
  const nFrasi = Math.random() > 0.5 ? 2 : 1;
  
  for (let i = 0; i < nFrasi; i++) {
    // Qui puoi integrare la tua logica generaFrase originale
    frasi.push(`Contributo significativo all'abbattimento del ${typeInquinante}`);
  }
  
  return frasi;
}



// =============================================
// METODO LEGACY (per compatibilità)
// =============================================

/**
 * Metodo legacy che mantiene la compatibilità con il codice esistente
 */
export async function buildTreeContext(tree, species = null, weatherData = null) {
  // =============================================
  // 🌤️ Prepara i dati di contesto (meteo, specie, ecc.)
  // =============================================
  const weather = await weatherReflection(tree.lat, tree.lon);
  const ragStructure = await buildRAGStructure(tree, species, weather);
  const context = buildContextString(ragStructure);

  // =============================================
  // 🚀 Chiamata all’endpoint dello Space HuggingFace
  // =============================================
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
    if (!data.success && !data.documents) {
      throw new Error(data.error || 'Errore inizializzazione spazio vettoriale');
    }

    console.log(
      `✅ Spazio vettoriale inizializzato correttamente con ${data.documents || '?'} documenti per:`,
      tree?.soprannome || 'albero sconosciuto'
    );
  } catch (err) {
    console.error('❌ Errore durante la chiamata a initialize_space:', err.message);
  }

  // =============================================
  // 🌿 Ritorna il contesto legacy per compatibilità
  // =============================================
  return context;
}