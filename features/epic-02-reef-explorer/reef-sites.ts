import type { ReefSite } from "./types";

const commonPreparation = [
  "Confirm current sea, weather and site conditions with a licensed dive operator.",
  "Bring your certification details and follow the operator's equipment and safety guidance.",
];

const sources = {
  Perhentian: { label: "Tourism Malaysia — Pulau Perhentian", url: "https://ebrochures.malaysia.travel/en/dive-in-paradise/pulau-perhentian/" },
  Redang: { label: "Tourism Malaysia — Pulau Redang", url: "https://ebrochures.malaysia.travel/en/dive-in-paradise/pulau-redang/" },
  Tioman: { label: "Tourism Malaysia — Pulau Tioman", url: "https://ebrochures.malaysia.travel/en/dive-in-paradise/pulau-tioman/" },
} as const;

export const reefSites: ReefSite[] = [
  {
    id: "perhentian-d-lagoon", name: "D'Lagoon", island: "Perhentian", publicAreaLabel: "Perhentian Islands", position: [5.905, 102.735],
    introduction: "A Perhentian dive site known for a mix of soft and hard coral habitat and colourful reef fish.",
    images: [
      { src: "/images/reef-sites/perhentian-reef-1.webp", alt: "Clownfish among anemones in the Perhentian Islands" },
      { src: "/images/reef-sites/perhentian-reef-2.webp", alt: "A diver and reef life in the Perhentian Islands" },
    ],
    reefFeatures: [
      { title: "Mixed coral habitat", description: "Tourism Malaysia describes both soft and hard corals at this site." },
      { title: "Reef-fish viewing", description: "Angelfish, parrotfish and black-spotted snappers are representative sightings." },
    ],
    marineLife: ["Reef fish may include angelfish, parrotfish and snappers.", "Turtles or manta rays may occasionally be seen, but sightings are never guaranteed."],
    popularReasons: ["Colourful coral and reef-fish scenery", "Relaxed island diving and underwater photography"],
    experience: { level: "Beginner", explanation: "Often presented as an approachable reef dive, but suitability depends on conditions and operator assessment." },
    preparation: commonPreparation, source: sources.Perhentian, publicActivity: [],
  },
  {
    id: "perhentian-sail-rock", name: "Sail Rock", island: "Perhentian", publicAreaLabel: "Perhentian Islands", position: [5.915, 102.755],
    introduction: "A named Perhentian reef site with varied coral forms and opportunities to observe reef fish.",
    images: [
      { src: "/images/reef-sites/perhentian-reef-2.webp", alt: "A diver exploring reef habitat in the Perhentian Islands" },
      { src: "/images/reef-sites/perhentian-reef-1.webp", alt: "Clownfish and anemones in the Perhentian Islands" },
    ],
    reefFeatures: [
      { title: "Varied coral forms", description: "Staghorn, lettuce and table corals are described for this area." },
      { title: "Small reef life", description: "The site may support stingrays, boxfish, angelfish and parrotfish." },
    ],
    marineLife: ["Representative sightings include boxfish, angelfish and parrotfish.", "Wildlife presence changes with season and conditions."],
    popularReasons: ["Varied coral structure", "Underwater scenery and reef photography"],
    experience: { level: "Intermediate", explanation: "Divers should confirm current depth, current and entry conditions with their operator." },
    preparation: commonPreparation, source: sources.Perhentian, publicActivity: [],
  },
  {
    id: "redang-tanjung-tokong", name: "Tanjung Tokong", island: "Redang", publicAreaLabel: "Redang Island", position: [5.785, 103.015],
    introduction: "A Redang dive site shaped by submerged boulders, swim-throughs and coral-covered overhangs.",
    images: [
      { src: "/images/reef-sites/redang-reef-1.webp", alt: "Table coral in the waters around Redang Island" },
      { src: "/images/reef-sites/redang-reef-2.webp", alt: "A hawksbill turtle near Redang Island reef habitat" },
    ],
    reefFeatures: [
      { title: "Boulders and swim-throughs", description: "The underwater landscape includes submerged boulders and coral overhangs." },
      { title: "Staghorn coral", description: "Staghorn coral can be seen in the shallower part of the dive." },
    ],
    marineLife: ["Nudibranchs and groupers are representative sightings.", "Larger fish may pass through, but sightings cannot be guaranteed."],
    popularReasons: ["Distinct underwater structure", "Macro life and reef photography"],
    experience: { level: "Intermediate", explanation: "Mild current is common according to the source; an operator must confirm suitability on the day." },
    preparation: commonPreparation, source: sources.Redang, publicActivity: [],
  },
  {
    id: "redang-big-mount", name: "Big Mount", island: "Redang", publicAreaLabel: "Redang Island", position: [5.77, 103.005],
    introduction: "A Redang site featuring underwater boulders, coral habitat, sponges and anemones.",
    images: [
      { src: "/images/reef-sites/redang-reef-2.webp", alt: "A hawksbill turtle near a Redang Island reef" },
      { src: "/images/reef-sites/redang-reef-1.webp", alt: "Table coral representing Redang Island reef habitat" },
    ],
    reefFeatures: [
      { title: "Boulder reef", description: "Large boulders support hard and soft corals, sponges and anemones." },
      { title: "Open-water activity", description: "Schooling fish may be seen around the reef structure." },
    ],
    marineLife: ["Groupers, pufferfish and schooling fish are representative possibilities.", "Marine-life sightings vary and are not promised."],
    popularReasons: ["Boulder and coral scenery", "Varied fish life"],
    experience: { level: "Experienced", explanation: "Depth and water movement can make this site more demanding; confirm requirements with the operator." },
    preparation: commonPreparation, source: sources.Redang, publicActivity: [],
  },
  {
    id: "tioman-renggis", name: "Renggis Island", island: "Tioman", publicAreaLabel: "Tioman Island", position: [2.805, 104.12],
    introduction: "A well-known site off Tekek Beach with hard-coral gardens and varied reef life.",
    images: [
      { src: "/images/reef-sites/tioman-reef-1.webp", alt: "Coral and reef fish around Tioman Island" },
      { src: "/images/reef-sites/tioman-reef-2.webp", alt: "A diver exploring the waters around Tioman Island" },
    ],
    reefFeatures: [
      { title: "Hard-coral gardens", description: "The site is described for broad hard-coral habitat close to Tioman." },
      { title: "Reef and pelagic life", description: "Cuttlefish, angelfish, barracuda and turtles are representative possibilities." },
    ],
    marineLife: ["Cuttlefish, angelfish and barracuda may be present.", "Turtle sightings are possible but never guaranteed."],
    popularReasons: ["Accessible reef scenery near Tekek", "Marine-life viewing and photography"],
    experience: { level: "Beginner", explanation: "It is commonly used for recreational diving, but the operator must assess conditions and each diver." },
    preparation: commonPreparation, source: sources.Tioman, publicActivity: [],
  },
  {
    id: "tioman-chebeh", name: "Chebeh", island: "Tioman", publicAreaLabel: "Tioman Island", position: [2.835, 104.17],
    introduction: "A deeper Tioman dive area known for dramatic underwater scenery and gorgonian fans.",
    images: [
      { src: "/images/reef-sites/tioman-reef-2.webp", alt: "A diver in blue water around Tioman Island" },
      { src: "/images/reef-sites/tioman-reef-1.webp", alt: "Coral and fish representing Tioman Island reef habitat" },
    ],
    reefFeatures: [
      { title: "Deep-water scenery", description: "The site is associated with deeper diving and large gorgonian fans." },
      { title: "Large-animal possibility", description: "Manta rays may be encountered, but a sighting is never guaranteed." },
    ],
    marineLife: ["Gorgonian fans are a notable feature.", "Giant manta rays may appear under suitable conditions, without any guarantee."],
    popularReasons: ["Deeper, more dramatic diving", "Large coral fans and possible pelagic encounters"],
    experience: { level: "Experienced", explanation: "Deeper conditions require suitable training, experience and operator approval." },
    preparation: commonPreparation, source: sources.Tioman, publicActivity: [],
  },
];

export const reefIslands = ["Perhentian", "Redang", "Tioman"] as const;
