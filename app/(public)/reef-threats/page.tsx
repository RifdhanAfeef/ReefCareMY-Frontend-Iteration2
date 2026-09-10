import type { Metadata } from "next";
import { ThreatExplorer } from "@/features/epic-03-threat-explorer/threat-explorer";

export const metadata: Metadata = {
  title: "Reef Threat Explorer",
  description: "Learn how to recognise four common reef threats and report observations safely.",
};

export default function ReefThreatsPage() {
  return <ThreatExplorer />;
}
