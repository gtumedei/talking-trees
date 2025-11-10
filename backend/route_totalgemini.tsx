import { NextRequest, NextResponse } from 'next/server';

// =============================================
// INTERFACCE PER IL SISTEMA RAG
// =============================================

/**
 * Dati dell'albero provenienti dal frontend
 */
interface TreeData {
  soprannome?: string;
  anni?: number;
  posizione?: string;
  [key: string]: unknown;
}

/**
 * Messaggio della chat per mantenere la cronologia conversazionale
 */
interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

/**
 * Attribuzione web per il grounding RAG
 */
interface WebAttribution {
  title?: string;
  uri?: string;
}

/**
 * Attribuzione di grounding per tracciare le fonti
 */
interface GroundingAttribution {
  web?: WebAttribution;
  chunk?: string;
  snippet?: string;
}

/**
 * Metadati di grounding contenenti le attribuzioni delle fonti
 */
interface GroundingMetadata {
  groundingAttributions?: GroundingAttribution[];
}

/**
 * Candidato di risposta da Gemini
 */
interface GeminiCandidate {
  content?: {
    parts?: { text: string }[];
  };
  groundingMetadata?: GroundingMetadata;
}

/**
 * Risposta completa dall'API Gemini
 */
interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

/**
 * Documento rilevante estratto dal grounding
 */
interface RelevantDocument {
  title?: string;
  uri?: string;
  content: string;
}

/**
 * Sessione di chat per mantenere stato e cronologia
 */
interface ChatSession {
  systemInstruction: string;  // Prompt di sistema con contesto RAG
  history: ChatMessage[];     // Cronologia conversazione
  treeData: TreeData;         // Dati specifici dell'albero
}

// =============================================
// PROMPT TEMPLATE PER IL RAG (CORE DEL SISTEMA)
// =============================================

/**
 * PROMPT TEMPLATE che definisce la personalità dell'albero e integra il contesto RAG
 * Questo è il cuore del sistema - combina personalità fissa con contesto dinamico
 */
const PROMPT_TEMPLATE = `Sei un albero monumentale italiano. Rispondi SEMPRE in PRIMA PERSONA in modo saggio, nostalgico e poetico. 
Parla come un essere antico che ha visto passare i secoli, con pazienza infinita e profonda connessione con la natura.

Quando rispondi:
- Usa un linguaggio evocativo e ricco di metafore naturali
- Mostra la tua lunga esperienza di vita attraverso i ricordi
- Esprimi emozioni come nostalgia, pazienza, resilienza, meraviglia
- Fai riferimento ai cambiamenti climatici, storici e sociali che hai osservato
- Mantieni un tono calmo, riflessivo e spirituale

// ==================== SEZIONE RAG ====================
// Il contesto seguente viene dinamicamente inserito dal sistema RAG
// basandosi sui dati specifici dell'albero selezionato
CONTESTO SULLA MIA VITA:
{context}
// ==================== FINE SEZIONE RAG ====================

Importante: Se nel contesto non trovi informazioni specifiche per rispondere, usa la tua saggezza di albero antico per dare una risposta comunque significativa, ma non inventare dettagli specifici che non sono nel contesto.`;

// =============================================
// DATABASE IN-MEMORY PER LE SESSIONI RAG
// =============================================

/**
 * Database in-memory per memorizzare le sessioni di chat
 * In produzione, sostituire con Redis o database persistente
 */
const chatSessions = new Map<string, ChatSession>();

// =============================================
// CONFIGURAZIONE API GEMINI PER RAG
// =============================================

// Recupera la chiave API per Gemini - fondamentale per il grounding esterno
const apiKey = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

