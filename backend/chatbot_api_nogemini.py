from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import re
import pandas as pd
import json

# ---- LANGCHAIN IMPORTS AGGIORNATI ----
from langchain.schema import Document
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


app = Flask(__name__)
CORS(app)

# ---- CONFIGURAZIONE ----
CONFIG = {
    "model_name": "llama3",
    "embedding_model": "all-MiniLM-L6-v2", 
    "chunk_size": 400,
    "max_chunks": 3,
    "timeout": 180,
}

# Variabile globale per il chatbot
chatbot = None

class ChatbotAlberoMonumentale:
    def __init__(self, tree_data, species_data):
        print(f"🌳 Creazione chatbot con dati: {tree_data}")  # DEBUG
        
        # Assicurati che i dati siano un dizionario
        if not isinstance(tree_data, dict):
            print(f"❌ ERRORE: tree_data non è un dizionario: {type(tree_data)}")
            tree_data = {}
        
        self.albero_corrente = tree_data
        self.specie_corrente = species_data
        
        print(f"✅ Albero corrente - Soprannome: '{self.albero_corrente.get('soprannome')}'")  # DEBUG
        print(f"✅ Albero corrente - Specie: '{self.albero_corrente.get('specie nome volgare')}'")  # DEBUG
        print(f"✅ Albero corrente - Età: '{self.albero_corrente.get('eta')}'")  # DEBUG
        print(f"✅ Specie corrente: {self.specie_corrente.get('nome_famiglia', 'Nessuna specie') if self.specie_corrente else 'Nessuna specie'}")  # DEBUG
        
        # Inizializza sistemi embedding
        self.embedder = SentenceTransformer(CONFIG["embedding_model"])
        self.indice = None
        self.chunks = []
        
        # Inizializza LangChain
        self.llm_chain = None
        self.llm_disponibile = False
        
        self._inizializza_langchain()
        self._prepara_dati_albero()
    
    def _inizializza_langchain(self):
        """Inizializza i componenti LangChain"""
        try:
            # Verifica se Ollama è disponibile
            result = subprocess.run(
                ["ollama", "list"], 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            
            if result.returncode == 0 and CONFIG["model_name"] in result.stdout:
                # Inizializza LLM
                self.llm = Ollama(model=CONFIG["model_name"], timeout=CONFIG["timeout"])
                
                # Crea prompt template
                self.prompt_template = PromptTemplate(
                    template="""Sei un albero monumentale. Rispondi in PRIMA PERSONA in modo saggio e nostalgico.

CONTESTO:
{context}

DOMANDA: {question}

RISPOSTA:""",
                    input_variables=["context", "question"]
                )
                
                self.llm_chain = LLMChain(
                    llm=self.llm,
                    prompt=self.prompt_template
                )
                self.llm_disponibile = True
                print("✅ LangChain inizializzato")
            else:
                print("⚠ Ollama non disponibile - usando risposte predefinite")
                
        except Exception as e:
            print(f"❌ Errore LangChain: {e}")
    
    def _prepara_dati_albero(self):
        """Prepara i dati dell'albero per il RAG"""
        # Genera la descrizione
        self.descrizione_corrente = self._crea_descrizione_albero()
        
        # Crea l'indice RAG
        self._crea_indice_rag()
    
    def _crea_descrizione_albero(self):
        """Crea una descrizione dettagliata dell'albero"""
        print(f"📝 Creazione descrizione per albero...")  # DEBUG
        
        parti = []
        
        # Informazioni base
        if self.albero_corrente.get('soprannome'):
            parti.append(f"Mi chiamo {self.albero_corrente['soprannome']}.")
        else:
            parti.append("Sono un albero monumentale.")
        
        # Specie
        if self.albero_corrente.get('specie nome volgare'):
            nome_volgare = self.albero_corrente['specie nome volgare']
            nome_scientifico = self.albero_corrente.get('specie nome scientifico', '')
            if nome_scientifico:
                parti.append(f"Sono un {nome_volgare} ({nome_scientifico}).")
            else:
                parti.append(f"Sono un {nome_volgare}.")
        
        # Età
        if self.albero_corrente.get('eta'):
            eta = self.albero_corrente['eta']
            parti.append(f"Ho {eta}.")
        
        # Dimensioni
        if self.albero_corrente.get('altezza (m)'):
            parti.append(f"Sono alto {self.albero_corrente['altezza (m)']} metri.")
        
        if self.albero_corrente.get('circonferenza fusto (cm)'):
            parti.append(f"La mia circonferenza è {self.albero_corrente['circonferenza fusto (cm)']} cm.")
        
        # Posizione
        if self.albero_corrente.get('comune'):
            loc_parts = [self.albero_corrente['comune']]
            if self.albero_corrente.get('provincia'):
                loc_parts.append(f"provincia di {self.albero_corrente['provincia']}")
            if self.albero_corrente.get('regione'):
                loc_parts.append(self.albero_corrente['regione'])
            
            parti.append(f"Mi trovo a {', '.join(loc_parts)}.")
        
        descrizione = " ".join(parti)
        print(f"📄 Descrizione generata: {descrizione}")  # DEBUG
        return descrizione
    
    def _crea_indice_rag(self):
        """Crea l'indice FAISS per la ricerca semantica"""
        try:
            # Crea chunks semplici
            self.chunks = [self.descrizione_corrente[i:i+CONFIG["chunk_size"]] 
                          for i in range(0, len(self.descrizione_corrente), CONFIG["chunk_size"])]
            
            if self.chunks:
                embeddings = self.embedder.encode(self.chunks, convert_to_numpy=True)
                dimension = embeddings.shape[1]
                self.indice = faiss.IndexFlatL2(dimension)
                self.indice.add(embeddings.astype('float32'))
                print(f"✅ Indice RAG creato con {len(self.chunks)} chunk")
                
        except Exception as e:
            print(f"❌ Errore creazione indice RAG: {e}")
    
    def genera_risposta(self, domanda: str) -> str:
        """Genera una risposta usando LangChain o fallback"""
        try:
            if self.llm_disponibile and self.llm_chain:
                # Usa LangChain
                risposta = self.llm_chain.invoke({
                    "context": self.descrizione_corrente,
                    "question": domanda
                })
                
                if isinstance(risposta, dict):
                    risposta = risposta.get("text", "")
                
                return str(risposta).strip()
            else:
                # Fallback intelligente
                return self._risposta_fallback(domanda)
                
        except Exception as e:
            print(f"❌ Errore generazione risposta: {e}")
            return self._risposta_fallback(domanda)
    
    def _risposta_fallback(self, domanda):
        """Risposte di fallback basate sui dati"""
        domanda_lower = domanda.lower()
        
        if any(term in domanda_lower for term in ["come ti chiami", "nome"]):
            nome = self.albero_corrente.get('soprannome', 'un albero monumentale')
            return f"Sono {nome}, piacere di conoscerti!"
        
        elif any(term in domanda_lower for term in ["età", "anni"]):
            eta = self.albero_corrente.get('eta', 'molti')
            return f"Conto {eta} primavere, testimone del tempo."
        
        elif any(term in domanda_lower for term in ["specie", "tipo"]):
            specie = self.albero_corrente.get('specie nome volgare', 'una specie antica')
            return f"Sono un {specie}, legato a questa terra."
        
        elif any(term in domanda_lower for term in ["dove", "posizione"]):
            comune = self.albero_corrente.get('comune', 'questo luogo')
            return f"Le mie radici sono a {comune}."
        
        elif any(term in domanda_lower for term in ["alto", "altezza"]):
            altezza = self.albero_corrente.get('altezza (m)', 'molti')
            return f"Mi elevo per {altezza} metri verso il cielo."
        
        else:
            return f"Dalla mia esperienza: {self.descrizione_corrente[:100]}..."

# ---- API ENDPOINTS ----
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'Chatbot API is running'})

