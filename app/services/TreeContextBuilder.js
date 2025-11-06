/**
 * Genera una stringa di contesto testuale per un albero monumentale
 * con dati meteorologici e di qualità dell'aria
 */
import { weatherReflection } from './WeatherContextBuilder';

export async function buildTreeContext(tree, species = null, weatherData = null) {
    if (!tree) return "";

    try {
        let pollutionData = null;
        let placeData = null;
        let weatherContext = "";
        let treeReflectionPromise = null;

        // Avvia la generazione della riflessione dell'albero in parallelo se abbiamo le coordinate
        if (tree.lat && tree.lon) {
            try {
                // Importa dinamicamente per evitare dipendenze circolari
                treeReflectionPromise = weatherReflection(tree.lat, tree.lon);
            } catch (error) {
                console.warn('Impossibile caricare WeatherContextBuilder.js:', error);
            }
        }

        // Carica i dati degli inquinanti solo se necessario
        const hasPollutionData = species && (
            species.info_abbattimento_co2 ||
            species.info_abbattimento_no2 || 
            species.info_abbattimento_o3 ||
            species.info_abbattimento_pm10 ||
            species.info_abbattimento_so2
        );

        if (hasPollutionData) {
            try {
                const response = await fetch('/api/addDataset');
                if (response.ok) {
                    const rawData = await response.json();
                    
                    // Estrai l'array corretto in base alla struttura
                    if (Array.isArray(rawData) && rawData.length === 1 && Array.isArray(rawData[0])) {
                        pollutionData = rawData[0];
                    } else if (rawData && rawData.pollution && Array.isArray(rawData.pollution)) {
                        pollutionData = rawData.pollution;
                    } else {
                        pollutionData = rawData;
                    }
                }
            } catch (error) {
                console.warn('Impossibile caricare dati inquinanti:', error);
            }
        }

        // CARICA I DATI DEI LUOGHI (placeData) - SPOSTATO QUI PER ESSERE PIÙ EFFICIENTE
        try {
            const response = await fetch('/api/addDataset');
            if (response.ok) {
                const rawData = await response.json();
                console.log('Dati ricevuti dall\'API:', Object.keys(rawData));
                
                // Estrai l'array corretto per i luoghi
                if (rawData && rawData.locations && Array.isArray(rawData.locations)) {
                    placeData = rawData.locations;
                    console.log(`Caricati ${placeData.length} record di dati luoghi`);
                } else if (Array.isArray(rawData) && rawData.length === 2 && Array.isArray(rawData[1])) {
                    placeData = rawData[1];
                    console.log(`Caricati ${placeData.length} record di dati luoghi (formato array)`);
                } else {
                    console.warn('Struttura dati luoghi non riconosciuta:', Object.keys(rawData));
                }
            } else {
                console.warn('Errore nella risposta dell\'API:', response.status);
            }
        } catch (error) {
            console.warn('Impossibile caricare dati luoghi:', error);
        }

        // Genera contesto meteorologico se disponibile
        if (weatherData) {
            weatherContext = await generateWeatherContext(weatherData, tree);
        }

        // FUNZIONE generaFrase ORIGINALE CORRETTA
        const generaFrase = (df, typeInquinante, valoreAlbero) => {
    const mappaInquinanti = {
        "CO₂": "CO2",
        "NO₂": "NO2",
        "O₃": "O3",
        "SO₂": "SO2"
    };
    typeInquinante = mappaInquinanti[typeInquinante] || typeInquinante;

    // Estrai l'array interno se necessario
    let dataArray = Array.isArray(df) && Array.isArray(df[0]) ? df[0] :
                    (df.pollution && Array.isArray(df.pollution)) ? df.pollution :
                    (Array.isArray(df) ? df : null);

    if (!dataArray) return `Dati non disponibili per ${typeInquinante}`;

    // Filtra per inquinante
    const subset = dataArray.filter(item => item && item.inquinante === typeInquinante);
    if (subset.length === 0) return `Nessuna informazione per ${typeInquinante}`;

    // Scegli una riga casuale
    const row = subset[Math.floor(Math.random() * subset.length)];

    try {
        // --- Estrazione valori numerici e unità ---
        const parseValore = (str) => {
            const match = String(str).trim().match(/^([\d.,]+)\s*([a-zA-Zµμ²³%/]+)?$/);
            if (!match) return { num: NaN, unit: "" };
            return { num: parseFloat(match[1].replace(",", ".")), unit: match[2] || "" };
        };

        const { num: valoreNum, unit: unitValore } = parseValore(row.valore);
        const valoreAlberoNum = parseFloat(valoreAlbero);

        if (isNaN(valoreNum) || isNaN(valoreAlberoNum)) {
            return `Abbattimento ${typeInquinante}: ${valoreAlbero}`;
        }

        const fattore = valoreNum !== 0 ? valoreAlberoNum / valoreNum : 1.0;

        // --- Scala la dipendenza mantenendo unità ---
        let nuovaDip = row.dipendenza || "";
        const { num: dipNum, unit: dipUnit } = parseValore(nuovaDip);
        if (!isNaN(dipNum)) {
            const nuovoNum = Math.round(dipNum * fattore * 100) / 100;
            nuovaDip = `${nuovoNum} ${dipUnit}`.trim();
        }

        // --- Prepara la frase ---
        let frase = row.desc || "";
        frase = frase.replace(/^"|"$/g, ""); // rimuovi virgolette
        frase = frase.replace(/\{\$valore\}/g, `${valoreAlberoNum} ${unitValore}`.trim());
        frase = frase.replace(/\{\$dipendenza\}/g, nuovaDip);
        frase = frase.replace(/\{\$tempo\}/g, row.tempo || "1 anno");

        return frase;
    } catch (err) {
        console.warn(`Errore in generaFrase(${typeInquinante}):`, err);
        return `Abbattimento ${typeInquinante}: ${valoreAlbero}`;
    }
};


        // Costruisci il contesto
        const parts = ["DATI ALBERO:"];

        // 1. Identità e localizzazione
        parts.push(`- Nome: ${tree.soprannome || 'Non specificato'}`);
        
        // 2. Dimensioni e criteri
        const dimensioni = [];
        if (tree.altezza_m) dimensioni.push(`Altezza ${tree.altezza_m} metri`);
        if (tree.circonferenza_fusto_cm) dimensioni.push(`Circonferenza del fusto ${tree.circonferenza_fusto_cm} cm`);
        if (dimensioni.length > 0) {
            parts.push(`- Dimensioni: (${dimensioni.join(' e ')})`);
        }

        if (tree.criteri_monumentalita) {
            parts.push(`- Criteri di monumentalità: ${tree.criteri_monumentalita}`);
        }
    
        if (tree.desc) {
            parts.push(`- Descrizione: ${tree.desc}`);
        }

        // Aggiungi contesto meteorologico se disponibile
        if (weatherContext) {
            parts.push("\nCONTESTO METEOROLOGICO E AMBIENTALE:");
            parts.push(weatherContext);
        }

        parts.push("\nDATI SPECIE BOTANICHE:");
        const nomeSpecie = [];
        if(tree.specie_nome_volgare) nomeSpecie.push(tree.specie_nome_volgare); 
        if(tree.specie_nome_scientifico) nomeSpecie.push(tree.specie_nome_scientifico); 
        if (nomeSpecie.length > 0) {
            parts.push(`- Nome specie: ${nomeSpecie.join(', ')}`);
        }

        // 3. Dati botanici (se species è disponibile)
        if (species) {
            if (species.portamento) {
                parts.push(`- Portamento: ${species.portamento}`);
            }
            if (species.info_tipologia) {
                parts.push(`- Tipologia: ${species.info_tipologia}`);
            }

            // 4. Chioma, colori e fioritura
            const chioma = [];
            if (species.forma_chioma) chioma.push(`Forma: ${species.forma_chioma}`);
            if (species.info_densita_chioma) chioma.push(`Densità: ${species.info_densita_chioma}`);
            if (chioma.length > 0) {
                parts.push(`- Chioma: (${chioma.join(', ')})`);
            }

            const extra = [];
            if (species.info_colori_autunnali) extra.push(`Colori autunnali: ${species.info_colori_autunnali}`);
            if (species.info_frutti) extra.push(`Frutti: ${species.info_frutti}`);
            if (species.info_fioritura) {
                const epoca = species.epoca_di_fioritura;
                if (epoca) {
                    extra.push(`Fioritura: ${species.info_fioritura} (${epoca})`);
                } else {
                    extra.push(`Fioritura: ${species.info_fioritura}`);
                }
            }
            if (extra.length > 0) {
                parts.push(`- ${extra.join(', ')}`);
            }

            // 5. Habitat e dimensioni generiche
            if (species.habitat) {
                parts.push(`- Habitat: ${species.habitat}`);
            }

            const size = [];
            if (species.size_altezza) size.push(`Altezza: ${species.size_altezza}`);
            if (species.size_chioma) size.push(`Chioma: ${species.size_chioma}`);
            if (size.length > 0) {
                parts.push(`- Dimensioni (specie): (${size.join(', ')})`);
            }

            parts.push("\nDATI ECOLOGICI:");
            // 6. Dati sugli inquinanti con frasi dinamiche
            const inquinanti = {
                "CO₂": species.info_abbattimento_co2,
                "NO₂": species.info_abbattimento_no2,
                "O₃": species.info_abbattimento_o3,
                "PM10": species.info_abbattimento_pm10,
                "SO₂": species.info_abbattimento_so2,
            };

            const dettagliInquinanti = [];
            for (const [nome, valore] of Object.entries(inquinanti)) {
                if (valore) {
                    try {
                        let frasePrincipale = `Abbattimento ${nome}: ${valore}`;
                        if (nome === "CO₂") {
                            frasePrincipale += ` (${species.abbattimento_co2})`;
                        } else if (nome === "PM10") {
                            frasePrincipale += ` (${species.abbattimento_pm10})`;
                        }
                        const frasiExtra = [];
                        
                        // Genera frasi descrittive se disponibili i dati
                        if (pollutionData) {
                            // Genera 1-2 frasi casuali
                            const nFrasi = Math.random() > 0.5 ? 2 : 1;
                            for (let i = 0; i < nFrasi; i++) {
                                const frase = generaFrase(pollutionData, nome, valore);
                                if (frase && !frase.includes('Nessuna frase trovata')) {
                                    frasiExtra.push(frase);
                                }
                            }
                        }
                        
                        if (frasiExtra.length > 0) {
                            frasePrincipale += ` → ${frasiExtra.join(', ')}`;
                        }
                        
                        dettagliInquinanti.push(frasePrincipale);
                    } catch (error) {
                        console.warn(`Errore nel processare inquinante ${nome}:`, error);
                        dettagliInquinanti.push(`Abbattimento ${nome}: ${valore}`);
                    }
                }
            }

            if (dettagliInquinanti.length > 0) {
                parts.push(`-${dettagliInquinanti.join(' \n-')}`);
            }
        }

        parts.push("\nDATI LUOGO:");
        const luogoParts = [];
        if (tree.comune) luogoParts.push(tree.comune);
        if (tree.provincia) luogoParts.push(`(${tree.provincia})`);
        if (tree.regione) luogoParts.push(tree.regione);
        if (luogoParts.length > 0) {
            parts.push(`- Luogo: ${luogoParts.join(', ')}`);
        }

        // ============ AGGIUNGI QUI I DATI CULTURALI DA placeData ============
        if (placeData && Array.isArray(placeData) && tree.comune) {
            try {
                // Filtra i dati per il comune dell'albero (case insensitive)
                const datiComune = placeData.filter(item => 
                    item && item.comune && 
                    item.comune.toString().toLowerCase().trim() === tree.comune.toString().toLowerCase().trim()
                );

                if (datiComune.length > 0) {
                    
                    // Prendi il primo record corrispondente
                    const datoComune = datiComune[0];
                    // Aggiungi anche altri dati territoriali significativi
                    if (datoComune.num_residenti) {
                        parts.push(`- Popolazione: ${datoComune.num_residenti} abitanti`);
                    }
                    if (datoComune.superficie) {
                        parts.push(`- Superficie: ${datoComune.superficie} km²`);
                    }
                    
                    // Aggiungi i campi descrittivi, storici e culturali
                    if (datoComune.desc) {
                        parts.push(`- Descrizione territorio: ${datoComune.desc}`);
                    }
                    if (datoComune.storia) {
                        parts.push(`- Contesto storico: ${datoComune.storia}`);
                    }
                    if (datoComune.culturale) {
                        parts.push(`- Contesto culturale: ${datoComune.culturale}`);
                    }

                    console.log(`Dati culturali caricati per il comune: ${tree.comune}`);
                } else {
                    console.log(`Nessun dato trovato per il comune: ${tree.comune}`);
                    console.log('Comuni disponibili in placeData:', placeData.slice(0, 5).map(p => p.comune));
                }
            } catch (error) {
                console.warn('Errore nel processare dati culturali:', error);
            }
        } else {
            console.log('PlaceData non disponibile o comune mancante:', {
                hasPlaceData: !!placeData,
                isArray: Array.isArray(placeData),
                treeComune: tree.comune
            });
        }

        // ATTENDE E AGGIUNGE LA RIFLESSIONE DELL'ALBERO SE DISPONIBILE
        if (treeReflectionPromise) {
            try {
                const reflection = await treeReflectionPromise;
                if (reflection && !reflection.includes('❌ Errore')) {
                    parts.push("\nDATI SALUTE:");
                    if (tree.stato_salute) {
                        parts.push(`- Stato salute: ${tree.stato_salute}`);
                    }
                    parts.push(reflection);
                }
            } catch (error) {
                console.warn('Errore nel recuperare la riflessione dell\'albero:', error);
            }
        }

        if (tree.eta) {
            parts.push("\nDATI STORICI:");
            parts.push(`- Età: ${tree.eta}`);
        }

        
        const result = parts.join('\n');
        console.log('Contesto generato per l\'albero:\n', result);
        return result;

    } catch (error) {
        console.error('Errore nella costruzione del contesto:', error);
        return `Contesto base: ${tree.soprannome || 'Albero monumentale'}`;
    }
}

