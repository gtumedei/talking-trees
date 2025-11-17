import { CSVRow } from "./types/interface_page";

// --- CONVERSIONI SICURE ---
const conversionTable: Record<string, Record<string, number>> = {
  "kg": { "g": 1000, "mg": 1_000_000 },
  "g": { "kg": 1/1000, "mg": 1000 },
  "mg": { "g": 1/1000, "kg": 1/1_000_000 },

  "km": { "m": 1000 },
  "m": { "km": 1/1000 },

  "h": { "min": 60, "s": 3600 },
  "min": { "h": 1/60, "s": 60 },
  "s": { "min": 1/60, "h": 1/3600 },

  "giornata": { "settimana": 1/7 },
  "settimana": { "giornata": 7 }
};


function convertUnit(value: number, from: string, to: string): number {
  if (from === to) return value;
  if (conversionTable[from]?.[to]) {
    return value * conversionTable[from][to];
  }
  if (conversionTable[to]?.[from]) { 
    return value / conversionTable[to][from];
  }
  return value; // conversione non sicura
}

// --- RIMOZIONE ZERI ---
function cleanNumber(n: number | string): string {
  return String(n).replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
}

// --- PARSE UNITÀ ---
function parseValueWithUnit(str: string): { value: number; unit: string } | null {
  const parts = str.trim().split(" ");
  if (parts.length < 2) return null;

  const num = parseFloat(parts[0].replace(",", "."));
  if (isNaN(num)) return null;

  return { value: num, unit: parts[1] };
}


// --- FUNZIONE PRINCIPALE ---
export function generaFraseTS(elemento: string, valoreAlbero: number, pollutionData?: CSVRow[] | null): string | null {

  const inquinante = elemento.replace('₂', '2').replace('₃', '3');
  console.log(`Inquinante:${inquinante} - Valore:${valoreAlbero}`)
  if(!pollutionData) return '';

  const subset = pollutionData.filter(row => String(row["inquinante"]) === inquinante);
  if (subset.length === 0) return null;

  // tenta più righe fino a trovarne una coerente
  const shuffled = [...subset].sort(() => Math.random() - 0.5);

  for (const row of shuffled) {
    const parsed = parseValueWithUnit(String(row["valore"] ?? ""));
    if (!parsed) continue;

    console.log(parsed)

    let { value: valoreRiga, unit: unitRiga } = parsed;

    // --- CONVERSIONE UNITA’ ---
    let valoreAlberoConverted = convertUnit(valoreAlbero, unitRiga, unitRiga);
    let sameUnit = true;

    if (unitRiga !== unitRiga) sameUnit = false;

    // se l’unità dell’albero è diversa, prova conversione
    if (!sameUnit) {
      const converted = convertUnit(valoreAlbero, unitRiga, unitRiga);
      if (converted == null || converted === 0) continue; // conversione non possibile
      valoreAlberoConverted = converted;
    }

    // --- Fattore di proporzione ---
    let fattore = valoreAlberoConverted / valoreRiga;
    if (!isFinite(fattore) || fattore <= 0) continue; // scarta se fattore non valido

    let dip = String(row["dipendenza"] ?? "");

    // trova e sostituisce il primo numero nella dipendenza
    const tokens = dip.split(" ");
    for (let token of tokens) {
      const normalized = token.replace(",", ".");
      const n = parseFloat(normalized);
      if (!isNaN(n)) {
        const nuovo = Math.max(0.01, Math.round(n * fattore * 100) / 100);
        dip = dip.replace(token, cleanNumber(nuovo));
        break;
      }
    }

    let frase = String(row["desc"] ?? "");

    frase = frase
      .replace("{$valore}", `${cleanNumber(valoreAlberoConverted)} ${unitRiga}`)
      .replace("{$dipendenza}", dip)
      .replace("{$tempo}", String(row["tempo"] ?? "1 anno"));

    return frase;
  }

  return null; // nessuna frase adatta trovata
}