@app.route('/api/chatbot-status', methods=['GET'])
def chatbot_status():
    """Restituisce lo stato corrente del chatbot"""
    global chatbot
    
    if chatbot is None:
        return jsonify({
            'success': False,
            'initialized': False,
            'message': 'Chatbot non inizializzato'
        })
    
    tree_name = chatbot.albero_corrente.get('soprannome') or chatbot.albero_corrente.get('specie nome volgare') or 'Albero Monumentale'
    
    return jsonify({
        'success': True,
        'initialized': True,
        'tree_name': tree_name,
        'message': 'Chatbot inizializzato e pronto'
    })
    
@app.route('/api/initialize-chatbot', methods=['POST'])
def initialize_chatbot():
    """Inizializza il chatbot con i dati dell'albero"""
    try:
        global chatbot
        
        data = request.get_json()
        print("🚀 Inizializzazione chatbot con dati ricevuti")
        
        tree_data = data.get('tree_data')
        species_data = data.get('species_data')
        
        if not tree_data:
            return jsonify({'success': False, 'error': 'Dati albero mancanti'}), 400
        
        # Pulisci i dati
        def clean_data(obj):
            if isinstance(obj, dict):
                return {k: clean_data(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_data(item) for item in obj]
            elif pd.isna(obj) or obj is None:
                return ""
            else:
                return obj
        
        tree_data_clean = clean_data(tree_data)
        species_data_clean = clean_data(species_data) if species_data else None
        
        print(f"✅ Dati puliti - Soprannome: '{tree_data_clean.get('soprannome')}'")
        print(f"✅ Dati puliti - Specie: '{tree_data_clean.get('specie nome volgare')}'")
        print(f"✅ Dati puliti - Età: '{tree_data_clean.get('eta')}'")
        
        # Crea il chatbot
        chatbot = ChatbotAlberoMonumentale(tree_data_clean, species_data_clean)
        
        tree_name = tree_data_clean.get('soprannome') or tree_data_clean.get('specie nome volgare') or 'Albero Monumentale'
        
        return jsonify({
            'success': True,
            'message': 'Chatbot inizializzato',
            'tree_name': tree_name
        })
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def handle_chat():
    try:
        global chatbot
        
        if chatbot is None:
            return jsonify({'success': False, 'error': 'Chatbot non inizializzato'}), 400
        
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'success': False, 'error': 'Messaggio vuoto'}), 400
        
        print(f"📨 Messaggio ricevuto: {user_message}")
        
        # Genera risposta
        bot_response = chatbot.genera_risposta(user_message)
        
        return jsonify({
            'success': True,
            'response': bot_response,
            'tree_name': chatbot.albero_corrente.get('soprannome', 'Albero Monumentale')
        })
        
    except Exception as e:
        print(f"❌ Errore chat: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Tree Chatbot API...")
    app.run(debug=True, port=5000, host='0.0.0.0')