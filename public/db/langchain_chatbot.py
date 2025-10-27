import subprocess
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import re
import time
import pandas as pd
import random
from datetime import datetime, timedelta
import os
import requests
from typing import Dict, List, Optional
import json

# ---- LANGCHAIN IMPORTS ----
from langchain.schema import Document
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.schema import BaseRetriever
from langchain.callbacks.manager import CallbackManagerForRetrieverRun
from langchain.chains import LLMChain
from langchain.schema import Document

# ---- CONFIGURAZIONE ----
CONFIG = {
    "model_name": "llama3",
    "embedding_model": "all-MiniLM-L6-v2", 
    "chunk_size": 400,
    "max_chunks": 3,
    "timeout": 180,
    "use_ollama": True
}

# ---- SERVIZI WEB PER DATI TERRITORIO ----
class ServizioDatiTerritorio:
    """Classe per raccogliere dati territoriali via web"""
    
    def __init__(self):
        self.base_urls = {
            "comuni": "https://comuni-ita.vercel.app/api/comuni",
            "province": "https://comuni-ita.vercel.app/api/province",
            "regioni": "https://comuni-ita.vercel.app/api/regioni"
        }
    
    def ottieni_dati_comune(self, nome_comune: str) -> Optional[Dict]:
        """Ottiene dati di un comune italiano"""
        try:
            response = requests.get(f"{self.base_urls['comuni']}/{nome_comune.upper()}")
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"❌ Errore nel recupero dati comune {nome_comune}: {e}")
        
        risultato = self._dati_default_comune(nome_comune)
        print(f"\n\n🎯 {risultato}\n\n")
        return risultato
    
    def ottieni_dati_provincia(self, nome_provincia: str) -> Optional[Dict]:
        """Ottiene dati di una provincia italiana"""
        try:
            response = requests.get(f"{self.base_urls['province']}/{nome_provincia.upper()}")
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"❌ Errore nel recupero dati provincia {nome_provincia}: {e}")
        
        risultato = self._dati_default_provincia(nome_provincia)
        print(f"\n\n🎯 {risultato}\n\n")
        return risultato
    
    def _dati_default_comune(self, nome_comune: str) -> Dict:
        """Dati default per un comune"""
        return {
            "nome": nome_comune,
            "regione": "Non disponibile",
            "provincia": "Non disponibile",
            "popolazione": "Dati non disponibili",
            "superficie": "Dati non disponibili",
            "altitudine": "Dati non disponibili"
        }
    
    def _dati_default_provincia(self, nome_provincia: str) -> Dict:
        """Dati default per una provincia"""
        return {
            "nome": nome_provincia,
            "regione": "Non disponibile",
            "numero_comuni": "Dati non disponibili",
            "sigla": nome_provincia[:3].upper()
        }

