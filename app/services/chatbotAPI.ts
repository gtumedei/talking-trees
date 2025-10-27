const API_BASE_URL = 'http://localhost:5000/api';

export interface ChatResponse {
  success: boolean;
  response?: string;
  tree_name?: string;
  message?: string;
  error?: string;
}

export interface InitializeResponse {
  success: boolean;
  message?: string;
  tree_name?: string;
  error?: string;
}

export const chatbotAPI = {
  async initializeChatbot(treeData: any, speciesData?: any): Promise<InitializeResponse> {
    try {
      console.log('🚀 Inizializzazione chatbot...');
      
      const response = await fetch(`${API_BASE_URL}/initialize-chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tree_data: treeData,
          species_data: speciesData 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Chatbot inizializzato:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Errore inizializzazione chatbot:', error);
      return {
        success: false,
        error: 'Backend non raggiungibile. Assicurati che il server Python sia in esecuzione su localhost:5000'
      };
    }
  },

  async getChatbotStatus(): Promise<{success: boolean; initialized?: boolean; tree_name?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot-status`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  },

  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      console.log('📤 Invio messaggio:', message);
      
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Risposta ricevuta:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Errore API:', error);
      return {
        success: false,
        error: 'Impossibile connettersi al servizio chatbot.'
      };
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
};