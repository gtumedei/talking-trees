// ./services/TreeContextBuilder.tsx
import { WeatherContextBuilder } from './WeatherContextBuilder';

import { UserTreeType, UserSpeciesType, EventType } from '@service/types/interface_context';
import {TreeData, SpeciesData, EcologicalData, LocationData, HealthData, HistoricalData, CSVRow} from '@service/types/interface_page';
import { generaFraseTS } from './PollutionCoontextBuilder';

// Se TreeStructure esiste altrove puoi importarlo; altrimenti usiamo questo
export interface Section<T = any> {
  id: string;
  type: string;
  content: T;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface TreeStructure {
  treeId: string | null;
  name?: string;
  sections: Section[];
}

// =============================================
// BUILD CONTEXT STRUCTURE (ritorna struttura RAG compatibile con originale)
// =============================================
export async function buildTreeStructure(
  tree: UserTreeType,
  species?: UserSpeciesType,
  pollutionData?: CSVRow[] | null,
  locationData?: CSVRow[] | null,
  weatherData?: string | null,
  historicalData?: CSVRow[] | null
): Promise<TreeStructure> {
  const sections: Section[] = [];

  const albero = buildDatiAlbero(tree);
  const descrizione = buildDatiDescrizione(tree);
  const botanica = buildDatiSpecie(species);
  const ecologia = buildEcologicalSection(species, pollutionData);
  const luogo = buildDatiLuogo(tree, locationData);
  const storia = buildHistoricalSection(tree, historicalData);
  const salute = buildHealthSection(tree, weatherData);

  [albero, descrizione, botanica, ecologia, luogo, salute, storia].forEach(s => {
    if (s) sections.push(s);
  });

  const treeId = tree?.['id scheda'] || (tree as any).id || null;
  const name = tree?.soprannome || tree?.['specie nome volgare'] || undefined;

  return {
    treeId,
    name,
    sections
  };
}

// =============================================
// BUILD CONTEXT STRING (mantiene il formato testuale leggibile come nel file JS originale)
// =============================================
export function buildContextString(treeStructure: TreeStructure | null): string {
  if (!treeStructure?.sections?.length) return '';

  const s = Object.fromEntries(
    treeStructure.sections.map(sec => [sec.type, sec.content])
  ) as Record<string, any>;

  const parts: string[] = [];

  // 🌳 DATI ALBERO
  if (s['DATI_ALBERO']) {
    const d = s['DATI_ALBERO'];
    const datiAlbero: string[] = [];

    if (d.nome) datiAlbero.push(`- Nome: ${d.nome}`);
    if (d.altezza || d.circonferenza)
      datiAlbero.push(
        `- Dimensioni: ${d.altezza ? `altezza ${d.altezza}` : ''}${
          d.altezza && d.circonferenza ? ', ' : ''
        }${d.circonferenza ? `circonferenza fusto ${d.circonferenza}` : ''}`
      );
    if (d.criteri) datiAlbero.push(`- Criteri monumentalità: "${String(d.criteri).trim()}"`);

    if (datiAlbero.length) {
      parts.push('DATI ALBERO:');
      parts.push(...datiAlbero);
    }
  }

  // 📝 DESCRIZIONE
  if (typeof s['DATI_DESCRIZIONE'] === 'string' && s['DATI_DESCRIZIONE'].trim()) {
    parts.push('\nDATI DESCRIZIONE:');
    parts.push(String(s['DATI_DESCRIZIONE']).trim());
  }

  // 🌱 SPECIE
  if (s['DATI_SPECIE_BOTANICHE']) {
    const sp = s['DATI_SPECIE_BOTANICHE'];
    const specie: string[] = [];

    if (sp.nome_comune || sp.nome_scientifico)
      specie.push(
        `- Specie: ${sp.nome_comune || ''}${sp.nome_comune && sp.nome_scientifico ? ' - ' : ''}${
          sp.nome_scientifico ? `(nome scientifico: ${sp.nome_scientifico})` : ''
        }`
      );

    const caratteristiche: string[] = [];
    if (sp.portamento) caratteristiche.push(`portamento ${sp.portamento}`);
    if (sp.tipologia) caratteristiche.push(sp.tipologia);
    if (sp.info_densita_chioma || sp.chioma?.densità)
      caratteristiche.push(
        `chioma ${String(sp.info_densita_chioma || sp.chioma?.densità).toLowerCase()}`
      );
    if (sp.info_forma_chioma || sp.chioma?.forma) caratteristiche.push(
      String(sp.info_forma_chioma || sp.chioma?.forma).toLowerCase()
    );
    if (sp.info_colori_autunnali || sp.colori_autunnali) caratteristiche.push(`colori autunnali: ${sp.info_colori_autunnali || sp.colori_autunnali}`);
    if (sp.info_frutti || sp.frutti) caratteristiche.push(`frutti: ${sp.info_frutti || sp.frutti}`);
    if (sp.info_fioritura || sp.fioritura) caratteristiche.push(`fioritura: ${sp.info_fioritura || sp.fioritura}`);

    if (caratteristiche.length)
      specie.push(`- Caratteristiche specie: ${caratteristiche.join(', ')}`);
    if (sp.habitat) specie.push(`- Habitat specie: ${sp.habitat}`);
    if (sp.size_altezza || sp.dimensioni_specie?.altezza_m || sp.size_chioma || sp.dimensioni_specie?.chioma)
      specie.push(
        `- Dimensioni (specie):${
          sp.size_altezza ? ` Altezza: ${sp.size_altezza}` : (sp.dimensioni_specie?.altezza_m ? ` Altezza: ${sp.dimensioni_specie.altezza_m}` : '')
        }${(sp.size_chioma || sp.dimensioni_specie?.chioma) ? `, Chioma: ${sp.size_chioma || sp.dimensioni_specie?.chioma}` : ''}`
      );

    if (specie.length) {
      parts.push('\nDATI SPECIE BOTANICHE:');
      parts.push(...specie);
    }
  }

  // 🌿 ECOLOGIA
  if (s['DATI_ECOLOGICI/AMBIENTALI']) {
    const ecoData = s['DATI_ECOLOGICI/AMBIENTALI'] as EcologicalData;
    const eco = Object.entries(ecoData).filter(([_, obj]) => obj?.valore && String(obj.valore).trim());
    parts.push("Gli alberi svolgono un ruolo fondamentale nel mantenimento dell’equilibrio ambientale: assorbono anidride carbonica, migliorano la qualità dell’aria, favoriscono la biodiversità e contribuiscono alla regolazione del clima locale. La loro presenza aiuta a ridurre il rischio di erosione del suolo, stabilizza i terreni e crea microhabitat preziosi per numerose specie animali.");
    if (eco.length) {
      parts.push('\nDATI ECOLOGICI/AMBIENTALI:');
      eco.forEach(([nome, obj]) => {
        const valore = obj.valore;
        const descrizione = obj.descrizione?.descrizione || '';
        parts.push(`- ${valore}`);
        if (descrizione) parts.push(`  Descrizione: ${descrizione}`);
        //manca la generazione pari a.....
      });
    }
  }

  // 🩺 SALUTE
  if (s['DATI_SALUTE']) {
    const h = s['DATI_SALUTE'];
    const salute: string[] = [];
    if (h.stato_salute && h.stato_salute !== 'Non specificato') salute.push(`- Stato di salute: ${h.stato_salute}`);
    if (h.condizioni_meteo) salute.push(`${h.condizioni_meteo}`);

    if (salute.length) {
      parts.push('\nDATI SALUTE:');
      parts.push(...salute);
    }
  }

  // 🕰️ STORIA
  if (s['DATI_STORICI']) {
    const hs = s['DATI_STORICI'];
    const storia: string[] = [];
    if (hs.eta) storia.push(`- Età: ${hs.eta}`);
    if (hs.eventi) storia.push(`- Eventi avvenuti durante la vita: ${hs.eventi}`);

    if (storia.length) {
      parts.push('\nDATI STORICI:');
      parts.push(...storia);
    }
  }

  // 📍 LUOGO
  if (s['DATI_LUOGO']) {
    const l = s['DATI_LUOGO'];
    const luogo: string[] = [];
    if (l.comune || l.provincia || l.regione || l.popolazione || l.superficie_km2) {
      luogo.push(
        `- Luogo: ${
          l.comune ? `(comune: ${l.comune})` : ''
        }${l.provincia ? `, (provincia: ${l.provincia})` : ''}${
          l.regione ? `, (regione: ${l.regione})` : ''
        }${l.popolazione ? `, (popolazione: ${l.popolazione})` : ''}${
          l.superficie_km2 ? `, (superficie: ${l.superficie_km2})` : ''
        }`
      );
    }
    if (l.descrizione) luogo.push(`- Descrizione territorio: ${l.descrizione}`);
    if (l.contesto_storico) luogo.push(`- Contesto storico: ${l.contesto_storico}`);
    if (l.contesto_culturale) luogo.push(`- Contesto culturale: ${l.contesto_culturale}`);

    if (luogo.length) {
      parts.push('\nDATI LUOGO:');
      parts.push(...luogo);
    }
  }

  parts.push('\nDATI GENERALI:');
  parts.push('Gli alberi monumentali rappresentano un patrimonio naturale e culturale di valore inestimabile. Oltre alla loro imponenza, raccontano secoli di storia, tradizioni e leggende del territorio. La loro conservazione è importante per tramandare alle generazioni future un legame tangibile con il passato e con la memoria collettiva di una comunità.');
  parts.push('Un albero non è solo un organismo isolato, ma un piccolo ecosistema: offre riparo, cibo e siti riproduttivi a insetti, uccelli, piccoli mammiferi e microorganismi. La sua chioma, la corteccia e il terreno circostante ospitano una rete complessa di vita che contribuisce alla resilienza ambientale dell’area.');
  parts.push('Ogni albero contribuisce alla biodiversità locale supportando la vita di molte specie vegetali e animali. Anche un singolo esemplare monumentale può fungere da punto di riferimento ecologico, diventando una risorsa stabile per la fauna selvatica e influenzando positivamente l’intero ecosistema circostante.');
  parts.push('La presenza degli alberi favorisce il benessere psicofisico: migliorano la qualità dell’aria, riducono il rumore e creano zone d’ombra che abbassano le temperature estive. Il contatto con la natura è associato a benefici emotivi, cognitivi e sociali, rendendo questi giganti verdi preziosi anche per la salute dell’uomo.');
  parts.push('Gli alberi contribuiscono alla filtrazione dell’aria, alla produzione di ossigeno, alla regolazione idrica e alla creazione di microclimi. Queste funzioni, spesso invisibili, rendono gli alberi essenziali per contrastare gli effetti del cambiamento climatico e per mantenere sano l’ambiente urbano e rurale.');
  parts.push('Ogni albero monumentale è un’eredità naturale che ci è stata affidata. La sua tutela garantisce che le generazioni future possano continuare ad ammirarlo e a beneficiare dei servizi ecosistemici e del valore culturale che esso rappresenta.');

  return parts.join('\n').trim();
}

// =============================================
// FUNZIONI DI SUPPORTO
// =============================================

/** DATI ALBERO */
export function buildDatiAlbero(tree?: UserTreeType): Section<TreeData> | null {
  if (!tree) return null;

  const content: TreeData = {
    criteri: tree["criteri di monumentalità"] || '',
    circonferenza: tree["circonferenza fusto (cm)"] || (tree.circonferenza_clear || ''),
    altezza: tree["altezza (m)"] || (tree.altezza_clear || '')
  };

  // aggiungiamo nome come nel JS originale
  const nome = tree.soprannome || tree['specie nome volgare'] || 'Albero monumentale';

  return {
    id: 'tree_data',
    type: 'DATI_ALBERO',
    content: {
      ...content,
      nome
    } as any,
    metadata: { source: 'tree_dataset' }
  };
}

/** DATI DESCRIZIONE */
export function buildDatiDescrizione(tree?: UserTreeType): Section<string> | null {
  if (!tree?.desc) return null;

  return {
    id: 'tree_description',
    type: 'DATI_DESCRIZIONE',
    content: String(tree.desc).trim(),
    metadata: { source: 'tree_dataset' }
  };
}

/** DATI SPECIE */
export function buildDatiSpecie(species?: UserSpeciesType): Section<SpeciesData> | null {
  if (!species) return null;

  const content: SpeciesData = {
    nome_comune: species.nome_comune || '',
    nome_scientifico: species.nome_specie || species.nome_specie || '',
    portamento: species.info_portamento || '',
    tipologia: species.info_tipologia || '',
    chioma: {
      forma: species.info_forma_chioma || '',
      densità: species.info_densita_chioma || ''
    },
    colori_autunnali: species.info_colori_autunnali || '',
    frutti: species.info_frutti || '',
    fioritura: species.info_fioritura || '',
    habitat: species.habitat || '',
    dimensioni_specie: {
      altezza_m: species.size_altezza || '',
      chioma: species.size_chioma || ''
    }
  };

  return {
    id: 'species_data',
    type: 'DATI_SPECIE_BOTANICHE',
    content,
    metadata: { source: 'species_dataset' }
  };
}

/** DATI_ECOLOGICI/AMBIENTALI */
export function buildEcologicalSection(species?: UserSpeciesType, pollutionData?: CSVRow[] | null): Section<EcologicalData> | null {
  if (!species) return null;

  const inquinanti: Record<string, number | undefined> = { 
    'CO₂': species.info_abbattimento_co2 ? Number(species.info_abbattimento_co2) : undefined,
    'NO₂': species.info_abbattimento_no2 ? Number(species.info_abbattimento_no2) : undefined,
    'O₃': species.info_abbattimento_o3 ? Number(species.info_abbattimento_o3) : undefined,
    'PM10': species.info_abbattimento_pm10 ? Number(species.info_abbattimento_pm10) : undefined,
    'SO₂': species.info_abbattimento_so2 ? Number(species.info_abbattimento_so2) : undefined
  };


  const pollutantInfo: Record<string, { descrizione: string }> = {
    'CO₂': { descrizione: "La CO₂ è l'anidride carbonica, un gas serra che contribuisce al riscaldamento globale." },
    'PM10': { descrizione: 'Il PM10 è un insieme di particelle sottili sospese nell\'aria, dannose per l\'apparato respiratorio.' },
    'O₃': { descrizione: 'L\'O₃ (ozono troposferico) è un inquinante secondario che si forma in presenza di sole e smog.' },
    'NO₂': { descrizione: 'Il NO₂ (biossido di azoto) deriva dai gas di scarico e influisce sulla salute dei polmoni.' },
    'SO₂': { descrizione: 'Il SO₂ (biossido di zolfo) è prodotto da combustioni industriali e può causare piogge acide.' }
  };

  const ecologicalParts: EcologicalData = {};

  for (const [nome, valore] of Object.entries(inquinanti)) {
    if (!valore) continue;

    const equivalenza = generaFraseTS(nome, valore, pollutionData)
    let info = `Abbattimento ${nome}: ${valore} → ${equivalenza}`;

    if (pollutionData) {
      const frasiExtra = pollutionData
        .filter(row => String(row['inquinante']).trim() === nome)
        .map(row => row['descrizione'])
        .filter(Boolean);
      if (frasiExtra.length > 0) {
        info += ` → ${frasiExtra.join(', ')}`;
      }
    }

    ecologicalParts[nome] = {
      valore: info,
      descrizione: pollutantInfo[nome] ? { descrizione: pollutantInfo[nome].descrizione } : undefined
    };
  }

  if (Object.keys(ecologicalParts).length === 0) return null;

  return {
    id: 'ecological_data',
    type: 'DATI_ECOLOGICI/AMBIENTALI',
    content: ecologicalParts,
    metadata: { source: 'pollution_data' }
  };
}

/** DATI LUOGO */
export function buildDatiLuogo(tree: UserTreeType, locationData?: CSVRow[] | null): Section<LocationData> | null {
  const luogo = locationData?.find(p => p['comune'] === tree.comune) || ({} as CSVRow);

  return {
    id: 'place_data',
    type: 'DATI_LUOGO',
    content: {
      comune: tree.comune,
      provincia: tree.provincia,
      regione: tree.regione,
      popolazione: luogo['num_residenti'],
      superficie_km2: luogo['superficie'],
      descrizione: luogo['desc'],
      contesto_storico: luogo['storia'],
      contesto_culturale: luogo['culturale']
    },
    metadata: { source: 'geo_dataset' }
  };
}

/** DATI SALUTE */
export function buildHealthSection(tree: UserTreeType, weatherString?: string | null): Section<HealthData> | null {
  const statoSalute = tree.stato_salute || 'Non specificato';
  const descrizioneMeteo = weatherString || 'Nessuna informazione meteorologica disponibile.';

  const content: HealthData = {
    stato: statoSalute,
    condizioni_meteo: descrizioneMeteo
  };

  // Se non c'è informazione sensata ritorna null (come nel JS originale)
  if ((!content.stato || content.stato === '') && (!content.condizioni_meteo || content.condizioni_meteo === ''))
    return null;

  return {
    id: 'health_data',
    type: 'DATI_SALUTE',
    content,
    tags: ['#SALUTE', '#AMBIENTE', '#CONDIZIONI_METEO'],
    metadata: { source: 'tree_health', confidence: 0.7, temporalContext: 'presente' }
  };
}

/** DATI STORICI */
export function buildHistoricalSection(tree: UserTreeType, historicalData?: CSVRow[] | null): Section<HistoricalData> | null {
  if (!tree?.eta) return null;

  const currentYear = new Date().getFullYear();
  const match = String(tree.eta).match(/\d+/);
  const age = match ? parseInt(match[0], 10) : NaN;
  if (isNaN(age)) return null;

  const yearMin = currentYear - age;

  const filteredEvents: EventType[] = (historicalData || [])
    .map(row => {
      // proviamo a normalizzare la riga: accettiamo sia {year, text} sia {anno, testo} ecc.
      const year = row['year'] ? parseInt(String(row['year']), 10) : NaN;
      const text = row['text'] || row['desc'] || row['description'] || '';
      return { year: isNaN(year) ? -1 : year, text: String(text), category: row['category'] || '' } as EventType;
    })
    .filter(e => !isNaN(e.year) && e.year >= yearMin && e.year <= currentYear);

  if (filteredEvents.length === 0) return null;

  const eventiString = filteredEvents
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(e => `(${e.year} ${e.text})`);

  const content: HistoricalData = {
    eta: tree.eta,
    eventi: eventiString // manteniamo string come nel JS originario per compatibilità con buildContextString
  };

  return {
    id: 'historical_data',
    type: 'DATI_STORICI',
    content,
    tags: ['#STORIA', '#TEMPO', '#LONGEVITA', '#CRONOLOGIA'],
    metadata: { source: 'tree_age', wordCount: (tree.eta + ' ' + eventiString).split(/\s+/).length, confidence: 0.8, temporalContext: 'storico' }
  };
}

// =============================================
// FUNZIONI DI SUPPORTO GENERALI (fetch loaders etc.)
// =============================================

/** Carica tutti i dataset asincroni in parallelo */
export async function loadAsyncData(tree: UserTreeType, species?: UserSpeciesType) {
  const promises: Promise<any>[] = [];

  const pollutionPromise = (species && hasPollutionData(species))
    ? loadPollutionData()
    : Promise.resolve<CSVRow[] | null>(null);
  promises.push(pollutionPromise);

  promises.push(loadPlaceData());
  promises.push(loadHistoricalData());

  const weatherPromise = (tree.lat && tree.lon)
    ? WeatherContextBuilder.generateReflection(tree.lat, tree.lon)
    : Promise.resolve<string | null>(null);
  promises.push(weatherPromise);

  const [pollutionData, placeData, historicalData, weatherData] = await Promise.all(promises);
  return { pollutionData, placeData, historicalData, weatherData };
}

/** Carica dati inquinanti */
export async function loadPollutionData(): Promise<CSVRow[] | null> {
  try {
    const response = await fetch('/api/addDataset');
    if (!response.ok) return null;

    const rawData = await response.json();
    // route addDataset restituisce { pollution, locations, events }
    if (rawData?.pollution && Array.isArray(rawData.pollution)) return rawData.pollution;
    if (Array.isArray(rawData) && Array.isArray(rawData[0])) return rawData[0];
    if (Array.isArray(rawData)) return rawData;
    return null;
  } catch (error) {
    console.warn('Impossibile caricare dati inquinanti:', error);
    return null;
  }
}

/** Carica dati luogo */
export async function loadPlaceData(): Promise<CSVRow[] | null> {
  try {
    const response = await fetch('/api/addDataset');
    if (!response.ok) return null;

    const rawData = await response.json();
    if (rawData?.locations && Array.isArray(rawData.locations)) return rawData.locations;
    if (Array.isArray(rawData) && rawData.length === 2 && Array.isArray(rawData[1])) return rawData[1];
    return null;
  } catch (error) {
    console.warn('Impossibile caricare dati luoghi:', error);
    return null;
  }
}

/** Carica dati storici */
export async function loadHistoricalData(): Promise<CSVRow[] | null> {
  try {
    const response = await fetch('/api/addDataset');
    if (!response.ok) return null;

    const rawData = await response.json();
    if (Array.isArray(rawData)) return rawData;
    if (rawData?.events && Array.isArray(rawData.events)) return rawData.events;
    // fallback: try locations/events shape
    if (rawData?.events && Array.isArray(rawData.events)) return rawData.events;
    return null;
  } catch (error) {
    console.warn('Impossibile caricare dataset storico:', error);
    return null;
  }
}

/** Verifica se ci sono dati sugli inquinanti */
export function hasPollutionData(species: UserSpeciesType): boolean {
  return !!(
    species.info_abbattimento_co2 ||
    species.info_abbattimento_no2 ||
    species.info_abbattimento_o3 ||
    species.info_abbattimento_pm10 ||
    species.info_abbattimento_so2
  );
}

/** Genera frasi sugli inquinanti (versione semplificata) */
export function generatePollutionSentences(
  pollutionData: CSVRow[] | null,
  typeInquinante: string,
  valoreAlbero: string
): string[] {
  if (!pollutionData) return [`Dati non disponibili per ${typeInquinante}`];

  const mappaInquinanti: Record<string, string> = {
    'CO₂': 'CO2',
    'NO₂': 'NO2',
    'O₃': 'O3',
    'SO₂': 'SO2',
    'PM10': 'PM10'
  };
  typeInquinante = (mappaInquinanti[typeInquinante] as string) || typeInquinante;

  // Normalizza il dataset
  let dataArray: CSVRow[] | null =
    Array.isArray(pollutionData) && Array.isArray((pollutionData as any)[0])
      ? (pollutionData as any)[0]
      : (pollutionData as any).pollution && Array.isArray((pollutionData as any).pollution)
      ? (pollutionData as any).pollution
      : Array.isArray(pollutionData)
      ? pollutionData
      : null;

  if (!dataArray) return [`Dati non disponibili per ${typeInquinante}`];

  // Filtra le righe per inquinante
  const subset = dataArray.filter(item => item && String(item['inquinante']) === typeInquinante);
  if (subset.length === 0) return [`Nessuna informazione per ${typeInquinante}`];

  // Scegli quante frasi generare (1 o 2)
  const nFrasi = Math.random() > 0.5 ? 2 : 1;
  const frasi: string[] = [];

  for (let i = 0; i < nFrasi; i++) {
    const row = subset[Math.floor(Math.random() * subset.length)];

    try {
      const parseValore = (str?: string) => {
        const match = String(str || '').trim().match(/^([\d.,]+)\s*([a-zA-Zµμ²³%/]+)?$/);
        if (!match) return { num: NaN, unit: '' };
        return { num: parseFloat(match[1].replace(',', '.')), unit: match[2] || '' };
      };

      const { num: valoreNum, unit: unitValore } = parseValore(row['valore']);
      const valoreAlberoNum = parseFloat(String(valoreAlbero));
      if (isNaN(valoreNum) || isNaN(valoreAlberoNum)) {
        frasi.push(`Abbattimento ${typeInquinante}: ${valoreAlbero}`);
        continue;
      }

      const fattore = valoreNum !== 0 ? valoreAlberoNum / valoreNum : 1.0;

      let nuovaDip = row['dipendenza'] || '';
      const { num: dipNum, unit: dipUnit } = parseValore(nuovaDip);
      if (!isNaN(dipNum)) {
        const nuovoNum = Math.round(dipNum * fattore * 100) / 100;
        nuovaDip = `${nuovoNum} ${dipUnit}`.trim();
      }

      let frase = row['desc'] || row['description'] || '';
      frase = String(frase).replace(/^"|"$/g, '');
      frase = frase.replace(/\{\$valore\}/g, `${valoreAlberoNum} ${unitValore}`.trim());
      frase = frase.replace(/\{\$dipendenza\}/g, nuovaDip);
      frase = frase.replace(/\{\$tempo\}/g, row['tempo'] || '1 anno');

      frasi.push(frase);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`Errore in generatePollutionSentences(${typeInquinante}):`, err);
      frasi.push(`Abbattimento ${typeInquinante}: ${valoreAlbero}`);
    }
  }