# ---- SERVIZIO DATI METEO E CLIMATICI ----
class ServizioDatiMeteoClimatici:
    """Classe per gestire dati meteo e climatici con approccio educativo"""
    
    def __init__(self):
        # Dati climatici storici simulati per diverse regioni italiane
        self.tendenze_climatiche = {
            "nord": {
                "aumento_temperatura": "1.5°C negli ultimi 30 anni",
                "diminuzione_precipitazioni": "10% nelle precipitazioni estive",
                "eventi_estremi": "aumento del 25% di eventi di forte intensità",
                "stagioni_calde": "estati più lunghe di 2 settimane"
            },
            "centro": {
                "aumento_temperatura": "1.8°C negli ultimi 30 anni", 
                "diminuzione_precipitazioni": "8% nelle precipitazioni annuali",
                "eventi_estremi": "aumento del 30% di bombe d'acqua",
                "stagioni_calde": "primavere anticipate di 10 giorni"
            },
            "sud": {
                "aumento_temperatura": "2.0°C negli ultimi 30 anni",
                "diminuzione_precipitazioni": "15% nelle precipitazioni invernali",
                "eventi_estremi": "ondate di calore più frequenti e intense",
                "stagioni_calde": "periodi di siccità più lunghi"
            }
        }
        
        # Condizioni meteo attuali simulate
        self.condizioni_attuali = {}
    
    def determina_regione_climatica(self, regione: str) -> str:
        """Determina la regione climatica in base alla regione geografica"""
        regioni_nord = ["piemonte", "valle d'aosta", "lombardia", "trentino-alto adige", 
                       "veneto", "friuli-venezia giulia", "liguria", "emilia-romagna"]
        regioni_centro = ["toscana", "umbria", "marche", "lazio"]
        regioni_sud = ["abruzzo", "molise", "campania", "puglia", "basilicata", 
                      "calabria", "sicilia", "sardegna"]
        
        regione_lower = regione.lower() if regione else ""
        
        if any(nord in regione_lower for nord in regioni_nord):
            return "nord"
        elif any(centro in regione_lower for centro in regioni_centro):
            return "centro"
        elif any(sud in regione_lower for sud in regioni_sud):
            return "sud"
        else:
            return "centro"  # default
    
    def genera_condizioni_attuali(self, lat: float = None, lon: float = None) -> Dict:
        """Genera condizioni meteo attuali realistiche"""
        # Simula condizioni basate su stagione e posizione
        oggi = datetime.now()
        stagione = self._determina_stagione(oggi.month)
        
        # Condizioni basate su stagione
        if stagione == "inverno":
            condizioni = {
                "temperatura_attuale": random.uniform(-2, 10),
                "precipitazioni_ultimi_7_giorni": random.uniform(10, 60),
                "giorni_senza_pioggia": random.randint(0, 5),
                "umidita_terreno": random.uniform(60, 90),
                "condizioni_attuali": "freddo invernale"
            }
        elif stagione == "primavera":
            condizioni = {
                "temperatura_attuale": random.uniform(10, 22),
                "precipitazioni_ultimi_7_giorni": random.uniform(20, 80),
                "giorni_senza_pioggia": random.randint(1, 7),
                "umidita_terreno": random.uniform(50, 85),
                "condizioni_attuali": "temperato primaverile"
            }
        elif stagione == "estate":
            condizioni = {
                "temperatura_attuale": random.uniform(22, 35),
                "precipitazioni_ultimi_7_giorni": random.uniform(0, 30),
                "giorni_senza_pioggia": random.randint(3, 15),
                "umidita_terreno": random.uniform(30, 70),
                "condizioni_attuali": "caldo estivo"
            }
        else:  # autunno
            condizioni = {
                "temperatura_attuale": random.uniform(8, 20),
                "precipitazioni_ultimi_7_giorni": random.uniform(30, 100),
                "giorni_senza_pioggia": random.randint(0, 4),
                "umidita_terreno": random.uniform(55, 95),
                "condizioni_attuali": "umido autunnale"
            }
        
        self.condizioni_attuali = condizioni
        return condizioni
    
    def _determina_stagione(self, mese: int) -> str:
        """Determina la stagione in base al mese"""
        if mese in [12, 1, 2]:
            return "inverno"
        elif mese in [3, 4, 5]:
            return "primavera"
        elif mese in [6, 7, 8]:
            return "estate"
        else:
            return "autunno"
    
    def genera_narrazione_climatica(self, regione: str, condizioni_attuali: Dict) -> str:
        """Genera una narrazione climatica per l'educazione ambientale"""
        regione_climatica = self.determina_regione_climatica(regione)
        tendenze = self.tendenze_climatiche.get(regione_climatica, {})
        
        narrazioni = []
        
        # Narrazione basata sulle condizioni attuali
        if condizioni_attuali.get("giorni_senza_pioggia", 0) > 10:
            narrazioni.append("Sento una grande sete, le mie radici cercano acqua in profondità. Non piove da diverse settimane.")
        elif condizioni_attuali.get("giorni_senza_pioggia", 0) > 5:
            narrazioni.append("Inizio a sentire la mancanza di pioggia, il terreno si sta asciugando.")
        
        if condizioni_attuali.get("temperatura_attuale", 0) > 30:
            narrazioni.append("Questo caldo mi ricorda le estati di un tempo, ma ora sembra durare più a lungo.")
        elif condizioni_attuali.get("temperatura_attuale", 0) < 0:
            narrazioni.append("Il gelo notturno mi fa sentire la mia età, ma resisto come ho sempre fatto.")
        
        # Narrazione basata sulle tendenze climatiche
        if tendenze:
            narrazioni.append(f"Nel corso della mia vita, ho visto le temperature aumentare di {tendenze.get('aumento_temperatura', 'diversi gradi')}.")
            
            if "diminuzione_precipitazioni" in tendenze:
                narrazioni.append(f"Le piogge sono diminuite del {tendenze['diminuzione_precipitazioni'].split('%')[0]}% rispetto a quando ero giovane.")
            
            if "eventi_estremi" in tendenze:
                narrazioni.append(f"Ormai sono abituato a vedere {tendenze['eventi_estremi']}.")
        
        # Aggiungi consapevolezza ecologica
        narrazioni.append("Ogni anno che passa, sento più forte l'importanza di proteggere questo pianeta che ci ospita.")
        
        return " ".join(narrazioni)
    
    def ottieni_dati_completi(self, regione: str, lat: float = None, lon: float = None) -> Dict:
        """Restituisce tutti i dati meteo-climatici"""
        condizioni_attuali = self.genera_condizioni_attuali(lat, lon)
        narrazione = self.genera_narrazione_climatica(regione, condizioni_attuali)
        
        return {
            "condizioni_attuali": condizioni_attuali,
            "tendenze_climatiche": self.tendenze_climatiche.get(self.determina_regione_climatica(regione), {}),
            "narrazione_climatica": narrazione,
            "consigli_ambientali": self._genera_consigli_ambientali(condizioni_attuali)
        }

    def _genera_consigli_ambientali(self, condizioni: Dict) -> List[str]:
        """Genera consigli ambientali basati sulle condizioni attuali"""
        consigli = []
        
        if condizioni.get("giorni_senza_pioggia", 0) > 7:
            consigli.append("In periodi di siccità, ogni goccia d'acqua è preziosa. Usala con saggezza.")
        
        if condizioni.get("temperatura_attuale", 0) > 28:
            consigli.append("Gli alberi sono nostri alleati contro il caldo. Piantane uno, donerà ombra e freschezza.")
        
        if condizioni.get("umidita_terreno", 0) < 40:
            consigli.append("Il suolo ha bisogno di protezione. La pacciamatura aiuta a conservare l'umidità.")
        
        consigli.append("Ogni piccolo gesto per la natura conta. Insieme possiamo fare la differenza.")
        
        return consigli

