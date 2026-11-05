"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy, ExternalLink, X } from "lucide-react";
import { OFFERS } from "../lib/offers";

type Availability = { status: "active" | "unavailable" | "ended"; message: string };
type Reward = { code: string; index: number };
const STORAGE_KEY = "freewendys-rewards-v1";

export default function Home() {
  const [selected, setSelected] = useState(0);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reward, setReward] = useState<Reward | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [saved, setSaved] = useState<Record<number, Reward>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  const claimButton = useRef<HTMLButtonElement>(null);

  async function checkAvailability() {
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/offers", { cache: "no-store" });
      const data = await response.json() as Availability & { error?: string };
      if (!response.ok) throw Error(data.error || "Could not check rewards. Please try again.");
      setAvailability(data);
    } catch (e) {
      setAvailability(null);
      setError(e instanceof Error ? e.message : "Connection lost. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void checkAvailability();
    try {
      const prior = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const codes: Record<number, Reward> = {};
      OFFERS.forEach((_, index) => {
        const code = prior?.[index]?.code;
        if (typeof code === "string" && code) codes[index] = { code, index };
      });
      setSaved(codes);
      if (Object.keys(codes).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    } catch { /* Storage is optional. */ }
  }, []);

  useEffect(() => {
    if (reward && !dialog.current?.open) dialog.current?.showModal();
    if (!reward && dialog.current?.open) dialog.current.close();
  }, [reward]);

  function showReward(next: Reward) {
    setCopyStatus("");
    setReward(next);
  }

  async function claim() {
    if (saved[selected]) { showReward(saved[selected]); return; }
    if (busy || availability?.status !== "active") return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: selected }),
      });
      const data = await response.json() as { error?: string; status?: Availability["status"]; code?: string };
      if (!response.ok || !data.code) {
        const message = data.error || "This reward could not be claimed. Please try again.";
        if (data.status) setAvailability({ status: data.status, message });
        throw Error(message);
      }
      const next = { code: data.code, index: selected };
      const all = { ...saved, [selected]: next };
      setSaved(all);
      showReward(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch { /* Code remains visible. */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection lost. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!reward) return;
    try {
      await navigator.clipboard.writeText(reward.code);
      setCopyStatus("Copied!");
    } catch {
      setCopyStatus("Select the code to copy it manually.");
    }
  }

  const offer = OFFERS[selected];
  const ready = availability?.status === "active";
  const hasSaved = !!saved[selected];
  const status = checking ? "Checking availability…" : ready ? "Promotion active" :
    availability?.status === "ended" ? "Promotion ended" :
    availability?.status === "unavailable" ? "Rewards unavailable" : "Connection unavailable";
  const message = error || (!checking && !ready && availability?.message);

  return (
    <div className="site-shell">
      <header className="header wrap">
        <img src="/game/fries-stone.png" alt="" width="42" height="42" />
        <h1>Free Wendy’s</h1>
      </header>

      <main className="reward-panel wrap" aria-labelledby="rewards-title">
        <div className="panel-heading">
          <h2 id="rewards-title">Choose your reward</h2>
          <span className={ready ? "availability active" : "availability"} role="status"><i />{status}</span>
        </div>
        <div className="reward-grid" role="group" aria-label="Rewards">
          {OFFERS.map((item, index) => (
            <button key={item.slug} type="button"
              className={selected === index ? "reward-card selected" : "reward-card"}
              aria-pressed={selected === index} disabled={busy}
              onClick={() => { setSelected(index); setError(""); }}
              style={{ "--accent": item.color } as React.CSSProperties}>
              {selected === index && <span className="selection-mark" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>}
              <img className="food-icon" src={"/game/" + item.slug + "-food.png"} alt="" width="90" height="90" />
              <span className="card-name">{item.name}</span>
              {saved[index] && <span className="saved-badge">Code saved</span>}
            </button>
          ))}
        </div>
        <div className="claim-bar">
          <button ref={claimButton} className="primary-button" disabled={busy || (!hasSaved && (checking || !ready))} onClick={claim}
            aria-label={busy ? "Claiming reward" : (hasSaved ? "View saved code for " : "Claim ") + offer.name}>
            {busy ? "Claiming…" : hasSaved ? "View saved code" : "Claim reward"} {!busy && <ArrowRight size={17} />}
          </button>
        </div>
        {message && <div className="message" role={error ? "alert" : "status"}>{message}
          <button className="text-button" disabled={checking || busy} onClick={checkAvailability}>Check again</button>
        </div>}
      </main>

      <footer className="footer wrap">
        <span>Made with 🍔 by <a href="https://github.com/vracton/freewendys" target="_blank" rel="noreferrer">vracton</a></span>
        <span>Not affiliated with or endorsed by Wendy’s.</span>
      </footer>

      <dialog ref={dialog} className="reward-dialog" aria-labelledby="reward-title"
        onCancel={() => setReward(null)}
        onClose={() => { setReward(null); claimButton.current?.focus(); }}
        onClick={e => { if (e.target === dialog.current) setReward(null); }}>
        {reward && (
          <div className="dialog-content">
            <button className="close-button" onClick={() => setReward(null)} aria-label="Close reward"><X size={21} /></button>
            <img className="dialog-stone" src={"/game/" + OFFERS[reward.index].slug + "-stone.png"} alt="" width="50" height="50" />
            <h2 id="reward-title">{OFFERS[reward.index].name}</h2>
            <div className="code-row"><code>{reward.code}</code>
              <button onClick={copyCode} aria-label="Copy reward code">{copyStatus === "Copied!" ? <Check size={17} /> : <Copy size={17} />} Copy</button>
            </div>
            <p className="copy-status" aria-live="polite">{copyStatus}</p>
            <a className="primary-button app-button" href="https://m-wendys.app.link/9B57RO3lj2b" target="_blank" rel="noreferrer">
              Open Wendy’s app <ExternalLink size={16} />
            </a>
          </div>
        )}
      </dialog>
    </div>
  );
}
