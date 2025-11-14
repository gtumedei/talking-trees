"use client";

import React, { JSX } from "react";

// Define types for the props
interface TitleProps {
  text: string;
  level?: number; // optional, default will be 1
  className?: string; // optional, default will be an empty string
}

const Title: React.FC<TitleProps> = ({ text, level = 1, className = "" }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements; // Ensures that level corresponds to a valid heading element

  return (
    <Tag className={className} style={{ fontFamily: 'Marker, sans-serif', textTransform: 'uppercase' }}>
      {text}
    </Tag>
  );
}

export default Title;