/**
 * Genera il contesto meteorologico in stile "AlberoSaggio"
 */
async function generateWeatherContext(weatherData, tree) {
    try {
        const { week, lastyear, tenyears } = weatherData;
        
        // Adatta la classe AlberoSaggio per JavaScript
        const albero = new AlberoSaggio(week, lastyear, tenyears, tree.soprannome || "Albero Monumentale");
        
        return albero.genera_riflessione_completa();
        
    } catch (error) {
        console.warn('Errore nella generazione del contesto meteorologico:', error);
        return "Dati meteorologici non disponibili";
    }
}

/**
 * Versione JavaScript della classe AlberoSaggio (semplificata)
 */
class AlberoSaggio {
    constructor(week_df, lastyear_df, tenyears_df, nome_albero = "Albero Antico", specie = "Quercia") {
        this.week = week_df;
        this.lastyear = lastyear_df;
        this.tenyears = tenyears_df;
        this.nome = nome_albero;
        this.specie = specie;
    }

    _analizza_settimana() {
        const stats = {
            temperature: {
                mean: this._safeMean(this.week.temperature_2m),
                max: this._safeMax(this.week.temperature_2m),
                min: this._safeMin(this.week.temperature_2m),
                std: this._safeStd(this.week.temperature_2m)
            },
            humidity: this._safeMean(this.week.relative_humidity_2m),
            precipitation: this._safeSum(this.week.precipitation),
            wind: {
                mean: this._safeMean(this.week.windspeed_10m),
                max: this._safeMax(this.week.windspeed_10m)
            },
            pressure: this._safeMean(this.week.pressure_msl),
            dewpoint: this._safeMean(this.week.dewpoint_2m)
        };

        stats.air_quality = this._analizza_qualita_aria_punteggio();
        stats.uv = this.week.uv_index ? this._safeMean(this.week.uv_index) : null;

        stats.escursione_termica = stats.temperature.max - stats.temperature.min;
        stats.diff_temp_rugiada = stats.temperature.mean - stats.dewpoint;

        return stats;
    }

