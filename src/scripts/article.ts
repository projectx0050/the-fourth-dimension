import { $, esc, linkify } from "./util";
import { bindKeys } from "./keys";

const art = $(".article")!;
const slug = art.dataset.slug!;
const url = art.dataset.url!;

bindKeys(url);

/* Share toggle */
const st = $("#shareTop")!;
st.addEventListener("click", () => {
  const tb = $("#topshare")!;
  tb.hidden = !tb.hidden;
  st.setAttribute("aria-expanded", String(!tb.hidden));
});

/* Anonymous reader id, so a reader can change or undo their own reaction. */
function clientId() {
  try {
    let id = localStorage.getItem("t4d-cid");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("t4d-cid", id); }
    return id;
  } catch (e) {
    return (window as any).__t4dCid ||= crypto.randomUUID();
  }
}
const cid = clientId();

/* Reactions */
const REACTS = [["felt", "Felt it"], ["disturbed", "Disturbed me"], ["think", "Made me think"], ["disagree", "I disagree"]];
let counts: Record<string, number> = {}, mine: string | null = null, busy = false;
const note = $("#cnote")!;

function renderReacts() {
  const el = $("#reacts")!;
  el.innerHTML = REACTS.map(([k, l]) =>
    `<button type="button" class="react" data-r="${k}" aria-pressed="${mine === k}">${l} <b>${counts[k] || 0}</b></button>`).join("");
  el.querySelectorAll<HTMLElement>(".react").forEach((b) => (b.onclick = () => react(b.dataset.r!)));
}
async function loadReacts() {
  try {
    const r = await fetch(`/api/reactions/${slug}?cid=${encodeURIComponent(cid)}`);
    if (!r.ok) throw 0;
    const d = await r.json(); counts = d.counts || {}; mine = d.mine || null;
  } catch (e) {}
  renderReacts();
}
async function react(k: string) {
  if (busy) return;
  const prev = { counts: { ...counts }, mine };
  const next = mine === k ? null : k;
  if (mine) counts[mine] = Math.max(0, (counts[mine] || 1) - 1);
  if (next) counts[next] = (counts[next] || 0) + 1;
  mine = next; renderReacts(); busy = true;
  try {
    const r = await fetch(`/api/reactions/${slug}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ cid, reaction: next }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "");
    counts = d.counts || counts; mine = d.mine ?? null; renderReacts();
  } catch (e: any) {
    counts = prev.counts; mine = prev.mine; renderReacts();
    note.textContent = e?.message || "Couldn't save your reaction. Try again in a moment.";
  } finally { busy = false; }
}

/* Comments */
type C = { name: string; text: string; at: string };
let comments: C[] = [];
function timeAgo(iso: string) {
  const d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
  if (isNaN(s)) return ""; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + " min ago";
  if (s < 86400) return Math.floor(s / 3600) + " h ago"; return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
function renderComments() {
  const el = $("#clist")!;
  $("#ctitle")!.textContent = comments.length ? `Comments (${comments.length})` : "Comments";
  el.innerHTML = comments.length
    ? comments.map((c) => `<li><span class="who">${esc(c.name || "Anonymous reader")}</span><span class="when">${esc(timeAgo(c.at))}</span><p>${linkify(c.text || "")}</p></li>`).join("")
    : `<li class="empty" style="border:0">No comments yet. Be the first to argue.</li>`;
}
async function loadComments() {
  try {
    const r = await fetch(`/api/comments/${slug}`);
    if (!r.ok) throw 0;
    comments = (await r.json()).comments || [];
  } catch (e) {}
  renderComments();
}
const form = $<HTMLFormElement>("#cform")!;
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = ($<HTMLInputElement>("#cname")!).value.trim().slice(0, 40);
  const text = ($<HTMLTextAreaElement>("#ctext")!).value.trim().slice(0, 1000);
  const website = ($<HTMLInputElement>("#cweb")!).value;
  if (!text) { note.textContent = "Write something first."; return; }
  const btn = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  btn.disabled = true; note.textContent = "Posting…";
  try {
    const r = await fetch(`/api/comments/${slug}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, text, website }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "");
    comments.unshift(d.comment); renderComments();
    ($<HTMLTextAreaElement>("#ctext")!).value = ""; note.textContent = "Posted.";
  } catch (err: any) {
    note.textContent = err?.message || "Couldn't post. Try again in a moment.";
  } finally { btn.disabled = false; }
});

renderReacts(); renderComments();
loadReacts(); loadComments();

/* Listen: the reader's own device voices */
let speakToken = 0;
function stopSpeech() { speakToken++; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }
function setupListen() {
  const box = $("#listen"); if (!box) return;
  if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) { box.hidden = true; return; }
  const sel = $<HTMLSelectElement>("#voice")!, play = $("#lplay")!, stop = $("#lstop")!;
  let voices: SpeechSynthesisVoice[] = [];
  const fill = () => {
    voices = speechSynthesis.getVoices(); if (!voices.length) return;
    const keep = sel.value;
    sel.innerHTML = voices.map((v, i) => `<option value="${i}">${esc(v.name)} · ${esc(v.lang)}</option>`).join("");
    const en = voices.findIndex((v) => /^en/i.test(v.lang));
    sel.value = keep && voices[+keep] ? keep : String(en >= 0 ? en : 0);
  };
  fill(); try { speechSynthesis.onvoiceschanged = fill; } catch (e) {}
  let state = "idle";
  const label = (s: string) => {
    play.innerHTML = s === "playing" ? "&#10074;&#10074; Pause" : s === "paused" ? "&#9654; Resume" : "&#9654; Listen";
    play.setAttribute("aria-pressed", String(s !== "idle")); stop.hidden = s === "idle";
  };
  play.onclick = () => {
    if (state === "playing") { speechSynthesis.pause(); state = "paused"; label(state); return; }
    if (state === "paused") { speechSynthesis.resume(); state = "playing"; label(state); return; }
    const parts = [$(".article h1")!.textContent!, ...[...document.querySelectorAll(".article .body > *")].map((n) => n.textContent!.trim()).filter(Boolean)];
    stopSpeech(); const my = speakToken; state = "playing"; label(state);
    const next = (i: number) => {
      if (my !== speakToken) return;
      if (i >= parts.length) { state = "idle"; label(state); return; }
      const u = new SpeechSynthesisUtterance(parts[i]);
      const v = voices[+sel.value]; if (v) u.voice = v;
      u.rate = +($<HTMLSelectElement>("#rate")!).value || 1;
      u.onend = () => next(i + 1); u.onerror = () => { if (my === speakToken) { state = "idle"; label(state); } };
      speechSynthesis.speak(u);
    };
    next(0);
  };
  stop.onclick = () => { stopSpeech(); state = "idle"; label(state); };
  addEventListener("pagehide", stopSpeech);
}
setupListen();
