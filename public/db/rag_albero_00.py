import subprocess
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import re
import time
import pandas as pd
import random
from datetime import datetime
import os

# ---- CONFIGURAZIONE ----
CONFIG = {
    "model_name": "llama3",
    "embedding_model": "all-MiniLM-L6-v2", 
    "chunk_size": 400,
    "max_chunks": 3,
    "timeout": 180,  # Timeout aumentato per debug
    "use_ollama": True
}

# ---- CARICAMENTO DATASET ----
def carica_dataset():
    """Carica i tre dataset necessari"""
    try:
        # Carica i dataset (modifica i nomi file secondo le tue esigenze)
        df_alberi = pd.read_csv('df.csv', sep="$")  # Modifica con il tuo file
        df_specie = pd.read_csv('df_specie.csv', sep="$")       # Modifica con il tuo file  
        df_history = pd.read_csv('df_event.csv')     # Modifica con il tuo file
        df_inquinanti = pd.read_csv('df_inquinanti.csv')      # Modifica con il tuo file
        
        print("✅ Dataset caricati correttamente")
        return df_alberi, df_specie, df_history, df_inquinanti
    except Exception as e:
        print(f"❌ Errore nel caricamento dataset: {e}")
        return None, None, None, None

def rimuovi_zeri(valore):
    try:
        # Converte in stringa e poi in float
        valore_str = str(valore)
        numero = float(valore_str)

        # Restituisce intero se possibile, altrimenti float
        return int(numero) if numero.is_integer() else numero

    except (ValueError, TypeError):
        #raise ValueError(f"Valore non valido: {valore!r}. Deve essere un numero o una stringa numerica.")
        return valore
        
        
def genera_frase(df, inquinante, valore_albero):
    # filtra dataset per inquinante
    subset = df[df["inquinante"] == inquinante].copy()
    if subset.empty:
        return f"Nessuna frase trovata per {inquinante}"

    # scegli una riga a caso
    row = subset.sample(1).iloc[0]

    # estrai valore numerico della riga
    try:
        valore_num = float(str(row["valore"]).split()[0])
        unità = str(row["valore"]).split()[1]
    except:
        return "Errore: valore non interpretabile"

    # calcola fattore di scala
    fattore = valore_albero / valore_num

    # adatta dipendenza (se numerica dentro la stringa)
    nuova_dip = row["dipendenza"]
    for token in row["dipendenza"].split():
        if token.replace(",",".").replace("h","").replace("min","").isdigit():
            # sostituisci il primo numero trovato
            try:
                num = float(token.replace(",","."))
                nuova_num = round(num * fattore, 2)
                nuova_dip = row["dipendenza"].replace(token, str(nuova_num), 1)
                break
            except:
                pass

    # ricostruisci frase
    valore_albero = rimuovi_zeri(valore_albero)
    nuova_dip = rimuovi_zeri(nuova_dip)
    frase = row["desc"]
    frase = frase.replace("{$valore}", f"{valore_albero} {unità}")
    frase = frase.replace("{$dipendenza}", nuova_dip)
    frase = frase.replace("{$tempo}", "1 anno")

    return frase

def formatta_lista_congiunzioni(voci, char_space=", ", usa_maiuscola=True, congiunzione=" e "):
    """
    Restituisce una stringa con gli elementi della lista formattati correttamente.

    Parametri:
    - voci: lista di stringhe
    - char_space: stringa usata per separare gli elementi (default: ", ")
    - usa_maiuscola: se True, la prima lettera del primo elemento sarà maiuscola (default: True)
    - congiunzione: stringa usata tra gli ultimi due elementi (default: "e ")

    Esempi:
    - ["pane", "burro", "marmellata"] → "Pane, burro e marmellata"
    - ["milano", "roma"] → "Milano e roma"
    """
    if not voci:
        return ""

    # Copia la lista per evitare effetti collaterali
    voci = voci[:]

    # Eventuale capitalizzazione del primo elemento
    if usa_maiuscola and voci[0]:
        voci[0] = voci[0][0].upper() + voci[0][1:]

    # Formattazione in base al numero di elementi
    if len(voci) == 1:
        return voci[0]
    elif len(voci) == 2:
        return congiunzione.join(voci)
    else:
        return char_space.join(voci[:-1]) + char_space.strip() + " " + congiunzione + voci[-1]