  return frasi;
}

// =============================================
// METODO PER API (esportato)
// =============================================
export async function buildTreeContext(tree: UserTreeType, species: UserSpeciesType | null = null, variant = 'statico') {
  const { pollutionData, placeData, historicalData, weatherData } = await loadAsyncData(tree, species || undefined);

  // NOTA: qui passiamo gli argomenti nell'ordine coerente:
  // tree, species, pollutionData, placeData, weatherData, historicalData
  const ragStructure = await buildTreeStructure(tree, species || undefined, pollutionData, placeData, weatherData, historicalData);
  const context = buildContextString(ragStructure);

  // debug
  // eslint-disable-next-line no-console
  console.log(context);

  if (variant === 'statico') {
    return { ragStructure, id_spacevector: '' };
  }

  // =============================================
  // 🚀 Chiamata all’endpoint dello Space HuggingFace
  // =============================================
  let id = '';
  try {
    const response = await fetch('https://benny2199-rag-microservice.hf.space/initialize_space', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // eslint-disable-next-line no-console
      console.error('Errore backend RAG:', errorData.error || response.statusText);
      throw new Error(errorData.error || `Errore HTTP ${response.status}`);
    }

    const data = await response.json();
    id = data.index_id;
    if (!data.success && !data.documents) {
      throw new Error(data.error || 'Errore inizializzazione spazio vettoriale');
    }

    // eslint-disable-next-line no-console
    console.log('✅ Spazio vettoriale inizializzato');
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.log('❌ Errore durante la chiamata a initialize_space:');
    // eslint-disable-next-line no-console
    console.error('❌ Errore durante la chiamata a initialize_space:', err?.message || err);
  }

  // 🌿 Ritorna il contesto legacy per compatibilità
  return { ragStructure, id_spacevector: id };
}