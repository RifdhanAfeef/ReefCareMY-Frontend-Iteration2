"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/epic-01-access/auth-context";
import { threatCategories } from "@/features/epic-02-reporting/threat-data";
import { reefIslands, reefSites } from "./reef-sites";
import { storeSelectedReefSite } from "./selected-site-storage";
import type { ReefSite } from "./types";
import styles from "./reef-explorer.module.css";

const ReefExplorerMap = dynamic(
  () => import("./reef-explorer-map").then((module) => module.ReefExplorerMap),
  {
    ssr: false,
    loading: () => <div className={styles.mapLoading}>Loading the Malaysia map...</div>,
  },
);

const threatImages = {
  ghost_gear: "/images/threats/ghost-fishing-gear-photo.jpg",
  coral_bleaching: "/images/threats/coral-bleaching-photo.jpg",
  marine_debris: "/images/threats/marine-debris-photo.png",
  physical_reef_damage: "/images/threats/physical-reef-damage-photo.jpg",
  unsure: "/images/reef-photo-2.jpg",
} as const;

function SiteList({
  sites,
  selectedSiteId,
  onSelect,
}: {
  sites: ReefSite[];
  selectedSiteId: string | null;
  onSelect: (siteId: string) => void;
}) {
  return (
    <div className={styles.siteList}>
      {reefIslands.map((island) => {
        const islandSites = sites.filter((site) => site.island === island);
        if (islandSites.length === 0) return null;
        return (
          <section className={styles.islandGroup} key={island} aria-labelledby={`island-${island}`}>
            <div className={styles.islandHeading}>
              <h3 id={`island-${island}`}>{island}</h3>
              <span>{islandSites.length} named {islandSites.length === 1 ? "site" : "sites"}</span>
            </div>
            {islandSites.map((site) => (
              <button
                className={styles.siteButton}
                data-selected={site.id === selectedSiteId}
                key={site.id}
                type="button"
                onClick={() => onSelect(site.id)}
              >
                <span>{site.name}</span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function ActivityPanel({ site }: { site: ReefSite }) {
  return (
    <section className={styles.activity} aria-labelledby="site-activity-heading">
      <div className={styles.sectionTitleRow}>
        <div>
          <p className={styles.eyebrow}>Public-safe activity</p>
          <h3 id="site-activity-heading">Recent ReefCare activity</h3>
        </div>
        <span className={styles.generalisedBadge}>General area only</span>
      </div>
      {site.publicActivity.length > 0 ? (
        <ul className={styles.activityList}>
          {site.publicActivity.map((item) => (
            <li key={`${site.id}-${item.title}`}>
              <span className={styles.activityDot} aria-hidden="true" />
              <div>
                <strong>{item.title}</strong>
                <small>{item.dateLabel}</small>
                <p>{item.summary}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.emptyActivity} role="status">
          <strong>No public ReefCare activity is currently available</strong>
          <p>
            This does not mean there are no observations. Only approved, privacy-safe updates appear here.
          </p>
        </div>
      )}
    </section>
  );
}

function SiteDetail({
  site,
  onBack,
  onReport,
  onEnlargeImage,
}: {
  site: ReefSite;
  onBack: () => void;
  onReport: () => void;
  onEnlargeImage: (imageIndex: number) => void;
}) {
  return (
    <article className={styles.siteDetail} aria-labelledby="selected-site-heading">
      <button className={styles.backToSites} type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> All reef areas
      </button>
      <p className={styles.siteArea}>{site.publicAreaLabel}</p>
      <h2 id="selected-site-heading">{site.name}</h2>
      <div className={styles.siteGallery} aria-label={`${site.name} representative images`}>
        {site.images.map((image, index) => (
          <figure className={styles.siteImage} key={image.src}>
            <button type="button" onClick={() => onEnlargeImage(index)} aria-label={`Enlarge image ${index + 1} of ${site.name}`}>
              <Image src={image.src} alt={image.alt} fill sizes="(max-width: 960px) 50vw, 18vw" />
              <span>View larger</span>
            </button>
          </figure>
        ))}
      </div>
      <p className={styles.siteIntroduction}>{site.introduction}</p>

      <section className={styles.siteFacts} aria-label="Dive-site information">
        <div>
          <h3>Notable reef features</h3>
          <div className={styles.featureList}>{site.reefFeatures.map((item) => (
            <div key={item.title}><strong>{item.title}</strong><p>{item.description}</p></div>
          ))}</div>
        </div>
        <div>
          <h3>Representative marine life</h3>
          <ul>{site.marineLife.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <h3>Why divers explore this site</h3>
          <ul>{site.popularReasons.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className={styles.experienceCard}>
          <h3>Experience suitability</h3>
          <span>{site.experience.level}</span>
          <p>{site.experience.explanation}</p>
        </div>
        <div>
          <h3>Prepare before you visit</h3>
          <ul>{site.preparation.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <p className={styles.sourceNote}>
        Source: <a href={site.source.url} target="_blank" rel="noreferrer">{site.source.label}</a><br />
        Conditions and requirements can change. Confirm them with a licensed operator and the relevant authority.
      </p>

      <ActivityPanel site={site} />

      <div className={styles.siteActions}>
        <button className={styles.primaryButton} type="button" onClick={onReport}>
          Report a Reef Threat
        </button>
        <a className={styles.secondaryButton} href="#responsible-observation">View guidance</a>
      </div>
    </article>
  );
}

function ImageDialog({ site, imageIndex, onClose }: { site: ReefSite; imageIndex: number; onClose: () => void }) {
  const image = site.images[imageIndex];

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className={styles.imageDialogBackdrop} role="presentation" onMouseDown={onClose}>
      <section className={styles.imageDialog} role="dialog" aria-modal="true" aria-label={`${site.name} enlarged image`} onMouseDown={(event) => event.stopPropagation()}>
        <button className={styles.imageDialogClose} type="button" onClick={onClose} aria-label="Close enlarged image">×</button>
        <div className={styles.enlargedImage}>
          <Image src={image.src} alt={image.alt} fill sizes="90vw" priority />
        </div>
        <p>{image.alt}</p>
      </section>
    </div>
  );
}

function AuthenticationDialog({ site, onClose }: { site: ReefSite; onClose: () => void }) {
  const next = encodeURIComponent("/report-a-reef");
  const rememberSite = () => storeSelectedReefSite(site);

  return (
    <div className={styles.dialogBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="authentication-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className={styles.dialogClose} type="button" onClick={onClose} aria-label="Close sign-in prompt">×</button>
        <p className={styles.eyebrow}>Selected site</p>
        <p className={styles.dialogSite}>{site.name} · {site.publicAreaLabel}</p>
        <h2 id="authentication-heading">Sign in to report this reef threat</h2>
        <p>
          An account links the report to you so you can track it, respond to information requests and see recorded outcomes.
        </p>
        <div className={styles.savedContext}>
          <strong>Your selected site will be saved</strong>
          <span>You can confirm or change it during the reporting workflow.</span>
        </div>
        <Link className={styles.primaryButton} href={`/login?next=${next}`} onClick={rememberSite}>Log in</Link>
        <Link className={styles.secondaryButton} href={`/register?next=${next}`} onClick={rememberSite}>Create Observer account</Link>
      </section>
    </div>
  );
}

export function ReefExplorer() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [showAuthentication, setShowAuthentication] = useState(false);
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);

  const selectedSite = reefSites.find((site) => site.id === selectedSiteId) ?? null;
  const filteredSites = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reefSites;
    return reefSites.filter((site) =>
      `${site.name} ${site.island} ${site.publicAreaLabel}`.toLowerCase().includes(query),
    );
  }, [search]);

  function startReport() {
    if (!selectedSite) return;
    storeSelectedReefSite(selectedSite);
    if (status === "authenticated" && user?.role === "observer") {
      router.push("/report-a-reef");
      return;
    }
    if (status === "authenticated") return;
    setShowAuthentication(true);
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Public Reef Information and Engagement</p>
        <h1>Explore Malaysia&apos;s reef areas</h1>
        <p>
          Discover selected islands and named dive sites, learn what to observe responsibly and see privacy-safe ReefCare activity without logging in.
        </p>
      </header>

      <section className={styles.explorer} aria-labelledby="explorer-heading">
        <aside className={styles.sidePanel}>
          {selectedSite ? (
            <SiteDetail
              site={selectedSite}
              onBack={() => setSelectedSiteId(null)}
              onReport={startReport}
              onEnlargeImage={setEnlargedImageIndex}
            />
          ) : (
            <>
              <p className={styles.eyebrow}>Selected Malaysian reef areas</p>
              <h2 id="explorer-heading">Choose an island or dive site</h2>
              <label className={styles.searchField}>
                <span className="sr-only">Search reef areas</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search named dive sites"
                />
              </label>
              {filteredSites.length > 0 ? (
                <SiteList sites={filteredSites} selectedSiteId={selectedSiteId} onSelect={setSelectedSiteId} />
              ) : (
                <div className={styles.noResults} role="status">
                  <strong>No matching reef areas</strong>
                  <p>Try a site, island or general-area name.</p>
                </div>
              )}
            </>
          )}
        </aside>

        <ReefExplorerMap sites={reefSites} selectedSiteId={selectedSiteId} onSelectSite={setSelectedSiteId} />
      </section>

      <section className={styles.guidance} id="responsible-observation" aria-labelledby="guidance-heading">
        <div className={styles.guidanceHeading}>
          <div>
            <p className={styles.eyebrow}>Responsible observation</p>
            <h2 id="guidance-heading">Know what may be useful to document</h2>
          </div>
          <p>You do not need to diagnose a reef threat scientifically.</p>
        </div>
        <div className={styles.threatGrid}>
          {threatCategories.filter((category) => category.guidanceAvailable).map((category) => (
            <details className={styles.threatCard} key={category.code}>
              <summary>
                <Image src={threatImages[category.code]} alt="" width={72} height={54} />
                <span><strong>{category.label}</strong><small>{category.shortExplanation}</small></span>
              </summary>
              <div className={styles.threatDetail}>
                <h3>Useful evidence</h3>
                <ul>{category.usefulEvidence.map((item) => <li key={item}>{item}</li>)}</ul>
                <p><strong>Safety reminder:</strong> {category.safetyReminder}</p>
                <Link href={`/reef-threats?threat=${category.code}`}>Open Reef Threat Explorer</Link>
              </div>
            </details>
          ))}
        </div>
        <aside className={styles.safetyReminder}>
          <strong>Observe safely</strong>
          <p>Do not touch, move or attempt to remove anything unless you are trained and authorised.</p>
        </aside>
      </section>

      {selectedSite && status === "authenticated" && user?.role !== "observer" && (
        <p className={styles.roleNotice} role="status">Reporting is available to Registered Observer accounts.</p>
      )}
      {showAuthentication && selectedSite && (
        <AuthenticationDialog site={selectedSite} onClose={() => setShowAuthentication(false)} />
      )}
      {selectedSite && enlargedImageIndex !== null && (
        <ImageDialog site={selectedSite} imageIndex={enlargedImageIndex} onClose={() => setEnlargedImageIndex(null)} />
      )}
    </main>
  );
}
