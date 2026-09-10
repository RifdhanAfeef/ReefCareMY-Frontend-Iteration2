"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/features/epic-01-access/auth-context";
import { threatCategories, type ThreatCategory } from "./threat-data";
import type { ThreatCategoryCode } from "./types";
import styles from "./reporting.module.css";

const threatAssets: Record<
  ThreatCategoryCode,
  { icon: string; photo: string; photoAlt: string }
> = {
  ghost_gear: {
    icon: "/images/threats/ghost-fishing-gear-icon.png",
    photo: "/images/threats/ghost-fishing-gear-photo.jpg",
    photoAlt: "Abandoned fishing nets and ropes tangled on a coral reef",
  },
  coral_bleaching: {
    icon: "/images/threats/coral-bleaching-icon-v2.png",
    photo: "/images/threats/coral-bleaching-photo.jpg",
    photoAlt: "White bleached coral among darker coral on a reef",
  },
  marine_debris: {
    icon: "/images/threats/marine-debris-icon.png",
    photo: "/images/threats/marine-debris-photo.png",
    photoAlt: "Plastic waste and discarded material covering part of a coral reef",
  },
  physical_reef_damage: {
    icon: "/images/threats/physical-reef-damage-icon-v2.png",
    photo: "/images/threats/physical-reef-damage-photo.jpg",
    photoAlt: "An underwater reef area containing broken and damaged coral",
  },
  unsure: {
    icon: "/images/threats/coral-bleaching-icon-v2.png",
    photo: "/images/threats/coral-bleaching-photo.jpg",
    photoAlt: "A coral reef observation that may require further review",
  },
};

function ThreatIcon({ code }: { code: ThreatCategory["code"] }) {
  return (
    <span className={styles.icon} aria-hidden="true">
      <Image src={threatAssets[code].icon} alt="" width={38} height={38} />
    </span>
  );
}

export function GuidanceContent({ initialThreat }: { initialThreat?: ThreatCategoryCode }) {
  const { status, user } = useAuth();
  const categories = threatCategories.filter((category) => category.guidanceAvailable);
  const [selectedCode, setSelectedCode] = useState(initialThreat ?? categories[0].code);
  const selected = categories.find((category) => category.code === selectedCode) ?? categories[0];
  const reportAction = user?.role === "case_coordinator"
    ? { href: "/coordinator/report-queue", label: "Return to report intake" }
    : user?.role === "system_administrator"
      ? { href: "/admin/users", label: "Return to administration" }
      : status === "authenticated"
        ? { href: "/report-a-reef", label: "Start a report" }
        : { href: "/login?next=/report-a-reef", label: "Log in to start a report" };

  return (
    <div className={styles.stack}>
      <section className={styles.intro}>
        <strong>You do not need to identify the issue scientifically</strong>
        <p>Choose the closest category, record only what you can observe safely, and use “Unsure” in the report form when none clearly fits.</p>
      </section>

      <section aria-labelledby="supported-threats-heading">
        <h2 id="supported-threats-heading">Supported reef threats</h2>
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <button
              className={`${styles.categoryButton} ${selected.code === category.code ? styles.categoryButtonActive : ""}`}
              type="button"
              key={category.code}
              onClick={() => setSelectedCode(category.code)}
              aria-pressed={selected.code === category.code}
            >
              <ThreatIcon code={category.code} />
              <strong>{category.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.detailCard} aria-live="polite">
        <div className={styles.detailCopy}>
          <div className={styles.detailTitle}>
            <ThreatIcon code={selected.code} />
            <h2>{selected.label}</h2>
          </div>
          <p className={styles.supporting}>{selected.shortExplanation}</p>
          <h3>Useful evidence</h3>
          <ul className={styles.evidenceList}>
            {selected.usefulEvidence.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <aside className={styles.safetyBox}>
            <strong>Safety reminder</strong>
            <p>{selected.safetyReminder}</p>
          </aside>
        </div>
        <figure className={styles.guidancePhoto}>
          <Image
            src={threatAssets[selected.code].photo}
            alt={threatAssets[selected.code].photoAlt}
            fill
            sizes="(max-width: 900px) 100vw, 38vw"
          />
        </figure>
      </section>

      <section className={styles.ctaRow}>
        <div>
          <h2>Ready to document an observation?</h2>
          <p className={styles.supporting}>You can save a local draft and complete the location before final submission.</p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.primaryButton} href={reportAction.href}>{reportAction.label}</Link>
        </div>
      </section>
    </div>
  );
}
