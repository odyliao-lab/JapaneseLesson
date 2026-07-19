"use client";

export default function PrintButton() {
  return <button className="secondary-button" onClick={() => window.print()}>列印／存成 PDF</button>;
}