def filtra_eventi(df, intervallo_anni, categorie=['storico', 'artistico', 'culturale', 'scientifico', 'tecnologico', 'sportivo']):
    """
    Filtra un DataFrame di eventi in base alle categorie, a un intervallo temporale
    e seleziona un evento ogni 10 anni.

    Parametri:
    - df: DataFrame contenente le colonne ['year', 'text', 'category']
    - categorie: lista di categorie da mantenere (es. ['politica', 'scienza'])
    - intervallo_anni: numero di anni da oggi da considerare (es. 80)

    Ritorna:
    - DataFrame filtrato con un evento ogni 10 anni nell'intervallo specificato
    """
    anno_corrente = datetime.now().year
    anno_inizio = anno_corrente - intervallo_anni
    anno_fine = anno_corrente

    # Filtro per categoria e intervallo temporale
    df_filtrato = df[
        (df['category'].isin(categorie)) &
        (df['year'] >= anno_inizio) &
        (df['year'] <= anno_fine)
    ]

    # Seleziona un evento ogni 10 anni
    eventi_selezionati = []

    for inizio_decennio in range(anno_inizio, anno_fine, 10):
        fine_decennio = inizio_decennio + 10
        decennio_df = df_filtrato[
            (df_filtrato['year'] >= inizio_decennio) &
            (df_filtrato['year'] < fine_decennio)
        ]
        if not decennio_df.empty:
            eventi_selezionati.append(decennio_df.sample(1))  # Scegli 1 evento casuale

    # Combina tutti gli eventi selezionati in un nuovo DataFrame
    return pd.concat(eventi_selezionati).sort_values('year').reset_index(drop=True)

