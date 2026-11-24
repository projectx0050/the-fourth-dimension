export const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector(s) as T | null;
export const esc = (t: unknown) =>
  String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const linkify = (t: string) =>
  esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="nofollow ugc noopener">$1</a>');
export const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