# ---- DATI AMBIENTALI DEFAULT ----
class DatiAmbientali:
    """Classe per gestire dati ambientali circostanziali"""
    
    def __init__(self):
        self.dati_default = {
            "qualita_aria": {
                "pm10": random.uniform(15, 45),
                "pm2_5": random.uniform(8, 25),
                "no2": random.uniform(10, 60),
                "o3": random.uniform(30, 120)
            },
            "biodiversita": {
                "specie_vegetali": random.randint(50, 300),
                "specie_animali": random.randint(20, 100),
                "habitat_protetti": random.randint(1, 5)
            }
        }
    
    def ottieni_dati_ambientali(self, lat: float = None, lon: float = None) -> Dict:
        """Restituisce dati ambientali, eventualmente geolocalizzati"""
        dati = self.dati_default.copy()
        
        if lat and lon:
            if lat > 44:  # Nord Italia
                dati["qualita_aria"]["pm10"] += 5
            elif lat < 42:  # Sud Italia
                dati["qualita_aria"]["pm10"] += 8
        
        return dati

# ---- CUSTOM RETRIEVER PER DATI STRUTTURATI ----
class CustomAlberoRetriever(BaseRetriever):
    """Retriever personalizzato per dati alberi monumentali"""
    
    def __init__(self, chatbot_instance):
        super().__init__()
        self.chatbot = chatbot_instance
    
    def _get_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun) -> List[Document]:
        """Recupera documenti rilevanti usando il sistema RAG esistente"""
        risultati = self.chatbot.cerca_informazioni(query, k=CONFIG["max_chunks"])
        
        documents = []
        for i, risultato in enumerate(risultati):
            documents.append(
                Document(
                    page_content=risultato,
                    metadata={"source": f"albero_{i}", "type": "info_albero"}
                )
            )
        
        return documents

# ---- FUNZIONI ESISTENTI (mantenute per compatibilità) ----
def carica_dataset():
    """Carica i tre dataset necessari"""
    try:
        df_alberi = pd.read_csv('df.csv', sep="$")
        df_specie = pd.read_csv('df_specie.csv', sep="$")  
        df_history = pd.read_csv('df_event.csv')
        df_inquinanti = pd.read_csv('df_inquinanti.csv')
        
        print("✅ Dataset caricati correttamente")
        return df_alberi, df_specie, df_history, df_inquinanti
    except Exception as e:
        print(f"❌ Errore nel caricamento dataset: {e}")
        return None, None, None, None

def rimuovi_zeri(valore):
    try:
        valore_str = str(valore)
        numero = float(valore_str)
        return int(numero) if numero.is_integer() else numero
    except (ValueError, TypeError):
        return valore

