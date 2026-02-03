// TODO: testare alternative
export const prompts = {
  personified:
    "Rispondi in una frase in 1ª persona in tono epico e solenne come se fossi {treename}.",
  scientific: "Rispondi in terza persona con stile enciclopedico.",
}

// Static sections:
// 1. Informazioni tecniche
// 2. Specie botanica
// 3. Luogo
// 4. Impatto ecologico
// 5. Salute
// 6. Storia ed eventi
// 7. Descrizione -> TODO: Non saprei bene come tradurla in domanda. Nella descrizione c'è un po' di tutto (età, specie, luogo, storia, eventi correlati, ...). Forse "Cosa sai dirmi sul luogo in cui ti trovi?" è effettivamente la migliore, anche se mi sembra si possa sovrapporre facilmente con "Qual è la tua storia".

export const questions = {
  personified: [
    "Chi sei?",
    "Qual è la tua specie botanica?",
    "In che luogo vivi?",
    "Che benefici porti all'ambiente?",
    "Sei in buona salute?",
    "Qual è la tua storia?",
    "Cosa sai dirmi sul luogo in cui ti trovi?",
  ],
  scientific: [
    "Di che albero si tratta?",
    "Qual è la sua specie botanica?",
    "In che luogo si trova?",
    "Che benefici porta all'ambiente?",
    "È in buona salute?",
    "Qual è la sua storia?",
    "Qual è la storia del luogo in cui si trova?",
  ],
}