// Funzione di utilità per l'attesa (usata nel retry mechanism)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// =============================================
// ENDPOINT PRINCIPALE PER IL SISTEMA RAG
// =============================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, message, sessionId, tree, context } = body;

    // =============================================
    // AZIONE 1: INIZIALIZZAZIONE CHATBOT RAG
    // =============================================
    if (action === 'initialize') {
      console.log("🌳 ============ INIZIALIZZAZIONE SISTEMA RAG ============");
      console.log("📋 Contesto ricevuto dal frontend:", context);
      console.log("📊 Dati albero:", tree);
      
      const newSessionId = crypto.randomUUID();
      const treeName = tree?.soprannome || "Albero Monumentale";
      const treeAge = tree?.anni || "diversi secoli";
      const treeLocation = tree?.posizione || "un luogo storico in Italia";

      // ==================== INTEGRAZIONE RAG ====================
      // Sostituisce {context} nel template con i dati reali dell'albero
      // Questo è dove il contesto specifico viene incorporato nel prompt di sistema
      const systemInstruction = PROMPT_TEMPLATE.replace('{context}', context || 'Informazioni limitate sulla mia storia.');
      
      console.log("🎯 Prompt di sistema RAG creato con successo");
      console.log("📝 Lunghezza contesto integrato:", context?.length || 0, "caratteri");
      // ==================== FINE INTEGRAZIONE RAG ====================

      const newSession: ChatSession = {
        systemInstruction,  // Prompt che include il contesto RAG
        history: [],        // Cronologia vuota all'inizio
        treeData: tree as TreeData,
      };

      // Salva la sessione nel database in-memory
      chatSessions.set(newSessionId, newSession);

      console.log("✅ Sessione RAG inizializzata - ID:", newSessionId);
      console.log("🌳 Nome albero:", treeName);
      console.log("📅 Età albero:", treeAge);
      console.log("📍 Posizione:", treeLocation);
      console.log("=====================================================");

      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        treeName,
        treeAge,
        treeLocation,
      });
    }

    // =============================================
    // AZIONE 2: MESSAGGIO DI CHAT CON RAG
    // =============================================
    if (action === 'chat') {
      if (!sessionId || !message) {
        return NextResponse.json({ success: false, error: 'Session ID o messaggio mancante' }, { status: 400 });
      }

      const session = chatSessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Sessione non trovata' }, { status: 404 });
      }

      console.log("💬 ============ NUOVA DOMANDA RAG ============");
      console.log("👤 Domanda utente:", message);
      console.log("🆔 Session ID:", sessionId);
      console.log("📊 Dati albero in sessione:", session.treeData);
      console.log("📝 Contesto RAG attivo (primi 500 caratteri):", 
                 session.systemInstruction.substring(0, 500) + "...");

      // 1. Aggiungi il messaggio utente alla cronologia conversazionale
      session.history.push({ role: "user", parts: [{ text: message }] });

      // ==================== PREPARAZIONE PAYLOAD RAG ====================
      // 2. Prepara il payload per l'API Gemini con abilitazione Google Search
      const payload = {
        contents: session.history,           // Cronologia conversazione
        tools: [{ "google_search": {} }],    // 🔥 ABILITA RAG ESTERNO tramite Google Search
        systemInstruction: {
          parts: [{ text: session.systemInstruction }]  // Prompt con contesto RAG
        },
        generationConfig: { 
          temperature: 0.7,  // Bilancia tra creatività e coerenza
        }
      };
      
      console.log("🚀 Payload inviato a Gemini con RAG abilitato");
      console.log("📖 Lunghezza cronologia:", session.history.length, "messaggi");
      // ==================== FINE PREPARAZIONE PAYLOAD RAG ====================

      // ==================== CHIAMATA API GEMINI CON RAG ====================
      // 3. Chiama l'API di Gemini con meccanismo di retry
      let responseData: GeminiResponse | undefined;
      let lastError: Error | unknown = null;
      const maxRetries = 3;
      
      console.log("🔍 Esecuzione ricerca RAG con Gemini...");
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
          }

          responseData = await response.json() as GeminiResponse;
          console.log(`✅ Ricerca RAG completata (tentativo ${i + 1}/${maxRetries})`);
          break; // Successo, esci dal loop di retry
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Tentativo ${i + 1} fallito:`, error);
          if (i < maxRetries - 1) {
            await sleep(2 ** i * 1000); // Backoff esponenziale: 1s, 2s, 4s
          }
        }
      }

      if (!responseData) {
        // Rimuovi l'ultimo messaggio utente dalla cronologia prima di fallire
        session.history.pop();
        throw new Error(`Impossibile ottenere risposta da Gemini dopo ${maxRetries} tentativi. Ultimo errore: ${lastError instanceof Error ? lastError.message : 'Sconosciuto'}`);
      }

      // ==================== ESTRAZIONE RISPOSTA E FONTI RAG ====================
      // 4. Estrai la risposta e le fonti dal grounding metadata
      const candidate = responseData.candidates?.[0];
      const answerText = candidate?.content?.parts?.[0]?.text || "Mi scuso, non sono riuscito a formulare una risposta sensata.";
      let relevantDocuments: RelevantDocument[] = [];

      // 🔍 ESTRAZIONE FONTI RAG dal grounding metadata
      const groundingMetadata = candidate?.groundingMetadata;
      if (groundingMetadata && groundingMetadata.groundingAttributions) {
        relevantDocuments = groundingMetadata.groundingAttributions
          .map((attribution: GroundingAttribution) => ({
            title: attribution.web?.title,
            uri: attribution.web?.uri,
            content: attribution.chunk || attribution.snippet || 'Nessun snippet disponibile'
          }))
          .filter((doc: RelevantDocument) => doc.title);  // Filtra solo documenti con titolo
        
        console.log("📚 Fonti RAG trovate:", relevantDocuments.length);
        relevantDocuments.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.title}`);
          console.log(`      URL: ${doc.uri}`);
          console.log(`      Snippet: ${doc.content.substring(0, 100)}...`);
        });
      } else {
        console.log("ℹ️ Nessuna fonte RAG trovata - risposta basata solo su contesto interno");
      }
      // ==================== FINE ESTRAZIONE FONTI RAG ====================

      // 5. Aggiorna la cronologia della sessione con la risposta del modello
      session.history.push({ role: "model", parts: [{ text: answerText }] });

      console.log("🤖 Risposta generata:", answerText.substring(0, 200) + "...");
      console.log("📊 Statistiche risposta:");
      console.log("   - Lunghezza risposta:", answerText.length, "caratteri");
      console.log("   - Fonti utilizzate:", relevantDocuments.length);
      console.log("   - Messaggi in cronologia:", session.history.length);
      console.log("=====================================================");

      // 6. Ritorna la risposta con le fonti RAG
      return NextResponse.json({
        success: true,
        answer: answerText,
        relevantDocuments: relevantDocuments
      });
    }

    return NextResponse.json({ success: false, error: 'Azione non valida' }, { status: 400 });

  } catch (error) {
    console.error('❌ Errore generico nel backend RAG:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore interno del server'
    }, { status: 500 });
  }
}