def crea_contesto_discorsivo(albero, specie_df, inquinanti_df, df_history):
    parti = []

    # --- Intro con localizzazione ---
    intro = []
    intro.append(f"INFORMAZIONI ALBERO\n")
    if pd.notna(albero.get("soprannome")):
        intro.append(f"'{albero['soprannome']}'")
    else:
        intro.append("L'albero")

    # --- Posizione ---
    loc_parts = []
    if pd.notna(albero.get("regione")):
      loc_parts.append(f" - regione {albero['regione']}")
    if pd.notna(albero.get("località")):
      loc_parts.append(f"a {albero['località']},")
    if pd.notna(albero.get("comune")):
      loc_parts.append(f"comune di {albero['comune']}")
    if pd.notna(albero.get("provincia")):
      loc_parts.append(f"in provincia di {albero['provincia']},")
    if pd.notna(albero.get("lat")) and pd.notna(albero.get("lon")):
      loc_parts.append(f"coordinate (latitudine {albero['lat']:.3f}, longitudine {albero['lon']:.3f})")
    if pd.notna(albero.get("altitudine (m s.l.m.)")):
      loc_parts.append(f"altitudine {albero['altitudine (m s.l.m.)']} metri sul livello del mare")
    if loc_parts:
        intro.append(" si trova" + formatta_lista_congiunzioni(loc_parts, " ",  usa_maiuscola=False))
    parti.append("".join(intro) + ".\n")

    # --- Caratteristiche fisiche ---
    caratteristiche = []
    if pd.notna(albero.get("eta")):
        eta_str = str(albero.get("eta"))
        if "(stima" in eta_str:
            eta_str = str(albero.get("eta_descrizione"))
            eta_str = eta_str.replace("(stima", "basato su una stima")
            eta_str = eta_str.split("(fonte")[0].replace(")", "").strip()
            caratteristiche.append(f"ha un'età di {eta_str}")
        else:
            eta_str = eta_str.replace("≈", "circa ")
            caratteristiche.append(f"ha un'età di {eta_str}")
    if pd.notna(albero.get("altezza (m)")):
        caratteristiche.append(f"raggiunge un'altezza di {albero['altezza (m)']} metri")
    if pd.notna(albero.get("circonferenza fusto (cm)")):
        caratteristiche.append(f"una circonferenza del tronco di {albero['circonferenza fusto (cm)']} cm")
    if caratteristiche:
        parti.append(formatta_lista_congiunzioni(caratteristiche) + ".\n")

    if pd.notna(albero.get("criteri di monumentalità")):
        parti.append(f"È stato inserito nell'elenco degli alberi monumentali per i seguenti criteri: {albero['criteri di monumentalità']}.\n")

    # --- Descrizioni testuali ---
    desc = []
    for col in ["desc", "new_desc"]:
      if pd.notna(albero.get(col)):
          desc.append(str(albero[col]))
    if len(desc) != 0:
      parti.append(f"Informazioni aggiuntive: {formatta_lista_congiunzioni(desc)}\n")

    if pd.notna(albero.get("place")):
      loc_parts.append(f"Nei suoi pressi si trovo luoghi significativi come {albero['place']}.\n")

    # --- Eventi storici/culturali ---
    if pd.notna(albero.get('eta')):
      val = float(re.search(r'\d+', albero['eta']).group())
      eventi_df = filtra_eventi(df_history, int(val))
      eventi_testi = [f"nel {row['year']} {row['text']} (importante dal punto di vista {row['category']}),"
                      for _, row in eventi_df.iterrows() if pd.notna(row["year"]) and pd.notna(row["text"])]
      if eventi_testi:
          parti.append("Eventi accaduti in italia durante la vita dell'albero: " +formatta_lista_congiunzioni(eventi_testi, char_space=' ') + ".\n")


    # --- INFO SPECIE (se disponibile) ---
    if pd.notna(albero.get("index_specie")):
        specie = specie_df.loc[specie_df.index == albero["index_specie"]]
        if not specie.empty:
            s = specie.iloc[0]
            specie_txt = []
            specie_txt.append("\nINFORMAZIONI SPECIE\n")

            # Nome scientifico e volgare
            if pd.notna(albero.get("specie nome volgare")) and pd.notna(albero.get("specie nome scientifico")):
                specie_txt.append(f"Appartiene alla specie {albero['specie nome volgare']} ({albero['specie nome scientifico']})")
            elif pd.notna(albero.get("specie nome volgare")):
                specie_txt.append(f"Appartiene alla specie {albero['specie nome volgare']}")
            elif pd.notna(albero.get("specie nome scientifico")):
                specie_txt.append(f"Appartiene alla specie {albero['specie nome scientifico']}")

            # Famiglia e genere
            famiglia_genere = []
            if pd.notna(s.get("nome_famiglia")):
                famiglia_genere.append(f"della famiglia {s['nome_famiglia']}")
            if pd.notna(s.get("nome_genere")):
                famiglia_genere.append(f"del genere {s['nome_genere']}")
            if famiglia_genere:
                specie_txt.append(" ".join(famiglia_genere) + ".\n")

            # Info descrizione specie
            desc = []
            if pd.notna(s.get("info_descrizione")):
                desc.append(f"Descrizione della specie: {s['info_descrizione']}.\n")

            #Caratteristiche
            altre = []
            if pd.notna(s.get("info_tipologia")):
                tipologia = str(s["info_tipologia"]).strip().lower()
                altre.append(tipologia)
                if tipologia == "sempreverde":
                    altre.append("(strategia di gestione del fogliame dell'albero che mantiene le foglie tutto l'anno, perdendole e sostituendole gradualmente)")
                elif tipologia == "decidua":
                    altre.append("(strategia di gestione del fogliame dell'albero che perde tutte le foglie durante la stagione sfavorevole, di solito inverno o stagione secca per poi rinnovare la chioma)")
            if pd.notna(s.get("info_portamento")):
                altre.append(f"dal portamento {s['info_portamento'].lower()}")
            if pd.notna(s.get("info_forma_chioma")):
                altre.append(f"con chioma {s['info_forma_chioma'].lower()}")
            if altre:
                specie_txt.append(f"Si tratta di una specie {formatta_lista_congiunzioni(altre, char_space=' ', usa_maiuscola=False)}.\n")

            # Dimensioni tipiche
            dimensioni = []
            if pd.notna(s.get("size_altezza")):
                dimensioni.append(f"altezza media di {s['size_altezza']} metri")
            if pd.notna(s.get("size_altezza_max")):
                dimensioni.append(f"altezza massima di {s['size_altezza_max']} metri")
            if dimensioni:
                specie_txt.append("Questa specie ha " + formatta_lista_congiunzioni(dimensioni, char_space=" ", usa_maiuscola=False) + ",")
            dimensioni = []
            if pd.notna(s.get("size_chioma")):
                dimensioni.append(f"{s['size_chioma'].lower().replace('(','(con dimensioni di ').replace('m)', ' metri)')}")
            if pd.notna(s.get("info_densita_chioma")):
                dimensioni.append(f"e {s['info_densita_chioma'].lower()}")
            if dimensioni:
                specie_txt.append("mentre la chioma è " + " ".join(dimensioni) + ".\n")

            # Habitat
            if pd.notna(s.get("habitat")):
                habitat_lista = [item.strip() for item in s["habitat"].lower().split(", ") if item.strip()]
                if len(habitat_lista) == 1:
                  specie_txt.append(f"L’habitat tipico è {s['habitat']}.\n")
                else:
                  specie_txt.append(f"Gli habitat tipici sono {formatta_lista_congiunzioni(habitat_lista, char_space=', ', usa_maiuscola=False)}.\n")

            # Caratteristiche stagionali
            stagionali = []
            if pd.notna(s.get("info_stagione_fioritura")) or pd.notna(s.get("info_fioritura")):
                frase_fioritura = "la fioritura tipicamente avviene"
                if pd.notna(s.get("info_stagione_fioritura")):
                    frase_fioritura += f" a {s['info_stagione_fioritura'].lower()}"
                if pd.notna(s.get("info_fioritura")):
                    frase_fioritura += f" ed è {s['info_fioritura'].lower()}"
                stagionali.append(frase_fioritura + ".")
            if pd.notna(s.get("info_frutti")):
                stagionali.append(f"In seguito alla fioritura l'albero produce {s['info_frutti']}")
            if pd.notna(s.get("info_colori_autunnali")):
                autounno_intro = ", mentre nella stagione autunnale il fogliame"
                if s['info_colori_autunnali']=="Sempreverde":
                   stagionali.append(f"{autounno_intro} rimane invariato inquanto è una pianta {s['info_colori_autunnali']}")
                else:
                  stagionali.append(f"{autounno_intro} il fogliame si tinge di {s['info_colori_autunnali']}")
            if stagionali:
                specie_txt.append("Caratteristiche stagionali: " + " ".join(stagionali)+ ".\n")

            specie_txt.append("\nINFORMAZIONI ECOLOGICHE")
            # --- Inquinanti ---
            for inq, col_val, nome_completo in [
                ("CO2", "info_abbattimento_co2", "anidride carbonica (CO₂)"),
                ("PM10", "info_abbattimento_pm10", "polveri sottili (PM10)"),
                ("O3", "info_abbattimento_o3", "ozono (O3)"),
                ("NO2", "info_abbattimento_no2", "biossido di azoto (NO₂)"),
                ("SO2", "info_abbattimento_so2", "biossido di zolfo (SO₂)")
            ]:
                if pd.notna(s.get(col_val)):
                    try:
                        valore = float(s[col_val])
                        frasi = []
                        num_frasi = random.randint(1, 3)
                        for _ in range(num_frasi):
                            frase = genera_frase(inquinanti_df, inq, valore)
                            frasi.append(frase)
                        frase_finale = " o ".join(frasi)
                        
                        # Nuovo formato dell'output
                        valore = rimuovi_zeri(valore)
                        output_line = f"\n-In 1 anno compenso {valore} kg di {nome_completo} ({frase_finale})"
                        specie_txt.append(output_line)
                    except:
                        pass
        parti.append(" ".join(specie_txt))
    return "".join(parti)

