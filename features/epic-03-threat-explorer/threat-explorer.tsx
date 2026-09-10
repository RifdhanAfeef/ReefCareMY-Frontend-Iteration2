"use client";

import { useState } from "react";
import { threatExplorerItems } from "./threat-explorer-data";

export function ThreatExplorer() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = threatExplorerItems[selectedIndex];

  return (
    <div>
      <header>
        <p>Reef Threat Explorer</p>
        <h1>Meet the four threats</h1>
        <p>Learn the visual cues. Understand the impact. Know what to report.</p>
      </header>
      <section aria-label="Supported reef threats">
        {threatExplorerItems.map((threat, index) => (
          <button
            key={threat.code}
            type="button"
            aria-label={`Explore ${threat.label}`}
            aria-pressed={selectedIndex === index}
            onClick={() => setSelectedIndex(index)}
          >
            {threat.label}
          </button>
        ))}
        <p>{selectedIndex + 1} of {threatExplorerItems.length}</p>
      </section>
      <section>
        <h2>{selected.label}</h2>
        <p>{selected.summary}</p>
      </section>
    </div>
  );
}
