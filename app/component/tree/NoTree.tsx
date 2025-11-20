"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import styles from "./NoTree.module.css";
import { Container, Accordion } from "react-bootstrap";
import {FormState} from '@service/types/interface_db'
import { saveTreeData } from '@service/userServices'; // Importa la funzione saveTreeData

export default function NoTree() {
  const [form, setForm] = useState<FormState>({
    nome: "",
    altezza: "",
    circonferenza: "",
    posizione: "",
    numeroEsemplari: "",
    comune: "",
    localita: "",
    via: "",
    proprieta: "pubblica",
    proprietario: "",
    motivi: [],
    descrizione: "",
    cognome: "",
    nomeSegnalante: "",
    indirizzo: "",
    telefono: "",
    mail: "",
  });

  const [foto, setFoto] = useState<File | null>(null);

  // Gestione del cambiamento dei campi
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.currentTarget;
    const checked = (e.currentTarget as HTMLInputElement).checked;

    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        motivi: checked
          ? [...prev.motivi, value]
          : prev.motivi.filter((m) => m !== value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Gestione del submit del form
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const docId = await saveTreeData(form, foto);
      console.log("ID del documento salvato:", docId);
      alert("Segnalazione inviata con successo!");
    } catch (error) {
      console.error("Errore nell'invio della segnalazione:", error);
      alert("Si è verificato un errore. Riprova più tardi.");
    }
  };

  return (
    <Container>
      {/* Wrapper con immagine dietro */}
      <div className={styles.headerWrapper}>
        <h1 className={styles.title}>
          Nessun albero monumentale segnalato in questa posizione
        </h1>
      </div>
      <p className="text-center">
        Vuoi segnalarne uno nuovo? <br /> Compila il modulo qui sotto.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* --- MOTIVI --- */}
        <p className="mt-3 mb-0 fw-bold">Motivo della segnalazione*</p>
        <div className={styles.checkGrid}>
          {[
            "Dimensioni notevoli",
            "Valore paesaggistico",
            "Rarità botanica",
            "Valore architettonico",
            "Valore storico, culturale o religioso",
            "Forma o portamento particolari",
          ].map((m, i) => (
            <label key={i} className={styles.checkLabel}>
              <input
                type="checkbox"
                name="motivi"
                value={m}
                checked={form.motivi.includes(m)}
                onChange={handleChange}
              />
              {m}
            </label>
          ))}
        </div>

        <label className="mt-2 fw-bold">
          Descrizione della motivazione*:
          <textarea
            name="descrizione"
            rows={3}
            value={form.descrizione}
            onChange={handleChange}
          />
        </label>

        <label className="mt-2 fw-bold">
          Mail*:
          <input
            type="email"
            name="mail"
            value={form.mail}
            onChange={handleChange}
            required
          />
        </label>

        {/* --- ACCORDION SEZIONI OPZIONALI --- */}
        <Accordion alwaysOpen={false} className={`${styles.accordion} mt-3`}>
          {/* Dati del segnalante */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>Dati del segnalante</Accordion.Header>
            <Accordion.Body className="p-2 mx-1 gap-2">
              <div className={styles.row}>
                <label>
                  Cognome:
                  <input
                    name="cognome"
                    value={form.cognome}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Nome:
                  <input
                    name="nomeSegnalante"
                    value={form.nomeSegnalante}
                    onChange={handleChange}
                  />
                </label>
              </div>
              <label>
                Indirizzo:
                <input
                  name="indirizzo"
                  value={form.indirizzo}
                  onChange={handleChange}
                />
              </label>
              <label>
                Telefono:
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                />
              </label>
            </Accordion.Body>
          </Accordion.Item>

          {/* Dati identificativi */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>Dati identificativi dell'albero</Accordion.Header>
            <Accordion.Body className="p-2 mx-1 gap-2">
              <label>
                Nome comune o scientifico:
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                />
              </label>
              <label>
                Altezza stimata (m):
                <input
                  name="altezza"
                  value={form.altezza}
                  onChange={handleChange}
                />
              </label>
              <label>
                Circonferenza fusto (cm):
                <input
                  name="circonferenza"
                  value={form.circonferenza}
                  onChange={handleChange}
                />
              </label>
              <label>
                Numero esemplari:
                <select
                  name="posizione"
                  value={form.posizione}
                  onChange={handleChange}
                >
                  <option value="">-</option>
                  <option value="singolo">Albero singolo</option>
                  <option value="filare">Filare</option>
                  <option value="viale">Viale alberato</option>
                  <option value="gruppo">Gruppo</option>
                  <option value="bosco">Bosco</option>
                </select>
              </label>
            </Accordion.Body>
          </Accordion.Item>

          {/* Ubicazione */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>Ubicazione</Accordion.Header>
            <Accordion.Body className="p-2 mx-1 gap-2">
              <label>
                Località:
                <input
                  name="localita"
                  value={form.localita}
                  onChange={handleChange}
                />
              </label>
              <label>
                Via/Piazza:
                <input
                  name="via"
                  value={form.via}
                  onChange={handleChange}
                />
              </label>
              <label>
                Proprietà:
                <select
                  name="proprieta"
                  value={form.proprieta}
                  onChange={handleChange}
                >
                  <option value="">-</option>
                  <option value="pubblica">Pubblica</option>
                  <option value="privata">Privata</option>
                </select>
              </label>
              <label>
                Proprietario (se privata):
                <input
                  name="proprietario"
                  value={form.proprietario}
                  onChange={handleChange}
                />
              </label>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <label className="mt-3">
          Foto (opzionale):
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFoto(e.target.files?.[0] || null)}
          />
        </label>

        <div className="text-center mt-2">
          <button type="submit" className={styles.submitBtn}>
            Invia segnalazione
          </button>
        </div>
      </form>
    </Container>
  );
}
