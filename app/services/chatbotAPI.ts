// services/chatbotAPI.ts

// Definizione delle interfacce per i documenti rilevanti
export interface RelevantDocument {
  id: string;
  content: string;
  metadata?: {
    source?: string;
    page?: number;
    [key: string]: unknown;
  };
  score?: number;
}

// Definizione dell'interfaccia per l'albero
export interface Tree {
  id: string;
  name?: string;
  age?: number;
  location?: string;
  species?: string;
  [key: string]: unknown;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
  sources?: RelevantDocument[];
}

export interface RAGResponse {
  answer: string;
  relevantDocuments: RelevantDocument[];
  contextUsed: string;
}

export interface InitializeResponse {
  success: boolean;
  tree_name?: string;
  sessionId?: string;
  treeAge?: number;
  treeLocation?: string;
  error?: string;
}

class ChatbotAPI {
  private baseURL: string;
  private currentSessionId: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  // Inizializza il chatbot con RAG
  async initializeChatbot(tree: Tree, species?: string): Promise<InitializeResponse> {
    try {
      console.log('📤 Invio richiesta di inizializzazione:', { 
        tree: tree?.id, 
        species,
        treeObject: tree 
      });

      const requestBody = {
        action: 'initialize',
        tree: tree,
        species: species
      };

      console.log('📦 Body della richiesta:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseURL}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Risposta ricevuta:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Errore risposta:', errorText);
        throw new Error(`Errore HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dati ricevuti:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Errore inizializzazione chatbot');
      }

      this.currentSessionId = data.sessionId;
      
      return {
        success: true,
        tree_name: data.treeName,
        sessionId: data.sessionId,
        treeAge: data.treeAge,
        treeLocation: data.treeLocation
      };
    } catch (error) {
      console.error('💥 Errore inizializzazione:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore di connessione con il servizio'
      };
    }
  }
  
  // Invia messaggio con RAG
  async sendMessage(message: string): Promise<ChatResponse> {
    if (!this.currentSessionId) {
      return {
        success: false,
        error: 'Chatbot non inizializzato. Per favore, riconnetti.'
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/rag/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: this.currentSessionId
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data: RAGResponse = await response.json();
      
      return {
        success: true,
        response: data.answer,
        sources: data.relevantDocuments
      };
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore di connessione'
      };
    }
  }

  // Reset sessione
  resetSession() {
    this.currentSessionId = null;
  }
}

export const chatbotAPI = new ChatbotAPI();