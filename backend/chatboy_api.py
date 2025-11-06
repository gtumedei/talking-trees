import os
import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any

# ---- GOOGLE & LANGCHAIN IMPORTS ESSENZIALI ----
from langchain.schema import Document
from langchain_community.vectorstores import FAISS
# Importa gli embeddings di Google
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA

app = Flask(__name__)
CORS(app)

# ---- CONFIGURAZIONE GLOBALE (Ottimizzata per API) ----
CONFIG = {
    # Usiamo 'gemini-2.5-flash' come LLM predefinito e più economico/veloce
    "llm_model": "gemini-2.5-flash", 
    # Usiamo l'embedding di Google, più performante e incluso nell'ecosistema API
    "embedding_model": "text-embedding-004", 
    "chunk_size": 500,
    "k_retrieval": 3, 
    "timeout": 180,
}

# Variabile globale
chatbot = None

class ChatbotAlberoMonumentale:
    def __init__(self, tree_data: Dict[str, Any], species_data: Dict[str, Any]):
        print(f"🌳 Creazione chatbot per: {tree_data.get('soprannome', 'Albero')}...")
        
        self.albero_corrente = tree_data if isinstance(tree_data, dict) else {}
        self.specie_corrente = species_data if isinstance(species_data, dict) else {}
        
        # Verifica se la chiave API è disponibile
        self.api_key_available = os.environ.get("GEMINI_API_KEY") is not None
        
        if not self.api_key_available:
            print("❌ ERRORE: Variabile GEMINI_API_KEY non trovata. Impossibile usare Gemini/Google Embeddings.")
            
        self.descrizione_corrente = self._crea_descrizione_albero()
        
        # Inizializza componenti LangChain
        self.embeddings = self._inizializza_embeddings()
        self.vectorstore = None
        self.qa_chain = None
        self.llm_disponibile = False
        
        self._prepara_dati_albero_e_rag()
        self._inizializza_llm_chain()

    def _inizializza_embeddings(self):
        """Inizializza il modello di embedding, prioritizzando Google."""
        if self.api_key_available:
            try:
                # Usa il modello di embedding di Google (vantaggio studente)
                embeddings = GoogleGenerativeAIEmbeddings(
                    model=CONFIG["embedding_model"],
                    api_key=os.environ.get("GEMINI_API_KEY")
                )
                print(f"✅ Embedding: {CONFIG['embedding_model']} (Google API)")
                return embeddings
            except Exception as e:
                print(f"❌ Errore Google Embeddings: {e}. Fallback a HuggingFace.")
        
        # Fallback a modello open-source se API non disponibile o fallita
        from langchain_community.embeddings import HuggingFaceEmbeddings
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        print("✅ Embedding: all-MiniLM-L6-v2 (HuggingFace Fallback)")
        return embeddings

    def _inizializza_llm_chain(self):
        """Inizializza l'LLM (Gemini) e la catena RAG"""
        
        llm = None
        if self.api_key_available:
            try:
                # Inizializza Gemini 2.5 Flash
                llm = ChatGoogleGenerativeAI(
                    model=CONFIG["llm_model"],
                    temperature=0.7,
                    api_key=os.environ.get("GEMINI_API_KEY")
                )
                self.llm_disponibile = True
                print(f"✅ LLM inizializzato: {CONFIG['llm_model']}")
            except Exception as e:
                print(f"❌ Errore Gemini LLM: {e}. Fallback a risposte predefinite.")
        
        if not self.llm_disponibile:
             print("⚠ Nessun LLM API disponibile. Usando risposte di fallback.")
             return

        # Prompt (Ruolo dell'albero) - Mantenuto il tuo stile
        PROMPT_TEMPLATE = """Sei un albero monumentale. Rispondi in PRIMA PERSONA in modo saggio e nostalgico.
        
        Utilizza SOLO le seguenti informazioni recuperate (CONTESTO) per rispondere alla DOMANDA.
        Se la risposta non è nel contesto, dì onestamente che non lo sai, ma mantieni il tuo ruolo.

        CONTESTO:
        {context}

        DOMANDA: {question}

        RISPOSTA:"""
        
        prompt = PromptTemplate(
            template=PROMPT_TEMPLATE,
            input_variables=["context", "question"]
        )

        # Creazione della Catena RAG con RetrievalQA
        if self.vectorstore:
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=self.vectorstore.as_retriever(k=CONFIG["k_retrieval"]),
                chain_type_kwargs={"prompt": prompt}
            )
            print("✅ Catena RAG LangChain (RetrievalQA) inizializzata.")
        else:
             print("❌ Vector Store non inizializzato, la catena RAG non può essere creata.")

    # --- Metodi di Supporto (Omessi per brevità, sono gli stessi della risposta precedente) ---
    def _crea_descrizione_albero(self):
        # ... (Logica per creare la descrizione) ...
        parti = []
        if self.albero_corrente.get('soprannome'):
            parti.append(f"Mi chiamo {self.albero_corrente['soprannome']}.")
        if self.albero_corrente.get('specie nome volgare'):
             parti.append(f"Sono un {self.albero_corrente['specie nome volgare']}.")
        if self.albero_corrente.get('eta'):
             parti.append(f"Ho {self.albero_corrente['eta']} anni.")
        if self.albero_corrente.get('comune'):
             parti.append(f"Mi trovo a {self.albero_corrente['comune']}.")
             
        descrizione = " ".join(parti)
        if not descrizione:
            descrizione = "Sono un albero monumentale con dettagli non specificati."
        return descrizione
    
    def _prepara_dati_albero_e_rag(self):
        """Prepara i dati per l'indicizzazione RAG usando LangChain."""
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CONFIG["chunk_size"],
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " "]
        )
        
        doc = Document(page_content=self.descrizione_corrente, metadata={"source": "dati_albero"})
        chunks = text_splitter.split_documents([doc])
        
        if self.specie_corrente:
            specie_content = json.dumps(self.specie_corrente, ensure_ascii=False)
            doc_specie = Document(page_content="Informazioni approfondite sulla mia specie (Famiglia, ecc.): " + specie_content, metadata={"source": "dati_specie"})
            chunks.extend(text_splitter.split_documents([doc_specie]))
        
        if chunks:
            self.vectorstore = FAISS.from_documents(
                documents=chunks,
                embedding=self.embeddings
            )
    
    def genera_risposta(self, domanda: str) -> str:
        """Genera una risposta usando la catena RetrievalQA o fallback"""
        try:
            if self.llm_disponibile and self.qa_chain:
                result = self.qa_chain.invoke({"query": domanda})
                return str(result.get("result", "")).strip()
            else:
                return self._risposta_fallback(domanda)
                
        except Exception as e:
            return self._risposta_fallback(domanda)
    
    def _risposta_fallback(self, domanda: str) -> str:
        # ... (Logica per risposte di fallback) ...
        domanda_lower = domanda.lower()
        
        if any(term in domanda_lower for term in ["come ti chiami", "nome"]):
            nome = self.albero_corrente.get('soprannome', 'un albero monumentale')
            return f"Sono {nome}, piacere di conoscerti!"
        
        elif any(term in domanda_lower for term in ["età", "anni"]):
            eta = self.albero_corrente.get('eta', 'molti')
            return f"Conto {eta} primavere, testimone del tempo."
        
        else:
            return f"Dalla mia esperienza, posso dirti questo: {self.descrizione_corrente[:100]}... Purtroppo il mio spirito è antico e non riesco a elaborare subito la tua domanda. Controlla la mia chiave API se vuoi una risposta migliore."

