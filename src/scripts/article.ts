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
type C = { id: number; name: string; text: string; at: string; edited: string | null; mine: boolean };
let comments: C[] = [];
let editing: number | null = null, confirming: number | null = null;
function timeAgo(iso: string) {
  const d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
  if (isNaN(s)) return ""; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + " min ago";
  if (s < 86400) return Math.floor(s / 3600) + " h ago"; return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
function commentHTML(c: C) {
  const head = `<span class="who">${esc(c.name || "Anonymous reader")}</span><span class="when">${esc(timeAgo(c.at))}</span>` +
    (c.edited ? `<span class="ctag" title="Edited ${esc(new Date(c.edited).toLocaleString())}">edited</span>` : "");
  if (c.mine && editing === c.id) {
    return `<li data-id="${c.id}">${head}
      <form class="cform cedit" novalidate>
        <label for="ename-${c.id}" class="sr">Your name</label>
        <input id="ename-${c.id}" name="name" maxlength="40" placeholder="Your name (optional)" value="${esc(c.name)}">
        <label for="etext-${c.id}" class="sr">Your comment</label>
        <textarea id="etext-${c.id}" name="text" maxlength="1000">${esc(c.text)}</textarea>
        <div class="cactions"><button class="btn" type="submit">Save</button><button type="button" class="clink" data-act="cancel">Cancel</button></div>
        <div class="note" role="status"></div>
      </form></li>`;
  }
  let actions = "";
  if (c.mine) {
    actions = confirming === c.id
      ? `<div class="cactions cconfirm" role="group" aria-label="Confirm delete"><span>Delete this comment for good?</span>
           <button type="button" class="clink danger" data-act="really-delete">Yes, delete</button>
           <button type="button" class="clink" data-act="keep">Keep it</button></div>`
      : `<div class="cactions"><button type="button" class="clink" data-act="edit">Edit</button><button type="button" class="clink" data-act="delete">Delete</button></div>`;
    actions += `<div class="note" role="status"></div>`;
  }
  return `<li data-id="${c.id}">${head}<p>${linkify(c.text || "")}</p>${actions}</li>`;
}
function renderComments() {
  const el = $("#clist")!;
  $("#ctitle")!.textContent = comments.length ? `Comments (${comments.length})` : "Comments";
  el.innerHTML = comments.length ? comments.map(commentHTML).join("")
    : `<li class="empty" style="border:0">No comments yet. Be the first to argue.</li>`;
}
async function loadComments() {
  try {
    const r = await fetch(`/api/comments/${slug}?cid=${encodeURIComponent(cid)}`);
    if (!r.ok) throw 0;
    comments = (await r.json()).comments || [];
  } catch (e) {}
  renderComments();
}
async function send(method: string, payload: object) {
  const r = await fetch(`/api/comments/${slug}`, {
    method, headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, cid }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "");
  return d;
}
const focusLi = (id: number, sel: string) => $<HTMLElement>(`#clist li[data-id="${id}"] ${sel}`)?.focus();

$("#clist")!.addEventListener("click", async (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>("button[data-act]"); if (!b) return;
  const li = b.closest<HTMLElement>("li")!, id = +li.dataset.id!;
  const act = b.dataset.act;
  if (act === "edit") { editing = id; confirming = null; renderComments(); focusLi(id, "textarea"); return; }
  if (act === "cancel") { editing = null; renderComments(); focusLi(id, "[data-act=edit]"); return; }
  if (act === "delete") { confirming = id; editing = null; renderComments(); focusLi(id, "[data-act=keep]"); return; }
  if (act === "keep") { confirming = null; renderComments(); focusLi(id, "[data-act=delete]"); return; }
  if (act === "really-delete") {
    const n = li.querySelector(".note")!;
    li.querySelectorAll("button").forEach((x) => (x.disabled = true)); n.textContent = "Deleting…";
    try {
      await send("DELETE", { id });
      comments = comments.filter((c) => c.id !== id); confirming = null; renderComments();
      note.textContent = "Comment deleted.";
    } catch (err: any) {
      li.querySelectorAll("button").forEach((x) => (x.disabled = false));
      n.textContent = err?.message || "Couldn't delete. Try again in a moment.";
    }
  }
});
$("#clist")!.addEventListener("submit", async (e) => {
  const f = (e.target as Element).closest<HTMLFormElement>("form.cedit"); if (!f) return;
  e.preventDefault();
  const li = f.closest<HTMLElement>("li")!, id = +li.dataset.id!, n = f.querySelector(".note")!;
  const name = (f.elements.namedItem("name") as HTMLInputElement).value.trim().slice(0, 40);
  const text = (f.elements.namedItem("text") as HTMLTextAreaElement).value.trim().slice(0, 1000);
  if (!text) { n.textContent = "Write something first. To remove the comment, use Delete."; return; }
  const btn = f.querySelector<HTMLButtonElement>("button[type=submit]")!;
  btn.disabled = true; n.textContent = "Saving…";
  try {
    const d = await send("PATCH", { id, name, text });
    comments = comments.map((c) => (c.id === id ? d.comment : c)); editing = null; renderComments();
    focusLi(id, "[data-act=edit]");
  } catch (err: any) {
    btn.disabled = false; n.textContent = err?.message || "Couldn't save. Try again in a moment.";
  }
});
$("#clist")!.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const li = (e.target as Element).closest<HTMLElement>("li[data-id]"); if (!li) return;
  const id = +li.dataset.id!;
  if (editing === id) { editing = null; renderComments(); focusLi(id, "[data-act=edit]"); }
  else if (confirming === id) { confirming = null; renderComments(); focusLi(id, "[data-act=delete]"); }
});

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
    const d = await send("POST", { name, text, website });
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
