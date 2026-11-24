import { $ } from "./util";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function initCalendar() {
  const el = $("#cal"); if (!el) return;
  const EVENTS: Record<string, string> = JSON.parse(el.dataset.events || "{}");
  const keys = Object.keys(EVENTS).sort();
  const TODAY = new Date();
  const MIN = [+keys[0].slice(0, 4), +keys[0].slice(5, 7) - 1];
  const last = keys[keys.length - 1];
  const MAX = [+last.slice(0, 4), +last.slice(5, 7) - 1];
  // Open on the current month, kept inside the range we have days for.
  const idx = (y: number, m: number) => y * 12 + m;
  let t = Math.min(Math.max(idx(TODAY.getFullYear(), TODAY.getMonth()), idx(MIN[0], MIN[1])), idx(MAX[0], MAX[1]));
  let calY = Math.floor(t / 12), calM = t % 12, selKey: string | null = null;

  function render() {
    const first = new Date(calY, calM, 1).getDay();
    const days = new Date(calY, calM + 1, 0).getDate();
    const atMin = calY === MIN[0] && calM === MIN[1];
    const atMax = calY === MAX[0] && calM === MAX[1];
    let cells = ["S","M","T","W","T","F","S"].map((d) => `<div class="dow">${d}</div>`).join("");
    for (let i = 0; i < first; i++) cells += `<span class="day blank"></span>`;
    for (let d = 1; d <= days; d++) {
      const k = key(calY, calM, d);
      const ev = EVENTS[k];
      const isToday = calY === TODAY.getFullYear() && calM === TODAY.getMonth() && d === TODAY.getDate();
      const cls = ["day", ev ? "ev" : "", isToday ? "today" : "", selKey === k ? "sel" : ""].join(" ");
      cells += ev
        ? `<button type="button" class="${cls}" data-k="${k}" aria-label="${MONTHS[calM]} ${d}: ${ev}">${d}</button>`
        : `<span class="${cls}"${isToday ? ' aria-label="Today"' : ""}>${d}</span>`;
    }
    const list = keys.filter((k) => k.startsWith(`${calY}-${pad(calM + 1)}`))
      .map((k) => `<li class="${k === selKey ? "on" : ""}"><b>${MONTHS[calM].slice(0, 3)} ${+k.slice(8)}</b><span>${EVENTS[k]}</span></li>`).join("");
    el!.innerHTML = `
      <div class="cal-head">
        <button type="button" id="calPrev" aria-label="Previous month" ${atMin ? "disabled" : ""}>&larr;</button>
        <h3>${MONTHS[calM]} ${calY}</h3>
        <button type="button" id="calNext" aria-label="Next month" ${atMax ? "disabled" : ""}>&rarr;</button>
      </div>
      <div class="grid">${cells}</div>
      <ul class="events">${list || '<li><b>—</b><span>No global days marked this month.</span></li>'}</ul>
      <div class="cal-note">Highlighted: days the world is watching. Tap one to see it.</div>`;
    $("#calPrev")!.onclick = () => { calM--; if (calM < 0) { calM = 11; calY--; } selKey = null; render(); };
    $("#calNext")!.onclick = () => { calM++; if (calM > 11) { calM = 0; calY++; } selKey = null; render(); };
    el!.querySelectorAll<HTMLElement>("button.day").forEach((b) => (b.onclick = () => { selKey = b.dataset.k!; render(); }));
  }
  render();
}