    _analizza_decennio() {
        try {
            return {
                temp_mean: this._safeMean(this.tenyears.temperature_2m_mean),
                humidity: this._safeMean(this.tenyears.relative_humidity_2m_mean),
                precipitation: this._safeMean(this.tenyears.precipitation_sum),
            };
        } catch (error) {
            return {
                temp_mean: this._safeMean(this.tenyears.temperature_2m_mean),
                humidity: this._safeMean(this.tenyears.relative_humidity_2m_mean),
                precipitation: this._safeMean(this.tenyears.precipitation_sum),
            };
        }
    }

    _analizza_qualita_aria_punteggio() {
        const inquinanti = ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"];
        const inquinanti_disponibili = inquinanti.filter(col => this.week[col]);

        if (inquinanti_disponibili.length === 0) return null;

        let punteggio = 100;

        if (this.week.pm2_5) {
            const pm25 = this._safeMean(this.week.pm2_5);
            if (pm25 > 50) punteggio -= 25;
            else if (pm25 > 35) punteggio -= 20;
            else if (pm25 > 25) punteggio -= 15;
            else if (pm25 > 15) punteggio -= 10;
        }

        return Math.max(punteggio, 0);
    }

    _analizza_idratazione(stats_sett) {
        const p = stats_sett.precipitation;
        const h = stats_sett.humidity;
        if (p === 0 && h < 40) {
            return `🌵 Ho sete, non piove da ${this._calcola_giorni_senza_pioggia()} giorni e l'umidità è solo al ${h.toFixed(0)}%.`;
        }
        return `💧 Sto bene, l'umidità è al ${h.toFixed(0)}%.`;
    }

