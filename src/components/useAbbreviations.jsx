import { useState, useEffect } from "react";

const defaultAbbreviations = [
  { short: "js", full: "JavaScript" },
  { short: "css", full: "Cascading Style Sheets" },
  { short: "py", full: "Python" },
  { short: "html", full: "Hypertext Markup Language" },
  { short: "abvr", full: "Abréviation" },
];

export function useAbbreviations() {
  const [abbreviations, setAbbreviations] = useState(() => {
    const stored = localStorage.getItem("abbreviations");
    return stored ? JSON.parse(stored) : defaultAbbreviations;
  });

  useEffect(() => {
    if (!abbreviations.length) return;
    localStorage.setItem("abbreviations", JSON.stringify(abbreviations));
    window.dispatchEvent(
      new CustomEvent("abbreviation-update", { detail: abbreviations })
    );
  }, [abbreviations]);

  return [abbreviations, setAbbreviations];
}
