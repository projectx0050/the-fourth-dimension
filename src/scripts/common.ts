import { gsap } from "gsap";
import { $, reduceMotion } from "./util";

/* Theme: Night / Day */
function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
const themeBtn = $("#themeBtn")!;
const paintThemeBtn = () => { themeBtn.textContent = currentTheme() === "dark" ? "Day" : "Night"; };
themeBtn.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("t4d-theme", next); } catch (e) {}
  paintThemeBtn();
});
paintThemeBtn();

/* Copy buttons */
async function copyText(t: string, btn: HTMLElement) {
  const old = btn.textContent;
  try { await navigator.clipboard.writeText(t); btn.textContent = "Copied"; }
  catch (err) {
    const ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (x) {} ta.remove();
    btn.textContent = ok ? "Copied" : "Copy failed";
  }
  setTimeout(() => { btn.textContent = old; }, 1600);
}
document.addEventListener("click", (e) => {
  const c = (e.target as Element).closest<HTMLElement>("[data-copy]");
  if (c) { copyText(c.dataset.copy!, c); return; }
});

/* Reading progress */
function onScroll() {
  const bar = $("#progress")!;
  if (!document.body.classList.contains("reading")) { bar.style.transform = "scaleX(0)"; return; }
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* Entrance */
if (!reduceMotion()) {
  const els = document.querySelectorAll("#view .lead, #view .post, #view .article h1, #view .article .dek");
  if (els.length) gsap.from(els, { y: 10, duration: 0.6, stagger: 0.06, ease: "power2.out", clearProps: "transform" });
}