# ---- SISTEMA CHATBOT MIGLIORATO ----
class ChatbotAlberoMonumentale:
    def __init__(self, df_alberi, df_specie, df_history, df_inquinanti):
        self.df_alberi = df_alberi
        self.df_specie = df_specie
        self.df_history = df_history
        self.df_inquinanti = df_inquinanti
        self.albero_corrente = None
        self.descrizione_corrente = ""
        
        # Inizializza sistemi
        self.embedder = SentenceTransformer(CONFIG["embedding_model"])
        self.indice = None
        self.chunks = []
        
        self.llm_disponibile = self._verifica_ollama()
    
    def _verifica_ollama(self):
        """Verifica se Ollama è disponibile"""
        try:
            result = subprocess.run(
                ["ollama", "list"], 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            if result.returncode == 0 and CONFIG["model_name"] in result.stdout:
                print("✅ LLM disponibile")
                return True
        except:
            pass
        
        print("⚠ LLM non disponibile - usando risposte intelligenti")
        return False
    
    def seleziona_albero_casuale(self):
        """Seleziona un albero casuale dal dataset"""
        #random_index = random.randint(0, len(self.df_alberi) - 1)
        random_index = 4253 #Salice bianco 15m
        print(f"🌳 Albero selezionato: indice {random_index}")
        self.albero_corrente = self.df_alberi.iloc[random_index]
        
        # Genera la descrizione usando la tua funzione
        self.descrizione_corrente = crea_contesto_discorsivo(
            self.albero_corrente, 
            self.df_specie, 
            self.df_inquinanti, 
            self.df_history
        )
        
        # Crea l'indice RAG
        self._crea_indice_rag()
        
        return self.albero_corrente
    
    def _crea_indice_rag(self):
        """Crea l'indice FAISS per la ricerca semantica"""
        print("🔄 Creazione indice RAG...")
        
        # Crea chunks intelligenti
        self.chunks = self._crea_chunks_strutturati(self.descrizione_corrente)
        
        if not self.chunks:
            print("⚠ Nessun chunk creato")
            return
        
        # Crea embeddings e indice
        embeddings = self.embedder.encode(self.chunks, convert_to_numpy=True)
        dimension = embeddings.shape[1]
        self.indice = faiss.IndexFlatL2(dimension)
        self.indice.add(embeddings.astype('float32'))
        
        print(f"✅ Indice RAG creato con {len(self.chunks)} chunk")
    
    def _crea_chunks_strutturati(self, testo):
        """Crea chunks preservando la struttura logica"""
        chunks = []
        
        # Prima estrai informazioni chiave per chunks mirati
        info_chiave = self._estrai_info_chiave(testo)
        chunks.extend(info_chiave)
        
        # Poi dividi in sezioni
        sezioni = re.split(r'\n\s*\n', testo)
        
        for sezione in sezioni:
            sezione = sezione.strip()
            if not sezione or len(sezione) < 10:
                continue
                
            # Se la sezione è piccola, usala intera
            if len(sezione) <= CONFIG["chunk_size"]:
                chunks.append(sezione)
            else:
                # Dividi in paragrafi più piccoli
                righe = [r.strip() for r in sezione.split('\n') if r.strip()]
                chunk_corrente = ""
                
                for riga in righe:
                    if len(chunk_corrente) + len(riga) <= CONFIG["chunk_size"]:
                        if chunk_corrente:
                            chunk_corrente += "\n" + riga
                        else:
                            chunk_corrente = riga
                    else:
                        if chunk_corrente:
                            chunks.append(chunk_corrente)
                        chunk_corrente = riga
                
                if chunk_corrente:
                    chunks.append(chunk_corrente)
        
        # Rimuovi duplicati
        chunks_unici = []
        for chunk in chunks:
            if chunk not in chunks_unici:
                chunks_unici.append(chunk)
        
        print(f"Creati {len(chunks_unici)} chunks unici")
        return chunks_unici
    
    def _estrai_info_chiave(self, testo):
        """Estrae informazioni chiave per chunks mirati"""
        chunks_chiave = []
        
        # Nome e identità
        nome_match = re.search(r"INFORMAZIONI ALBERO\s*(.*?)(?=\n|$)", testo, re.DOTALL)
        if nome_match:
            intro = nome_match.group(1).strip()
            if intro and len(intro) > 10:
                chunks_chiave.append(f"IDENTITÀ: {intro}")
        
        # Criteri di monumentalità - ESTRAZIONE MIGLIORATA
        criteri_match = re.search(r"criteri di monumentalità[:\s]*(.*?)(?=\n|\.)", testo, re.IGNORECASE)
        if criteri_match:
            criteri = criteri_match.group(1).strip()
            # Pulisci e formatta i criteri
            criteri_puliti = criteri.replace("`", "'").replace("  ", " ").strip()
            chunks_chiave.append(f"CRITERI MONUMENTALITÀ: {criteri_puliti}")
        
        # Età - ESTRAZIONE MIGLIORATA
        eta_match = re.search(r"(\d+)\s+anni", testo)
        if eta_match:
            chunks_chiave.append(f"ETÀ: {eta_match.group(1)} anni")
        else:
            # Cerca anche nella descrizione età
            eta_desc_match = re.search(r"età di[:\s]*([^.\n]+)", testo, re.IGNORECASE)
            if eta_desc_match:
                chunks_chiave.append(f"ETÀ: {eta_desc_match.group(1).strip()}")
        
        # Altezza
        altezza_match = re.search(r"(\d+[,.]?\d*)\s+metri", testo)
        if altezza_match:
            chunks_chiave.append(f"ALTEZZA: {altezza_match.group(1)} metri")
        
        # Circonferenza
        circonferenza_match = re.search(r"circonferenza.*?(\d+[\d\-]*)\s*cm", testo, re.IGNORECASE)
        if circonferenza_match:
            chunks_chiave.append(f"CIRCONFERENZA: {circonferenza_match.group(1)} cm")
        
        # Specie
        specie_match = re.search(r"Appartiene alla specie\s*(.*?)(?=\n|\.)", testo)
        if specie_match:
            chunks_chiave.append(f"SPECIE: {specie_match.group(1)}")
        
        # Posizione
        pos_match = re.search(r"si trova\s*(.*?)(?=\n|\.)", testo)
        if pos_match:
            chunks_chiave.append(f"POSIZIONE: {pos_match.group(1)}")
        
        return chunks_chiave
        
    def cerca_informazioni(self, domanda, k=3):
        """Cerca informazioni rilevanti per la domanda"""
        try:
            if self.indice is None or not self.chunks:
                return []
            
            domanda_embedding = self.embedder.encode([domanda]).astype('float32')
            k = min(k, len(self.chunks))
            distanze, indici = self.indice.search(domanda_embedding, k)
            
            risultati = []
            for idx in indici[0]:
                if idx < len(self.chunks):
                    risultati.append(self.chunks[idx])
            
            return risultati
            
        except Exception as e:
            print(f"❌ Errore ricerca RAG: {e}")
            return []
    
    def _chiedi_llm(self, domanda, contesto):
        """Interroga l'LLM con il contesto"""
        if not self.llm_disponibile or not CONFIG["use_ollama"]:
            return None
        
        prompt = self._crea_prompt_llm(domanda, contesto)
        
        try:
            print("🔄 Interrogazione LLM...")
            start_time = time.time()
            
            result = subprocess.run(
                ["ollama", "run", CONFIG["model_name"]],
                input=prompt.encode("utf-8"),
                capture_output=True,
                timeout=CONFIG["timeout"]
            )
            
            if result.returncode == 0:
                risposta = result.stdout.decode("utf-8").strip()
                tempo = time.time() - start_time
                print(f"✅ LLM risposto in {tempo:.1f}s")
                return self._pulisci_risposta(risposta)
            else:
                print(f"❌ Errore LLM: {result.stderr.decode('utf-8')}")
                
        except subprocess.TimeoutExpired:
            print("⏰ Timeout LLM - risposta troppo lenta")
        except Exception as e:
            print(f"❌ Errore LLM: {e}")
        
        return None
    
    def _crea_prompt_llm(self, domanda, contesto):
        """Crea il prompt per l'LLM"""
        nome = self.albero_corrente.get('soprannome', self.albero_corrente.get('specie nome volgare', 'Albero monumentale'))
        
        return f"""Sei {nome}, un vecchio albero monumentale. Rispondi in PRIMA PERSONA in modo saggio e gentile.
IMPORTANTE: Usa SOLO le informazioni fornite nel contesto, non inventare numeri o dettagli non presenti
CONTESTO:
{contesto}

DOMANDA: {domanda}

RISPOSTA BREVE E PRECISA:"""
    
    def _pulisci_risposta(self, risposta):
        """Pulisce la risposta LLM"""
        if not risposta:
            return None
            
        # Rimuovi prefissi comuni
        prefissi = ["Risposta:", "L'albero:", "Albero:", "Io ", "Io, "]
        for prefisso in prefissi:
            if risposta.startswith(prefisso):
                risposta = risposta[len(prefisso):].strip()
        
        return risposta
    
    def genera_risposta_intelligente(self, domanda):
        """Genera una risposta intelligente usando RAG + fallback"""
        print(f"[DEBUG] Domanda: '{domanda}'")
        
        # 1. Cerca informazioni rilevanti
        risultati_rag = self.cerca_informazioni(domanda, k=CONFIG["max_chunks"])
        contesto = "\n".join(risultati_rag) if risultati_rag else ""
        
        if risultati_rag:
            print(f"[RAG] Trovati {len(risultati_rag)} risultati:")
            for i, risultato in enumerate(risultati_rag):
                print(f"      {i+1}: {risultato[:80]}...")
        
        # 2. Prova con LLM se abbiamo contesto
        if contesto and CONFIG["use_ollama"]:
            risposta_llm = self._chiedi_llm(domanda, contesto)
            if risposta_llm:
                return risposta_llm
        
        # 3. Risposta di fallback basata sulla domanda
        return self._risposta_di_fallback(domanda, risultati_rag)
    
    def _risposta_di_fallback(self, domanda, risultati_rag):
        """Genera risposta di fallback intelligente"""
        domanda_lower = domanda.lower()
        
        # Mappa domande comuni a risposte specifiche
        if any(term in domanda_lower for term in ["come ti chiami", "nome", "chi sei"]):
            nome = self.albero_corrente.get('soprannome', self.albero_corrente.get('specie nome volgare', 'un albero monumentale'))
            return f"Sono {nome}, custode silenzioso di queste terre."
        
        elif any(term in domanda_lower for term in ["età", "anni", "vecchio"]):
            eta = self.albero_corrente.get('eta', 'molti')
            return f"Conto {eta} primavere, testimone del tempo che scorre."
        
        elif any(term in domanda_lower for term in ["alto", "altezza"]):
            altezza = self.albero_corrente.get('altezza (m)', 'molti')
            return f"Mi elevo per {altezza} metri verso il cielo."
        
        elif any(term in domanda_lower for term in ["specie", "tipo"]):
            specie = self.albero_corrente.get('specie nome volgare', 'una specie antica')
            return f"Sono un {specie}, legato profondamente a questa terra."
        
        elif any(term in domanda_lower for term in ["dove", "posizione"]):
            comune = self.albero_corrente.get('comune', 'questo luogo')
            return f"Le mie radici affondano nel comune di {comune}."
        
        # Se abbiamo risultati RAG ma LLM non ha funzionato
        if risultati_rag:
            primo_risultato = risultati_rag[0]
            # Cerca di estrarre una risposta più pertinente
            if "IDENTITÀ:" in primo_risultato:
                return primo_risultato.replace("IDENTITÀ: ", "Sono ")
            elif any(keyword in primo_risultato for keyword in ["anni", "metri", "specie"]):
                return f"Dalle mie memorie: {primo_risultato[:100]}..."
        
        # Risposta generica ma poetica
        return "Le mie foglie sussurrano storie antiche... forse puoi chiedermi del mio nome, della mia età o della mia specie?"
    
    def stampa_info_albero(self):
        """Stampa le informazioni dell'albero corrente per debug"""
        if self.albero_corrente is None:
            print("❌ Nessun albero caricato")
            return
        
        print("\n" + "="*60)
        print("🌳 INFORMAZIONI ALBERO CORRENTE")
        print("="*60)
        
        # Informazioni base
        if pd.notna(self.albero_corrente.get('soprannome')):
            print(f"Nome: {self.albero_corrente['soprannome']}")
        if pd.notna(self.albero_corrente.get('specie nome volgare')):
            print(f"Specie: {self.albero_corrente['specie nome volgare']}")
        if pd.notna(self.albero_corrente.get('eta')):
            print(f"Età: {self.albero_corrente['eta']}")
        if pd.notna(self.albero_corrente.get('altezza (m)')):
            print(f"Altezza: {self.albero_corrente['altezza (m)']} m")
        if pd.notna(self.albero_corrente.get('comune')):
            print(f"Comune: {self.albero_corrente['comune']}")
        if pd.notna(self.albero_corrente.get('provincia')):
            print(f"Provincia: {self.albero_corrente['provincia']}")
        
        print(f"\nDescrizione generata ({len(self.descrizione_corrente)} caratteri):")
        print("-" * 40)
        print(self.descrizione_corrente)
        print("="*60)

# ---- INTERFACCIA UTENTE ----
def main():
    # Carica dataset
    print("🚀 Caricamento dataset...")
    df_alberi, df_specie, df_history, df_inquinanti = carica_dataset()
    
    if df_alberi is None:
        print("❌ Impossibile procedere senza dataset")
        return
    
    # Inizializza chatbot
    chatbot = ChatbotAlberoMonumentale(df_alberi, df_specie, df_history, df_inquinanti)
    
    # Seleziona albero casuale
    print("\n🎲 Selezione albero casuale...")
    albero_selezionato = chatbot.seleziona_albero_casuale()
    
    # Stampa informazioni per debug
    chatbot.stampa_info_albero()
    
    print("\n💡 Parla con l'albero! Chiedi del suo nome, età, specie, posizione...")
    print("   (scrivi 'esci' per terminare, 'cambia' per nuovo albero)\n")
    
    while True:
        try:
            domanda = input("Tu: ").strip()
            if not domanda:
                continue
            
            if domanda.lower() in ['esci', 'exit', 'quit']:
                print("\n🌳 Arrivederci! Che i venti ti portino lontano.")
                break
            
            if domanda.lower() == 'cambia':
                print("\n🔄 Selezione nuovo albero casuale...")
                chatbot.seleziona_albero_casuale()
                chatbot.stampa_info_albero()
                print("\n💡 Nuovo albero pronto! Fai la tua domanda...\n")
                continue
            
            if domanda.lower() == 'info':
                chatbot.stampa_info_albero()
                continue
            
            print("🌳 ", end="", flush=True)
            start_time = time.time()
            
            risposta = chatbot.genera_risposta_intelligente(domanda)
            
            tempo_risposta = time.time() - start_time
            print(f"Albero: {risposta}")
            print(f"[{tempo_risposta:.1f}s]\n")
            
        except KeyboardInterrupt:
            print("\n\n🌳 Un improvviso silenzio... arrivederci.")
            break
        except Exception as e:
            print(f"\n🌳 Errore: {e}")

if __name__ == "__main__":
    main()