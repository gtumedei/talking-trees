// app/api/chatbot/route.ts

import { NextRequest, NextResponse } from 'next/server';

// ** Simulazione di un database di sessione in-memory **
// In un'applicazione reale e scalabile, useresti un database come Redis o Firestore
// per memorizzare la sessione e la cronologia della chat.
interface ChatSession {
    systemInstruction: string;
    history: { role: "user" | "model"; parts: { text: string }[] }[];
    treeData: any;
}

const chatSessions = new Map<string, ChatSession>();

// Recupera la chiave API dal contesto (lasciata vuota per l'ambiente Canvas)
const apiKey = "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

// Funzione di utilità per l'attesa (simulazione backoff o ritardo)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Funzione principale per gestire le richieste POST
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, message, sessionId, tree, species } = body;

        // --- Azione 1: Inizializzazione della Chatbot (Setup della Sessione e Persona) ---
        if (action === 'initialize') {
            const newSessionId = crypto.randomUUID();
            const treeName = tree?.soprannome || "Albero Monumentale";
            const treeAge = tree?.anni || "diversi secoli";
            const treeLocation = tree?.posizione || "un luogo storico in Italia";

            // Istruzione di Sistema: Fissa la persona della LLM
            const systemInstruction = `Sei ${treeName}, un ${species || 'Albero Monumentale'} che ha vissuto per ${treeAge} anni a ${treeLocation}. La tua persona è quella di un saggio, pacifico e antico guardiano della natura. Rispondi a tutte le domande in prima persona come se fossi l'albero. Sii breve, evocativo e focalizzato sull'esperienza di essere un albero.

            Dati contestuali sull'albero (come base per RAG, anche se useremo Google Search per aumentare le risposte):
            - Nome: ${treeName}
            - Specie: ${species || 'Sconosciuta'}
            - Età: ${treeAge} anni.
            - Località: ${treeLocation}.
            
            Usa l'italiano.`;

            const newSession: ChatSession = {
                systemInstruction,
                history: [],
                treeData: tree,
            };

            chatSessions.set(newSessionId, newSession);

            return NextResponse.json({
                success: true,
                sessionId: newSessionId,
                treeName,
                treeAge,
                treeLocation,
            });
        }

        // --- Azione 2: Messaggio di Chat (Interazione LLM) ---
        if (action === 'chat') {
            if (!sessionId || !message) {
                return NextResponse.json({ success: false, error: 'Session ID o messaggio mancante' }, { status: 400 });
            }

            const session = chatSessions.get(sessionId);
            if (!session) {
                return NextResponse.json({ success: false, error: 'Sessione non trovata' }, { status: 404 });
            }

            // 1. Aggiungi il messaggio utente alla cronologia
            session.history.push({ role: "user", parts: [{ text: message }] });

            // 2. Prepara il payload per l'API Gemini
            const payload = {
                contents: session.history,
                tools: [{ "google_search": {} }], // Abilita il grounding RAG tramite Google Search
                systemInstruction: {
                    parts: [{ text: session.systemInstruction }]
                },
                // ** CORREZIONE: Sposto i parametri di configurazione in generationConfig **
                generationConfig: { 
                    temperature: 0.7,
                }
            };

            // 3. Chiama l'API di Gemini con Backoff (per gestione errori)
            let responseData;
            let lastError: any = null;
            const maxRetries = 3;
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

                    responseData = await response.json();
                    break; // Successo, esci dal loop di retry
                } catch (error) {
                    lastError = error;
                    if (i < maxRetries - 1) {
                        await sleep(2 ** i * 1000); // Backoff esponenziale: 1s, 2s, 4s
                    }
                }
            }

            if (!responseData) {
                // Rimuovi l'ultimo messaggio utente dalla cronologia prima di fallire
                session.history.pop();
                throw new Error(`Impossibile ottenere risposta da Gemini dopo ${maxRetries} tentativi. Ultimo errore: ${lastError?.message || 'Sconosciuto'}`);
            }

            // 4. Estrai la risposta e le fonti
            const candidate = responseData.candidates?.[0];
            const answerText = candidate?.content?.parts?.[0]?.text || "Mi scuso, non sono riuscito a formulare una risposta sensata.";
            let relevantDocuments: any[] = [];

            const groundingMetadata = candidate?.groundingMetadata;
            if (groundingMetadata && groundingMetadata.groundingAttributions) {
                relevantDocuments = groundingMetadata.groundingAttributions
                    .map((attribution: any) => ({
                        title: attribution.web?.title,
                        uri: attribution.web?.uri,
                        content: attribution.chunk || attribution.snippet || 'Nessun snippet disponibile'
                    }))
                    .filter((doc: any) => doc.title); // Filtra per assicurare che ci sia almeno un titolo
            }

            // 5. Aggiorna la cronologia della sessione con la risposta del modello
            session.history.push({ role: "model", parts: [{ text: answerText }] });

            // 6. Ritorna la risposta
            return NextResponse.json({
                success: true,
                answer: answerText,
                relevantDocuments: relevantDocuments
            });
        }

        return NextResponse.json({ success: false, error: 'Azione non valida' }, { status: 400 });

    } catch (error) {
        console.error('Errore generico nel backend:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Errore interno del server'
        }, { status: 500 });
    }
}