export type ThreatExplorerCode =
  | "ghost_gear"
  | "coral_bleaching"
  | "marine_debris"
  | "physical_reef_damage";

export type ThreatExplorerItem = {
  code: ThreatExplorerCode;
  label: string;
  number: string;
  eyebrow: string;
  summary: string;
  looksLike: string;
  impact: string;
  recognitionCues: string[];
  safety: string;
  image: string;
  imageAlt: string;
};

export const threatExplorerItems: ThreatExplorerItem[] = [
  {
    code: "ghost_gear",
    label: "Ghost fishing gear",
    number: "01",
    eyebrow: "Entanglement threat",
    summary: "Lost or abandoned nets, lines, traps or ropes that continue to catch wildlife and damage coral.",
    looksLike: "Netting, rope, hooks or traps caught across coral, drifting underwater or resting on the seabed.",
    impact: "It can entangle turtles and fish, break living coral, and keep causing harm long after it was lost.",
    recognitionCues: ["Mesh or rope wrapped around coral", "Animals trapped or restricted", "Gear with no vessel or diver attending it"],
    safety: "Keep clear of hooks and loose lines. Photograph it from a safe distance and never attempt removal unless trained and authorised.",
    image: "/images/threats/ghost-fishing-gear-photo.jpg",
    imageAlt: "Abandoned fishing net and rope tangled across a coral reef",
  },
  {
    code: "coral_bleaching",
    label: "Coral bleaching",
    number: "02",
    eyebrow: "Heat stress signal",
    summary: "Coral that has become unusually pale or white after losing the algae that provide much of its colour and energy.",
    looksLike: "A single colony or wider reef area that appears bright white, very pale, or patchy compared with nearby coral.",
    impact: "Bleached coral is under stress and more vulnerable to disease and death, though it may recover if conditions improve.",
    recognitionCues: ["Unusually white or washed-out tissue", "Several nearby colonies showing similar paling", "A visible contrast with normally coloured coral"],
    safety: "Observe without touching. Keep good buoyancy, avoid stirring sediment, and capture both a close and wider view if safe.",
    image: "/images/threats/coral-bleaching-photo.jpg",
    imageAlt: "Pale white bleached coral beside darker healthy-looking coral",
  },
  {
    code: "marine_debris",
    label: "Marine debris",
    number: "03",
    eyebrow: "Human-made waste",
    summary: "Plastic, metal, glass, fabric and other discarded material resting on or moving through the reef environment.",
    looksLike: "Bottles, packaging, bags, cans, fabric or mixed waste touching coral, lodged in reef gaps or drifting nearby.",
    impact: "Debris can smother or scrape coral, be eaten by wildlife, introduce toxins, and create sharp or entangling hazards.",
    recognitionCues: ["Clearly human-made material", "Waste touching or covering coral", "Sharp, hazardous or entangling objects"],
    safety: "Do not handle sharp, chemical, medical or entangling waste. Record the type, amount and location from a safe position.",
    image: "/images/threats/marine-debris-photo.png",
    imageAlt: "Plastic and discarded material lying across part of a coral reef",
  },
  {
    code: "physical_reef_damage",
    label: "Physical reef damage",
    number: "04",
    eyebrow: "Breakage and abrasion",
    summary: "Recently broken, crushed or scraped coral that may be linked to anchors, vessels, equipment or direct contact.",
    looksLike: "Fresh pale break surfaces, scattered fragments, scrape tracks, toppled coral or a concentrated damaged patch.",
    impact: "Breakage removes living structure, reduces habitat and can take years or decades to recover depending on the coral.",
    recognitionCues: ["Fresh-looking white break surfaces", "Loose fragments below a damaged colony", "A track or impact pattern with a nearby possible cause"],
    safety: "Do not move fragments or confront anyone. Maintain safe buoyancy and document only what you can observe safely.",
    image: "/images/threats/physical-reef-damage-photo.jpg",
    imageAlt: "Broken and damaged coral across an underwater reef area",
  },
];

export const spotTheThreatExamples = [
  { id: "example-net", threatCode: "ghost_gear" as const, prompt: "What is wrapped across this reef?", image: "/images/threats/ghost-fishing-gear-photo.jpg", imageAlt: "Netting tangled across coral", explanation: "Look for the repeated mesh pattern and loose lines crossing living coral." },
  { id: "example-bleaching", threatCode: "coral_bleaching" as const, prompt: "What change is visible across this coral?", image: "/images/threats/coral-bleaching-photo.jpg", imageAlt: "White coral among darker coral", explanation: "The unusually white tissue compared with nearby coral is the key recognition cue." },
];
