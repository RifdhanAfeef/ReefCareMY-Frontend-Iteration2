"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useAuth } from "@/features/epic-01-access/auth-context";
import { spotTheThreatExamples, threatExplorerItems, type ThreatExplorerCode } from "./threat-explorer-data";
import styles from "./threat-explorer.module.css";

function Arrow({ direction }: { direction: "left" | "right" }) {
  return <span aria-hidden="true">{direction === "left" ? "←" : "→"}</span>;
}

export function ThreatExplorer() {
  const { status, user } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [answer, setAnswer] = useState<ThreatExplorerCode | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = threatExplorerItems[selectedIndex];
  const example = spotTheThreatExamples[exampleIndex];

  const selectThreat = (index: number) => {
    setSelectedIndex(index);
    cardRefs.current[index]?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const reportHref = (code: ThreatExplorerCode | "unsure") => {
    const destination = `/report-a-reef?threat=${code}`;
    return status === "authenticated" && user?.role === "observer"
      ? destination
      : `/login?next=${encodeURIComponent(destination)}`;
  };

  const nextExample = () => {
    setExampleIndex((current) => (current + 1) % spotTheThreatExamples.length);
    setAnswer(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <p className={styles.eyebrow}>Reef Threat Explorer</p>
        <h1>Meet the four threats</h1>
        <p className={styles.heroCopy}>Learn the visual cues. Understand the impact. Know what to report.</p>
        <a className={styles.heroAction} href="#threats">Start exploring <Arrow direction="right" /></a>
        <div className={styles.heroIndex} aria-hidden="true"><span>01</span><i /><span>04</span></div>
      </header>

      <main className={styles.main}>
        <section className={styles.explorer} id="threats" aria-labelledby="threats-heading">
          <div className={styles.sectionHeader}>
            <div><p className={styles.eyebrowDark}>Four threats. Clear signals.</p><h2 id="threats-heading">Explore at your own pace</h2></div>
            <div className={styles.carouselControls}>
              <p aria-live="polite">{selectedIndex + 1} of {threatExplorerItems.length}</p>
              <button type="button" aria-label="Previous threat" disabled={selectedIndex === 0} onClick={() => selectThreat(selectedIndex - 1)}><Arrow direction="left" /></button>
              <button type="button" aria-label="Next threat" disabled={selectedIndex === threatExplorerItems.length - 1} onClick={() => selectThreat(selectedIndex + 1)}><Arrow direction="right" /></button>
            </div>
          </div>

          <div className={styles.cardRail} role="group" aria-label="Supported reef threats">
            {threatExplorerItems.map((threat, index) => (
              <button
                className={styles.threatCard}
                ref={(node) => { cardRefs.current[index] = node; }}
                key={threat.code}
                type="button"
                aria-label={`Explore ${threat.label}`}
                aria-pressed={selectedIndex === index}
                onClick={() => selectThreat(index)}
              >
                <Image src={threat.image} alt="" fill sizes="(max-width: 640px) 82vw, 360px" />
                <span className={styles.cardShade} aria-hidden="true" />
                <span className={styles.cardNumber}>{threat.number}</span><span className={styles.cardEyebrow}>{threat.eyebrow}</span><strong>{threat.label}</strong>
                <span className={styles.cardAction}>Explore <Arrow direction="right" /></span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.detail} aria-live="polite" aria-labelledby="selected-threat-heading" key={selected.code}>
          <figure className={styles.detailImage}>
            <Image src={selected.image} alt={selected.imageAlt} fill sizes="(max-width: 900px) 100vw, 48vw" priority={selectedIndex === 0} />
            <figcaption>{selected.number} / {selected.eyebrow}</figcaption>
          </figure>
          <div className={styles.detailCopy}>
            <p className={styles.eyebrowDark}>Know what you are seeing</p><h2 id="selected-threat-heading">{selected.label}</h2><p className={styles.lead}>{selected.summary}</p>
            <div className={styles.factGrid}>
              <div><h3>What it looks like</h3><p>{selected.looksLike}</p></div>
              <div><h3>Why it matters</h3><p>{selected.impact}</p></div>
            </div>
            <div className={styles.cues}><h3>Recognition cues</h3><ol>{selected.recognitionCues.map((cue, index) => <li key={cue}><span>0{index + 1}</span>{cue}</li>)}</ol></div>
            <aside className={styles.safety}><span aria-hidden="true">✦</span><div><strong>Observe safely</strong><p>{selected.safety}</p></div></aside>
            <Link className={styles.primaryAction} href={reportHref(selected.code)}>Report this threat <Arrow direction="right" /></Link>
          </div>
        </section>

        <section className={styles.quiz} aria-labelledby="spot-heading">
          <div className={styles.quizIntro}><p className={styles.eyebrow}>Quick visual check</p><h2 id="spot-heading">Spot the threat</h2><p>Choose the closest match. No scientific diagnosis needed.</p></div>
          <div className={styles.quizPanel}>
            <figure className={styles.quizImage}>
              <Image src={example.image} alt={example.imageAlt} fill sizes="(max-width: 900px) 100vw, 52vw" />
              <figcaption>Example {exampleIndex + 1} of {spotTheThreatExamples.length}</figcaption>
            </figure>
            <div className={styles.quizCopy}>
              <h3>{example.prompt}</h3>
              <div className={styles.answers}>{threatExplorerItems.map((threat) => <button aria-pressed={answer === threat.code} key={threat.code} type="button" onClick={() => setAnswer(threat.code)}>{threat.label}<span aria-hidden="true">›</span></button>)}</div>
              {answer && <div className={styles.feedback} role="status"><strong>{answer === example.threatCode ? "Correct — you spotted it." : "Not quite — look once more."}</strong><p>{example.explanation}</p></div>}
              {answer && <button className={styles.nextExample} type="button" onClick={nextExample}>Next example <Arrow direction="right" /></button>}
            </div>
          </div>
        </section>

        <section className={styles.unsure}>
          <p className={styles.eyebrow}>Unsure is a valid answer</p><h2>You observe.<br />Conservation teams assess.</h2>
          <p>Share what you saw without guessing. A clear photo, place and simple description are enough to begin.</p>
          <Link className={styles.lightAction} href={reportHref("unsure")}>I’m not sure what I saw <Arrow direction="right" /></Link>
        </section>
      </main>
    </div>
  );
}
