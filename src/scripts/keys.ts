/* Share this line: dotted .key spans open a small share popover. */
import { esc } from "./util";

let popEl: HTMLElement | null = null;
function closePop() {
  if (popEl) { popEl.remove(); popEl = null; }
  document.querySelectorAll(".key.active").forEach((k) => k.classList.remove("active"));
}
function openPop(k: HTMLElement, url: string) {
  closePop(); k.classList.add("active");
  const line = `“${k.textContent!.trim()}” — The Fourth Dimension`;
  const e = encodeURIComponent;
  popEl = document.createElement("div"); popEl.className = "pop"; popEl.setAttribute("role", "dialog"); popEl.setAttribute("aria-label", "Share this line");
  popEl.innerHTML = `<span class="pl">Share this line</span>
    <a href="https://x.com/intent/post?text=${e(line)}&url=${e(url)}" target="_blank" rel="noopener">X</a>
    <a href="https://wa.me/?text=${e(line + " " + url)}" target="_blank" rel="noopener">WhatsApp</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${e(url)}&quote=${e(line)}" target="_blank" rel="noopener">Facebook</a>
    <button type="button" data-copy="${esc(line + " " + url)}">Copy</button>`;
  document.body.appendChild(popEl);
  const r = k.getBoundingClientRect(), pw = popEl.offsetWidth, vw = document.documentElement.clientWidth;
  popEl.style.top = (scrollY + r.bottom + 8) + "px";
  popEl.style.left = Math.max(16, Math.min(scrollX + r.left, scrollX + vw - pw - 16)) + "px";
}
export function bindKeys(url: string) {
  document.querySelectorAll<HTMLElement>("#view .key").forEach((k) => {
    k.tabIndex = 0; k.setAttribute("role", "button"); k.setAttribute("aria-label", "Share this line: " + k.textContent!.trim());
    k.addEventListener("click", (ev) => { ev.stopPropagation(); openPop(k, url); });
    k.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openPop(k, url); } });
  });
  document.addEventListener("click", (e) => {
    const t = e.target as Element;
    if (!t.closest(".pop") && !t.closest(".key")) closePop();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePop(); });
}
