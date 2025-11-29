"use client"
//382508
// pages/questionario.jsx
import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Button, Form } from "react-bootstrap";
import Title from "@component/ui/Title";

import { db } from "@service/firebase";
import { collection, addDoc } from "firebase/firestore";

// Refactored LikertRow with React-Bootstrap Row/Col layout and compact green radiobuttons
import { Row, Col } from "react-bootstrap";

const LikertRow = ({ left, right, keyName, value, onChange, style }) => {
  return (
    <Row className={`my-4 align-items-center  justify-content-center mx-1`}>
      <style>{`
        .likert-radio input[type='radio'] {
          width: 14px;
          height: 14px;
          accent-color: #4B6744;
          cursor: pointer;
        }
        .likert-radio.big input[type='radio'] {
          width: 20px;
          height: 20px;
        }
        .likert-radio.small input[type='radio'] {
          width: 10px;
          height: 10px;
        }
        .text-label{
          font-size: 11px;
        }
      `}</style>

      {/* LEFT LABEL – 1 column also on mobile */}
      <Col xs={2} className="p-0 m-0 justify-content-end text-label">{left}</Col>

      {/* RADIO INPUTS – 10 columns */}
      <Col xs={7} className="d-flex justify-content-between align-items-center">
        {[1, 2, 3, 4, 5, 6, 7].map((val, index) => (
          <label
            key={val}
            className={`likert-radio ${index === 0 || index === 6 ? "big" : index === 3 ? "small" : ""}`}
          >
            <input
              type="radio"
              name={keyName}
              value={val}
              checked={value === val}
              onChange={() => onChange(val)}
            />
          </label>
        ))}
      </Col>

      {/* RIGHT LABEL – 1 column also on mobile */}
      <Col xs={2} className="p-0 m-0 justify-content-star text-label">{right}</Col>
    </Row>
  );
};

export default function Questionario() {
  const [page, setPage] = useState(1);
  const [age, setAge] = useState("");
  const [experience, setExperience] = useState("");
  const [likert, setLikert] = useState({});
  const [textMemory, setTextMemory] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [randomRows, setRandomRows] = useState([]);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setAudioBlob(blob);
      setAudioFile(blob); // se vuoi inviare a Firestore/Storage
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  } catch (err) {
    alert("Microfono non disponibile.");
  }
};