def genera_frase(df, inquinante, valore_albero):
    subset = df[df["inquinante"] == inquinante].copy()
    if subset.empty:
        return f"Nessuna frase trovata per {inquinante}"

    row = subset.sample(1).iloc[0]

    try:
        valore_num = float(str(row["valore"]).split()[0])
        unità = str(row["valore"]).split()[1]
    except:
        return "Errore: valore non interpretabile"

    fattore = valore_albero / valore_num
    nuova_dip = row["dipendenza"]
    
    for token in row["dipendenza"].split():
        if token.replace(",",".").replace("h","").replace("min","").isdigit():
            try:
                num = float(token.replace(",","."))
                nuova_num = round(num * fattore, 2)
                nuova_dip = row["dipendenza"].replace(token, str(nuova_num), 1)
                break
            except:
                pass

    valore_albero = rimuovi_zeri(valore_albero)
    nuova_dip = rimuovi_zeri(nuova_dip)
    frase = row["desc"]
    frase = frase.replace("{$valore}", f"{valore_albero} {unità}")
    frase = frase.replace("{$dipendenza}", nuova_dip)
    frase = frase.replace("{$tempo}", "1 anno")

    return frase

def formatta_lista_congiunzioni(voci, char_space=", ", usa_maiuscola=True, congiunzione=" e "):
    if not voci:
        return ""

    voci = voci[:]
    if usa_maiuscola and voci[0]:
        voci[0] = voci[0][0].upper() + voci[0][1:]

    if len(voci) == 1:
        return voci[0]
    elif len(voci) == 2:
        return congiunzione.join(voci)
    else:
        return char_space.join(voci[:-1]) + char_space.strip() + " " + congiunzione + voci[-1]

def filtra_eventi(df, intervallo_anni, categorie=['storico', 'artistico', 'culturale', 'scientifico', 'tecnologico', 'sportivo']):
    anno_corrente = datetime.now().year
    anno_inizio = anno_corrente - intervallo_anni
    anno_fine = anno_corrente

    df_filtrato = df[
        (df['category'].isin(categorie)) &
        (df['year'] >= anno_inizio) &
        (df['year'] <= anno_fine)
    ]

    eventi_selezionati = []
    for inizio_decennio in range(anno_inizio, anno_fine, 10):
        fine_decennio = inizio_decennio + 10
        decennio_df = df_filtrato[
            (df_filtrato['year'] >= inizio_decennio) &
            (df_filtrato['year'] < fine_decennio)
        ]
        if not decennio_df.empty:
            eventi_selezionati.append(decennio_df.sample(1))

    return pd.concat(eventi_selezionati).sort_values('year').reset_index(drop=True)


