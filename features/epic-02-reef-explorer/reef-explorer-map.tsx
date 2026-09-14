"use client";

import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { ReefSite } from "./types";
import styles from "./reef-explorer.module.css";

const malaysiaBounds: [[number, number], [number, number]] = [
  [0.5, 99.2],
  [7.7, 119.6],
];

function FitMalaysia() {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    map.fitBounds(malaysiaBounds, { padding: [28, 28], animate: false });
  }, [map]);

  return null;
}

export function ReefExplorerMap({
  sites,
  selectedSiteId,
  onSelectSite,
}: {
  sites: ReefSite[];
  selectedSiteId: string | null;
  onSelectSite: (siteId: string) => void;
}) {
  const [tilesUnavailable, setTilesUnavailable] = useState(false);

  return (
    <div className={styles.mapFrame} aria-label="Interactive map of selected Malaysian reef areas">
      <MapContainer
        className={styles.mapCanvas}
        bounds={malaysiaBounds}
        minZoom={5}
        maxZoom={13}
        scrollWheelZoom
        zoomControl
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: () => setTilesUnavailable(true) }}
        />
        <FitMalaysia />
        {sites.map((site) => {
          const selected = site.id === selectedSiteId;
          return (
            <CircleMarker
              key={site.id}
              center={site.position}
              radius={selected ? 11 : 8}
              pathOptions={{
                color: "#ffffff",
                weight: selected ? 4 : 3,
                fillColor: selected ? "#f06a5b" : "#0f8b8d",
                fillOpacity: 1,
              }}
              eventHandlers={{ click: () => onSelectSite(site.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <strong>{site.name}</strong><br />{site.publicAreaLabel}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <p className={styles.mapPrivacy}>Named dive sites only. Exact report coordinates are never shown.</p>
      {tilesUnavailable && (
        <p className={styles.mapFallback} role="status">
          The map background is temporarily unavailable. The named site list is still available.
        </p>
      )}
    </div>
  );
}