    _analizza_temperatura(stats_sett) {
        const t = stats_sett.temperature.mean;

        if (t > 35) return `🔥 Sto soffrendo il caldo, ${t.toFixed(1)}°C sono troppi per me.`;
        if (t < 0) return `❄️ Questo gelo mi fa male, ${t.toFixed(1)}°C sono pericolosi.`;
        
        return `🌤️ La temperatura di ${t.toFixed(1)}°C mi sta bene.`;
    }

    _analizza_qualita_aria(punteggio) {
        if (punteggio === null) return "🌬️ Non so com'è l'aria oggi.";
        if (punteggio > 80) return "🌬️ L'aria è buona oggi.";
        return "😷 L'aria non è delle migliori.";
    }

    genera_riflessione_completa() {
        const stats_sett = this._analizza_settimana();
        const stats_dec = this._analizza_decennio();

        const messaggi = [
            `• ${this._analizza_idratazione(stats_sett, stats_dec)}`,
            `• ${this._analizza_temperatura(stats_sett, stats_dec)}`,
            `• ${this._analizza_qualita_aria(stats_sett.air_quality)}`
        ];

        return `🌳 **Come sto oggi - ${this.nome}** 🌳\n\n${messaggi.join('\n')}\n\n_Con affetto, ${this.nome}_ 🌿`;
    }

    // Helper methods
    _safeMean(arr) {
        if (!arr || arr.length === 0) return 0;
        const sum = arr.reduce((a, b) => a + b, 0);
        return sum / arr.length;
    }

    _safeMax(arr) {
        if (!arr || arr.length === 0) return 0;
        return Math.max(...arr);
    }

    _safeMin(arr) {
        if (!arr || arr.length === 0) return 0;
        return Math.min(...arr);
    }

    _safeStd(arr) {
        if (!arr || arr.length === 0) return 0;
        const mean = this._safeMean(arr);
        const squareDiffs = arr.map(value => Math.pow(value - mean, 2));
        return Math.sqrt(this._safeMean(squareDiffs));
    }

    _safeSum(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0);
    }

    _calcola_giorni_senza_pioggia() {
        return 3;
    }
}