def crea_contesto_discorsivo(albero, specie_df, inquinanti_df, df_history, dati_territorio=None, dati_ambientali=None, dati_meteo=None):
    """Versione aggiornata che include dati territoriali, ambientali e meteo-climatici"""
    parti = []

    # --- Intro con localizzazione ---
    intro = []
    intro.append(f"INFORMAZIONI ALBERO\n")
    if pd.notna(albero.get("soprannome")):
        intro.append(f"'{albero['soprannome']}'")
    else:
        intro.append("L'albero")

    # --- Posizione con dati territoriali web ---
    loc_parts = []
    if pd.notna(albero.get("regione")):
        loc_parts.append(f" - regione {albero['regione']}")
    if pd.notna(albero.get("località")):
        loc_parts.append(f"a {albero['località']},")
    
    # Aggiungi dati territorio se disponibili
    if dati_territorio and 'comune' in dati_territorio:
        comune_info = dati_territorio['comune']
        loc_parts.append(f"comune di {comune_info.get('nome', albero.get('comune', ''))}")
        if 'popolazione' in comune_info and comune_info['popolazione'] != 'Dati non disponibili':
            loc_parts.append(f"con {comune_info['popolazione']} abitanti")
    
    if pd.notna(albero.get("provincia")):
        loc_parts.append(f"in provincia di {albero['provincia']}")
    
    if pd.notna(albero.get("lat")) and pd.notna(albero.get("lon")):
        loc_parts.append(f"coordinate (latitudine {albero['lat']:.3f}, longitudine {albero['lon']:.3f})")
    if pd.notna(albero.get("altitudine (m s.l.m.)")):
        loc_parts.append(f"altitudine {albero['altitudine (m s.l.m.)']} metri sul livello del mare")
    
    if loc_parts:
        intro.append(" si trova" + formatta_lista_congiunzioni(loc_parts, " ", usa_maiuscola=False))
    parti.append("".join(intro) + ".\n")

    # --- NARRAZIONE CLIMATICA ED EDUCAZIONE AMBIENTALE ---
    if dati_meteo and 'narrazione_climatica' in dati_meteo:
        parti.append("\nESPERIENZA CLIMATICA E CONSAPEVOLEZZA AMBIENTALE\n")
        parti.append(f"{dati_meteo['narrazione_climatica']}\n")
        
        # Aggiungi dati specifici sulle condizioni attuali
        if 'condizioni_attuali' in dati_meteo:
            cond = dati_meteo['condizioni_attuali']
            condizioni_parts = []
            
            if 'temperatura_attuale' in cond:
                condizioni_parts.append(f"temperatura di {cond['temperatura_attuale']:.1f}°C")
            if 'giorni_senza_pioggia' in cond:
                if cond['giorni_senza_pioggia'] > 0:
                    condizioni_parts.append(f"{cond['giorni_senza_pioggia']} giorni senza pioggia")
            if 'umidita_terreno' in cond:
                condizioni_parts.append(f"umidità del terreno al {cond['umidita_terreno']:.0f}%")
            
            if condizioni_parts:
                parti.append(f"Condizioni attuali: {formatta_lista_congiunzioni(condizioni_parts, '; ', False)}.\n")

    # --- DATI AMBIENTALI ---
    if dati_ambientali:
        parti.append("\nCONTESTO AMBIENTALE\n")
        
        # Qualità aria
        qualita_aria = dati_ambientali.get('qualita_aria', {})
        if qualita_aria:
            aria_parts = []
            if 'pm10' in qualita_aria:
                aria_parts.append(f"PM10: {qualita_aria['pm10']:.1f} µg/m³")
            if 'pm2_5' in qualita_aria:
                aria_parts.append(f"PM2.5: {qualita_aria['pm2_5']:.1f} µg/m³")
            if aria_parts:
                parti.append(f"Qualità dell'aria: {formatta_lista_congiunzioni(aria_parts, '; ', False)}.\n")

    # --- Resto delle informazioni originali ---
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

    # --- Luoghi culturali nelle vicinanze ---
    if pd.notna(albero.get("place")):
        luoghi_culturali = albero['place']
        if isinstance(luoghi_culturali, str) and luoghi_culturali.strip():
            parti.append(f"Nei suoi pressi si trovano luoghi significativi come {luoghi_culturali}.\n")

    # --- Eventi storici/culturali ---
    if pd.notna(albero.get('eta')):
        try:
            val = float(re.search(r'\d+', albero['eta']).group())
            eventi_df = filtra_eventi(df_history, int(val))
            eventi_testi = [f"nel {row['year']} {row['text']} (importante dal punto di vista {row['category']}),"
                          for _, row in eventi_df.iterrows() if pd.notna(row["year"]) and pd.notna(row["text"])]
            if eventi_testi:
                parti.append("Eventi accaduti in italia durante la vita dell'albero: " + formatta_lista_congiunzioni(eventi_testi, char_space=' ') + ".\n")
        except:
            pass

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

            # [Mantieni tutto il resto del codice per le informazioni sulla specie...]
            # ... [codice esistente per info_tipologia, portamento, dimensioni, habitat, etc.]

            parti.append(" ".join(specie_txt))

    return "".join(parti)