# --- API ENDPOINTS (Non modificati) ---
# ... (Mantieni le route Flask /api/health, /api/chatbot-status, /api/initialize-chatbot, /api/chat) ...
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'Chatbot API is running'})

@app.route('/api/chatbot-status', methods=['GET'])
def chatbot_status():
    global chatbot
    if chatbot is None:
        return jsonify({'success': False, 'initialized': False, 'message': 'Chatbot non inizializzato'})
    tree_name = chatbot.albero_corrente.get('soprannome') or chatbot.albero_corrente.get('specie nome volgare') or 'Albero Monumentale'
    return jsonify({'success': True, 'initialized': True, 'tree_name': tree_name, 'message': 'Chatbot inizializzato e pronto', 'llm_status': 'Gemini API' if chatbot.llm_disponibile else 'Fallback'})

@app.route('/api/initialize-chatbot', methods=['POST'])
def initialize_chatbot():
    global chatbot
    try:
        data = request.get_json()
        tree_data = data.get('tree_data')
        species_data = data.get('species_data')
        
        if not tree_data:
            return jsonify({'success': False, 'error': 'Dati albero mancanti'}), 400

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
        
        chatbot = ChatbotAlberoMonumentale(tree_data_clean, species_data_clean)
        
        tree_name = tree_data_clean.get('soprannome') or tree_data_clean.get('specie nome volgare') or 'Albero Monumentale'
        
        return jsonify({'success': True, 'message': 'Chatbot inizializzato', 'tree_name': tree_name})
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def handle_chat():
    global chatbot
    try:
        if chatbot is None:
            return jsonify({'success': False, 'error': 'Chatbot non inizializzato'}), 400
        
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'success': False, 'error': 'Messaggio vuoto'}), 400
        
        bot_response = chatbot.genera_risposta(user_message)
        
        return jsonify({'success': True, 'response': bot_response, 'tree_name': chatbot.albero_corrente.get('soprannome', 'Albero Monumentale')})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # Ricorda di impostare la variabile d'ambiente GEMINI_API_KEY
    # Esempio nel terminale: export GEMINI_API_KEY="LA_TUA_CHIAVE"
    print("🚀 Starting Tree Chatbot API...")
    app.run(debug=True, port=5000, host='0.0.0.0')