const stopRecording = () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
  }
  setIsRecording(false);
};



  const allRows = [
    ["fastidioso", "piacevole"],
    ["incomprensibile", "comprensibile"],
    ["creativo", "privo di fantasia"],
    ["facile da apprendere", "difficile da apprendere"],
    ["di grande valore", "di poco valore"],
    ["noioso", "appassionante"],
    ["non interessante", "interessante"],
    ["imprevedibile", "prevedibile"],
    ["veloce", "lento"],
    ["originale", "convenzionale"],
    ["ostruttivo", "di supporto"],
    ["buono", "scarso"],
    ["complicato", "facile"],
    ["repellente", "attraente"],
    ["usuale", "moderno"],
    ["sgradevole", "gradevole"],
    ["sicuro", "insicuro"],
    ["attivante", "soporifero"],
    ["conforme alle aspettative", "non conforme alle aspettative"],
    ["inefficiente", "efficiente"],
    ["chiaro", "confuso"],
    ["non pragmatico", "pragmatico"],
    ["ordinato", "sovraccarico"],
    ["invitante", "non invitante"],
    ["congeniale", "ostile"],
    ["conservativo", "innovativo"],
  ];

  // Shuffle utility
  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

  // Shuffle rows only once when entering page 2
  useEffect(() => {
    if (page === 2 && randomRows.length === 0) {
      setRandomRows(shuffleArray(allRows));
    }
  }, [page]);

  const handleNext = () => {
    if (page === 1) {
      if (!age || !experience) {
        alert("Compila tutti i campi obbligatori");
        return;
      }
    }
    setPage(page + 1);
  };

  const handlePrev = () => setPage(page - 1);

  const handleLikertChange = (label, value) => {
    setLikert((prev) => ({ ...prev, [label]: value }));
  };

  const submitAll = async () => {
    await addDoc(collection(db, "questionari"), {
      eta: age,
      esperienza: experience,
      risposte: likert,
      memoriaTesto: textMemory || null,
      memoriaAudio: audioFile ? audioFile.name : null,
      timestamp: new Date().toISOString(),
    });

    alert("Questionario inviato!");
  };

  return (
    <Container className="py-5 text-center">
      <style>{`
        div{font-family: Arial; font-size:12px}
        input{font-size:12px}
        .likert-radio input[type='radio'] {
          width: 20px;
          height: 20px;
          accent-color: black;
        }
        .likert-radio:nth-child(1) input {
          width: 28px;
          height: 28px;
        }
        .likert-radio:nth-child(4) input {
          width: 16px;
          height: 16px;
        }
        .likert-radio:nth-child(7) input {
          width: 28px;
          height: 28px;
        }
        .form-select{font-size:12px}
      `}</style>
      <Title text="Valuta l'esperienza"></Title>

      {/* ---------------- PAGINA 1 ---------------- */}
      {page === 1 && (
        <div>
          <p className="text-end fst-italic">Pagina 1</p>

          <LikertRow
            left="pessima"
            right="ottima"
            keyName="pessima_ottima"
            value={likert["pessima_ottima"]}
            onChange={(val) => handleLikertChange("pessima_ottima", val)}
            style={"justify-content-end"}
          />

          
          <p className="text-center fw-bold mx-1 m-0">Compila i campi relativi all'utente</p>
          <Form.Group className="m-1">
            <Form.Label>Fascia d'età</Form.Label>
            <Form.Select
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
            >
              <option value="">Seleziona...</option>
              <option>10-20</option>
              <option>21-30</option>
              <option>31-40</option>
              <option>41-50</option>
              <option>51-60</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="pb-5">
            <Form.Label>Esperienza svolta</Form.Label>
            <Form.Select
              required
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="">Seleziona...</option>
              <option>statico</option>
              <option>chatbot narrativo</option>
              <option>chatbot scientifico</option>
            </Form.Select>
          </Form.Group>

          <p className="m-0"><strong>Quanto reputi utile l'utilizzo in loco di quest'applicazione per conoscere maggiori informazioni sull'albero monumentale?</strong></p>
          <LikertRow
            left="inutile"
            right="utile"
            keyName="online"
            value={likert["online"]}
            onChange={(val) => handleLikertChange("online", val)}
            style={"justify-content-end"}
          />

          <p><strong>Quanto reputi utile l'utilizzo remoto per invogliare l'utente ad andare a visitare gli alberi monumentali?</strong></p>
          <LikertRow
            left="inutile"
            right="utile"
            keyName="remoto"
            value={likert["remoto"]}
            onChange={(val) => handleLikertChange("remoto", val)}
            style={"justify-content-end"}
          />

          <div className="text-end mt-2">
            <Button className="myrtle" onClick={handleNext}>Avanti</Button>
          </div>
          
        </div>
      )}

      {/* ---------------- PAGINA 2 ---------------- */}
      {page === 2 && (
        <div>
          <p className="text-end fst-italic">Pagina 2</p>

          {randomRows.map(([left, right], i) => {
            const key = `${left}_${right}`;

            return (
              <LikertRow
                key={i}
                left={left}
                right={right}
                keyName={key}
                value={likert[key]}
                onChange={(val) => handleLikertChange(key, val)}
                style={"justify-content-center"}       
              />
            );
          })}


          <div className="mt-4 d-flex justify-content-between">
            <Button onClick={handlePrev} className="gray">Indietro</Button>
            <Button onClick={handleNext} className="myrtle">Avanti</Button>
          </div>
        </div>
      )}

      {/* ---------------- PAGINA 3 ---------------- */}
      {page === 3 && (
        <div>
          <p className="text-end fst-italic">Pagina 3</p>
          <p className="fw-bold">Quali informazioni ricordi sull'albero?</p>

          <Form.Group className="mb-3">
            <Form.Label>Risposta testuale (opzionale)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={textMemory}
              onChange={(e) => setTextMemory(e.target.value)}
            />
          </Form.Group>

          <div className="mt-4 d-flex justify-content-between">
            <Button onClick={handlePrev} className="gray">Indietro</Button>
            <Button onClick={submitAll} className="myrtle">Invia</Button>
          </div>
        </div>
      )}
    </Container>
  );
}