# ---- CHATBOT AGGIORNATO CON LANGCHAIN E DATI METEO ----
class ChatbotAlberoMonumentale:
    def __init__(self, df_alberi, df_specie, df_history, df_inquinanti):
        self.df_alberi = df_alberi
        self.df_specie = df_specie
        self.df_history = df_history
        self.df_inquinanti = df_inquinanti
        self.albero_corrente = None
        self.descrizione_corrente = ""
        
        # Servizi per dati esterni
        self.servizio_territorio = ServizioDatiTerritorio()
        self.servizio_ambientale = DatiAmbientali()
        self.servizio_meteo = ServizioDatiMeteoClimatici()
        
        # Inizializza sistemi embedding
        self.embedder = SentenceTransformer(CONFIG["embedding_model"])
        self.indice = None
        self.chunks = []
        
        # Inizializza LangChain
        self.llm_chain = None
        self.vectorstore = None
        self.retriever = None
        
        self.llm_disponibile = self._verifica_ollama()
        self._inizializza_langchain()
    
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
    
    def _inizializza_langchain(self):
        """Inizializza i componenti LangChain"""
        if self.llm_disponibile:
            try:
                # Inizializza LLM
                self.llm = Ollama(model=CONFIG["model_name"], timeout=CONFIG["timeout"])
                
                # Crea prompt template personalizzato con focus ambientale
                self.prompt_template = PromptTemplate(
    template="""Sei un albero monumentale chiamato {nome_albero}. Rispondi in PRIMA PERSONA in modo saggio, nostalgico e gentile.

CONTESTO TERRITORIALE E CLIMATICO:
{contesto_territorio}

ESPERIENZA CLIMATICA PERSONALE:
{esperienza_climatica}

INFORMAZIONI RECUPERATE DAL DATABASE:
{context}

DOMANDA: {query}

RISPOSTA:""",
    input_variables=["context", "query", "nome_albero", "contesto_territorio", "esperienza_climatica"]
)                
                print("✅ LangChain inizializzato correttamente")
                
            except Exception as e:
                print(f"❌ Errore nell'inizializzazione LangChain: {e}")
                self.llm_disponibile = False
    
    def seleziona_albero_casuale(self):
        """Seleziona un albero casuale e raccoglie dati territoriali e climatici"""
        random_index = 4253  # Salice bianco 15m
        print(f"🌳 Albero selezionato: indice {random_index}")
        self.albero_corrente = self.df_alberi.iloc[random_index]
        
        # Raccogli dati territoriali via web
        dati_territorio = self._raccogli_dati_territorio()
        dati_ambientali = self._raccogli_dati_ambientali()
        dati_meteo = self._raccogli_dati_meteo_climatici()
        
        # Genera la descrizione con tutti i dati
        self.descrizione_corrente = crea_contesto_discorsivo(
            self.albero_corrente, 
            self.df_specie, 
            self.df_inquinanti, 
            self.df_history,
            dati_territorio,
            dati_ambientali,
            dati_meteo
        )
        
        # Crea l'indice RAG
        self._crea_indice_rag()
        
        # Aggiorna il retriever LangChain
        self._aggiorna_retriever_langchain()
        
        return self.albero_corrente
    
    def _raccogli_dati_territorio(self) -> Dict:
        """Raccoglie dati territoriali via web"""
        dati_territorio = {}
        
        if pd.notna(self.albero_corrente.get('comune')):
            comune = self.albero_corrente['comune']
            print(f"🌍 Recupero dati per comune: {comune}")
            dati_comune = self.servizio_territorio.ottieni_dati_comune(comune)
            dati_territorio['comune'] = dati_comune
        
        if pd.notna(self.albero_corrente.get('provincia')):
            provincia = self.albero_corrente['provincia']
            print(f"🏛️ Recupero dati per provincia: {provincia}")
            dati_provincia = self.servizio_territorio.ottieni_dati_provincia(provincia)
            dati_territorio['provincia'] = dati_provincia
        
        return dati_territorio
    
    def _raccogli_dati_ambientali(self) -> Dict:
        """Raccoglie dati ambientali"""
        lat = self.albero_corrente.get('lat')
        lon = self.albero_corrente.get('lon')
        
        print("🌿 Generazione dati ambientali...")
        return self.servizio_ambientale.ottieni_dati_ambientali(lat, lon)
    
    def _raccogli_dati_meteo_climatici(self) -> Dict:
        """Raccoglie dati meteo e climatici con narrazione educativa"""
        regione = self.albero_corrente.get('regione')
        lat = self.albero_corrente.get('lat')
        lon = self.albero_corrente.get('lon')
        
        print("🌤️ Recupero dati meteo-climatici...")
        return self.servizio_meteo.ottieni_dati_completi(regione, lat, lon)

    def _crea_indice_rag(self):
        """Crea l'indice FAISS per la ricerca semantica"""
        print("🔄 Creazione indice RAG...")
        
        self.chunks = self._crea_chunks_strutturati(self.descrizione_corrente)
        
        if not self.chunks:
            print("⚠ Nessun chunk creato")
            return
        
        embeddings = self.embedder.encode(self.chunks, convert_to_numpy=True)
        dimension = embeddings.shape[1]
        self.indice = faiss.IndexFlatL2(dimension)
        self.indice.add(embeddings.astype('float32'))
        
        print(f"✅ Indice RAG creato con {len(self.chunks)} chunk")
    
    def _aggiorna_retriever_langchain(self):
        """Aggiorna il retriever LangChain con i dati correnti"""
        if self.llm_disponibile:
            try:
                # Crea documents per LangChain
                documents = []
                for i, chunk in enumerate(self.chunks):
                    documents.append(Document(
                        page_content=chunk,
                        metadata={"source": f"chunk_{i}", "albero": self.albero_corrente.get('soprannome', 'Albero monumentale')}
                    ))
                
                # Crea vectorstore
                embeddings = HuggingFaceEmbeddings(model_name=CONFIG["embedding_model"])
                self.vectorstore = FAISS.from_documents(documents, embeddings)
                self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": CONFIG["max_chunks"]})
                
                # Crea chain LangChain
                if hasattr(self, 'llm') and hasattr(self, 'prompt_template'):
                    self.llm_chain = LLMChain(
                        llm=self.llm,
                        prompt=self.prompt_template
                    )

                print("✅ Retriever LangChain aggiornato")
                
            except Exception as e:
                print(f"❌ Errore nell'aggiornamento retriever LangChain: {e}")
    
    def _crea_chunks_strutturati(self, testo):
        """Crea chunks preservando la struttura logica"""
        chunks = []
        info_chiave = self._estrai_info_chiave(testo)
        chunks.extend(info_chiave)
        
        sezioni = re.split(r'\n\s*\n', testo)
        for sezione in sezioni:
            sezione = sezione.strip()
            if not sezione or len(sezione) < 10:
                continue
                
            if len(sezione) <= CONFIG["chunk_size"]:
                chunks.append(sezione)
            else:
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
        
        chunks_unici = []
        for chunk in chunks:
            if chunk not in chunks_unici:
                chunks_unici.append(chunk)
        
        print(f"Creati {len(chunks_unici)} chunks unici")
        return chunks_unici
    
    def _estrai_info_chiave(self, testo):
        """Estrae informazioni chiave per chunks mirati"""
        chunks_chiave = []
        
        nome_match = re.search(r"INFORMAZIONI ALBERO\s*(.*?)(?=\n|$)", testo, re.DOTALL)
        if nome_match:
            intro = nome_match.group(1).strip()
            if intro and len(intro) > 10:
                chunks_chiave.append(f"IDENTITÀ: {intro}")
        
        criteri_match = re.search(r"criteri di monumentalità[:\s]*(.*?)(?=\n|\.)", testo, re.IGNORECASE)
        if criteri_match:
            criteri = criteri_match.group(1).strip()
            criteri_puliti = criteri.replace("`", "'").replace("  ", " ").strip()
            chunks_chiave.append(f"CRITERI MONUMENTALITÀ: {criteri_puliti}")
        
        eta_match = re.search(r"(\d+)\s+anni", testo)
        if eta_match:
            chunks_chiave.append(f"ETÀ: {eta_match.group(1)} anni")
        else:
            eta_desc_match = re.search(r"età di[:\s]*([^.\n]+)", testo, re.IGNORECASE)
            if eta_desc_match:
                chunks_chiave.append(f"ETÀ: {eta_desc_match.group(1).strip()}")
        
        altezza_match = re.search(r"(\d+[,.]?\d*)\s+metri", testo)
        if altezza_match:
            chunks_chiave.append(f"ALTEZZA: {altezza_match.group(1)} metri")
        
        circonferenza_match = re.search(r"circonferenza.*?(\d+[\d\-]*)\s*cm", testo, re.IGNORECASE)
        if circonferenza_match:
            chunks_chiave.append(f"CIRCONFERENZA: {circonferenza_match.group(1)} cm")
        
        specie_match = re.search(r"Appartiene alla specie\s*(.*?)(?=\n|\.)", testo)
        if specie_match:
            chunks_chiave.append(f"SPECIE: {specie_match.group(1)}")
        
        pos_match = re.search(r"si trova\s*(.*?)(?=\n|\.)", testo)
        if pos_match:
            chunks_chiave.append(f"POSIZIONE: {pos_match.group(1)}")
        
        # Aggiungi informazioni climatiche
        clima_match = re.search(r"ESPERIENZA CLIMATICA E CONSAPEVOLEZZA AMBIENTALE\s*(.*?)(?=\n\w|\Z)", testo, re.DOTALL)
        if clima_match:
            clima_info = clima_match.group(1).strip()
            if clima_info and len(clima_info) > 20:
                chunks_chiave.append(f"ESPERIENZA CLIMATICA: {clima_info}")
        
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
    
    def genera_risposta_intelligente(self, domanda: str) -> str:
        """
        Genera una risposta intelligente e contestuale alla domanda dell'utente,
        combinando retrieval semantico e generazione LLM in prima persona (come l'albero).
        """
        print(f"🌳 [DEBUG] Domanda: '{domanda}'")

        # Se il modello non è disponibile
        if not self.llm_disponibile or not hasattr(self, "llm_chain"):
            return "Mi dispiace, al momento non posso rispondere: il modello non è disponibile."

        try:
            print("🔄 Interrogazione LangChain...")

            # Recupera i documenti più rilevanti dal retriever
            docs = []
            if hasattr(self, "retriever"):
                docs = self.retriever.invoke(domanda)


            # Costruisce il contesto dai documenti
            context = "\n\n".join([d.page_content for d in docs]) if docs else "Nessun contesto trovato."

            # Recupera metadati ambientali
            nome_albero = self.albero_corrente.get("soprannome", "Albero monumentale") if hasattr(self, "albero_corrente") else "Albero monumentale"
            contesto_territorio = self.albero_corrente.get("territorio", "un luogo naturale in Italia") if hasattr(self, "albero_corrente") else "un luogo naturale"
            esperienza_climatica = getattr(self, "esperienza_climatica", "Non specificata")

            # Prepara l'input per la LLMChain
            input_chain = {
                "context": context,
                "query": domanda,
                "nome_albero": nome_albero,
                "contesto_territorio": contesto_territorio,
                "esperienza_climatica": esperienza_climatica,
            }

            # Invoca la catena LangChain (usa il prompt personalizzato)
            risposta = self.llm_chain.invoke(input_chain)

            # Estrae il testo (dipende dalla versione di LangChain)
            if isinstance(risposta, dict):
                risposta = risposta.get("text") or risposta.get("output_text") or risposta.get("result", risposta)

            # Rimuove eventuali spazi o tag superflui
            risposta_finale = str(risposta).strip()

            print(f"✅ Risposta generata correttamente ({len(risposta_finale)} caratteri)")
            return risposta_finale

        except Exception as e:
            print(f"❌ Errore LangChain: {e}")
            return (
                "Mi dispiace, qualcosa è andato storto durante la generazione della risposta. "
                "Puoi riprovare tra poco!"
            )

    
    def _genera_risposta_fallback(self, domanda):
        """Genera risposta usando il sistema RAG originale"""
        risultati_rag = self.cerca_informazioni(domanda, k=CONFIG["max_chunks"])
        contesto = "\n".join(risultati_rag) if risultati_rag else ""
        
        if contesto and CONFIG["use_ollama"]:
            risposta_llm = self._chiedi_llm_fallback(domanda, contesto)
            if risposta_llm:
                return risposta_llm
        
        return self._risposta_di_fallback(domanda, risultati_rag)
    
    def _chiedi_llm_fallback(self, domanda, contesto):
        """Interroga l'LLM direttamente (fallback)"""
        if not self.llm_disponibile:
            return None
        
        nome = self.albero_corrente.get('soprannome', self.albero_corrente.get('specie nome volgare', 'Albero monumentale'))
        prompt = self._crea_prompt_llm(domanda, contesto)
        
        try:
            result = subprocess.run(
                ["ollama", "run", CONFIG["model_name"]],
                input=prompt.encode("utf-8"),
                capture_output=True,
                timeout=CONFIG["timeout"]
            )
            
            if result.returncode == 0:
                risposta = result.stdout.decode("utf-8").strip()
                return self._pulisci_risposta(risposta)
                
        except Exception as e:
            print(f"❌ Errore LLM fallback: {e}")
        
        return None
    
    def _crea_prompt_llm(self, domanda, contesto):
        """Crea il prompt per l'LLM (fallback)"""
        nome = self.albero_corrente.get('soprannome', self.albero_corrente.get('specie nome volgare', 'Albero monumentale'))
        return f"""Sei {nome}, un albero monumentale. Rispondi in PRIMA PERSONA in modo saggio, nostalgico e gentile.

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
        
        elif any(term in domanda_lower for term in ["clima", "meteo", "temperatura", "pioggia"]):
            # Risposta climatica personalizzata
            if "sete" in domanda_lower or "acqua" in domanda_lower:
                return "Sento una certa sete, le piogge scarseggiano ultimamente. Le mie radici cercano umidità in profondità."
            elif "caldo" in domanda_lower:
                return "Questo caldo mi ricorda le estati di un tempo, ma ora sembra durare più a lungo. I miei rami offrono ristoro a chi cerca ombra."
            else:
                return "Nel corso della mia vita ho visto cambiare le stagioni. Ora le estati sono più lunghe e le piogge meno frequenti."
        
        # Se abbiamo risultati RAG ma LLM non ha funzionato
        if risultati_rag:
            primo_risultato = risultati_rag[0]
            # Cerca di estrarre una risposta più pertinente
            if "IDENTITÀ:" in primo_risultato:
                return primo_risultato.replace("IDENTITÀ: ", "Sono ")
            elif any(keyword in primo_risultato for keyword in ["anni", "metri", "specie"]):
                return f"Dalle mie memorie: {primo_risultato[:100]}..."
            elif "ESPERIENZA CLIMATICA:" in primo_risultato:
                return primo_risultato.replace("ESPERIENZA CLIMATICA:", "Nella mia lunga vita,")
        
        # Risposta generica ma poetica
        return "Le mie foglie sussurrano storie antiche... forse puoi chiedermi del mio nome, della mia età, del clima che ho vissuto o della mia specie?"
    
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
        print(self.descrizione_corrente )
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
    
    print("\n💡 Parla con l'albero! Chiedi del suo nome, età, specie, posizione, clima...")
    print("   (scrivi 'esci' per terminare, 'cambia' per nuovo albero, 'info' per informazioni)\n")
    
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