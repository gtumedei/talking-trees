# api/rag/route.py

import os
import re
import json
import numpy as np
from typing import List
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from transformers import AutoTokenizer
from langchain_groq import ChatGroq
from langchain_classic.retrievers import BM25Retriever, EnsembleRetriever
from sentence_transformers import CrossEncoder

# ==========================================================
# CONFIGURAZIONE
# ==========================================================
MODEL_ID = "sentence-transformers/all-mpnet-base-v2"
INDEX_PATH = os.getenv("INDEX_PATH", "faiss_index")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

router = APIRouter()

# ==========================================================
# SPLITTING E PREPARAZIONE DOCUMENTI
# ==========================================================
def prepare_documents_from_rag(rag_structure):
    """
    Converte la struttura RAG (JSON) in Document[] per l'embedding
    """
    all_docs = []
    sections = rag_structure.get("sections", [])
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    splitter = RecursiveCharacterTextSplitter.from_huggingface_tokenizer(
        tokenizer, chunk_size=200, chunk_overlap=20, add_start_index=True
    )

    for s in sections:
        title = s.get("type", "Sezione Sconosciuta")
        content = s.get("content", "")
        for i, chunk in enumerate(splitter.split_text(content)):
            metadata = {
                "title": title,
                "chunk_index": i,
                "tags": s.get("tags", []),
                "source": s.get("metadata", {}).get("source", "unknown"),
            }
            all_docs.append(Document(page_content=chunk, metadata=metadata))
    return all_docs

# ==========================================================
# RAG ENGINE (ibrido)
# ==========================================================
class HybridCrossEncoderRAG:
    def __init__(self, index_path=INDEX_PATH, model_id="llama-3.1-8b-instant"):
        self.embedding = HuggingFaceEmbeddings(model_name=MODEL_ID)
        self.index_path = index_path
        self.model_id = model_id
        self._load_vectorstore()

    def _load_vectorstore(self):
        if os.path.exists(self.index_path):
            self.vectorstore = FAISS.load_local(
                folder_path=self.index_path,
                embeddings=self.embedding,
                allow_dangerous_deserialization=True
            )
        else:
            self.vectorstore = None

    def _get_hybrid_retriever(self):
        dense_retriever = self.vectorstore.as_retriever(search_kwargs={"k": 5})
        sparse_retriever = BM25Retriever.from_documents(self.vectorstore.docstore._dict.values())
        return EnsembleRetriever(retrievers=[dense_retriever, sparse_retriever], weights=[0.4, 0.6])

    def initialize_space(self, rag_structure):
        """
        Crea o aggiorna lo spazio vettoriale FAISS
        """
        docs = prepare_documents_from_rag(rag_structure)
        if not docs:
            raise ValueError("Nessun documento valido per l'inizializzazione.")

        self.vectorstore = FAISS.from_documents(docs, self.embedding)
        self.vectorstore.save_local(self.index_path)
        return len(docs)

    def query(self, query_text: str, top_k=3):
        """
        Esegue query sullo spazio vettoriale
        """
        if not self.vectorstore:
            raise RuntimeError("Lo spazio vettoriale non è stato inizializzato.")

        retriever = self._get_hybrid_retriever()
        retrieved_docs = retriever.invoke(query_text)
        if not retrieved_docs:
            return {"response": "Non ho trovato informazioni rilevanti."}

        # Cross-encoder ranking
        ranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        pairs = [(query_text, doc.page_content) for doc in retrieved_docs]
        scores = ranker.predict(pairs)
        ranked_docs = [doc for _, doc in sorted(zip(scores, retrieved_docs), key=lambda x: x[0], reverse=True)]
        top_docs = ranked_docs[:top_k]

        # Generazione della risposta
        llm = ChatGroq(model=self.model_id, temperature=0.3)
        context = "\n\n".join([d.page_content for d in top_docs])
        prompt = PromptTemplate(
            input_variables=["context", "question"],
            template=(
                "Sei un albero saggio. Rispondi in prima persona con tono solenne.\n"
                "### Contesto:\n{context}\n\n### Domanda:\n{question}\n\n### Risposta:"
            ),
        )
        input_text = prompt.format(context=context, question=query_text)
        response = llm.invoke(input_text)
        text = response.content.strip() if hasattr(response, "content") else str(response)

        return {
            "response": text,
            "sources": [d.metadata for d in top_docs],
            "documents_used": len(top_docs)
        }

# ==========================================================
# ROUTE HANDLER API
# ==========================================================
rag_engine = HybridCrossEncoderRAG()

@router.post("")
async def handle_rag_request(request: Request):
    data = await request.json()
    action = data.get("action")

    try:
        if action == "initialize_space":
            rag_structure = data.get("ragStructure")
            if not rag_structure:
                return JSONResponse({"success": False, "error": "ragStructure mancante"}, status_code=400)
            num_docs = rag_engine.initialize_space(rag_structure)
            return JSONResponse({"success": True, "message": f"Inizializzati {num_docs} documenti nel vettore store."})

        elif action == "query":
            query_text = data.get("query")
            if not query_text:
                return JSONResponse({"success": False, "error": "Parametro 'query' mancante"}, status_code=400)
            result = rag_engine.query(query_text)
            return JSONResponse({"success": True, "response": result["response"], "sources": result["sources"]})

        else:
            return JSONResponse({"success": False, "error": f"Azione non riconosciuta: {action}"}, status_code=400)

    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)
