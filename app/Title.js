"use client";

import React from "react";

export default function Title({ text, level = 1, className ="" }) {
  const Tag = `h${level}`; // permette h1, h2, ecc.

  return (
    <Tag className={className}>
      {text.split("").map((char, i) => {
        if (char.match(/[A-Z]/)) {
          return (
            <span key={i} className="nordic">
              {char}
            </span>
          );
        } else if (char.match(/[a-z]/)) {
          return (
            <span key={i} className="oneday">
              {char}
            </span>
          );
        } else {
          return char; // spazi, punteggiatura...
        }
      })}
    </Tag>
  );
}
