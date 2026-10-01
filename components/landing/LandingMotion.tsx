"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./landing.css";

/** Progressive enhancement: all content is visible without JavaScript. */
export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || !window.IntersectionObserver) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const hero = element.querySelector<HTMLElement>(".landing-hero");
    const picture = element.querySelector<HTMLElement>(".landing-parallax");
    let frame = 0;
    let heroVisible = false;
    const seen = new WeakSet<Element>();
    const reveal = (node: HTMLElement) => {
      node.dataset.visible = "true";
      observer.unobserve(node);
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    const discover = () => {
      element.querySelectorAll<HTMLElement>("[data-reveal]").forEach((node) => {
        if (seen.has(node)) return;
        seen.add(node);
        // Initial viewport content uses the hero entrance, never a hidden first paint.
        if (reduced.matches || node.getBoundingClientRect().top < window.innerHeight - 24) {
          reveal(node);
        } else {
          node.dataset.visible = "false";
          observer.observe(node);
        }
      });
    };
    const paint = () => {
      frame = 0;
      if (picture && hero && heroVisible && desktop.matches && !reduced.matches) {
        const shift = Math.min(24, Math.max(0, -hero.getBoundingClientRect().top * 0.055));
        picture.style.transform = `translate3d(0, ${shift}px, 0)`;
      }
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const sync = () => {
      window.removeEventListener("scroll", scroll);
      if (picture) picture.style.transform = "";
      if (reduced.matches) element.querySelectorAll<HTMLElement>("[data-reveal]").forEach(reveal);
      if (heroVisible && desktop.matches && !reduced.matches) {
        window.addEventListener("scroll", scroll, { passive: true });
        scroll();
      }
    };
    const heroObserver = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      sync();
    });
    if (hero) heroObserver.observe(hero);
    const mutations = new MutationObserver(discover);
    mutations.observe(element, { childList: true, subtree: true });
    const focus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const node = target.closest<HTMLElement>("[data-reveal]");
      if (node) reveal(node);
    };
    element.addEventListener("focusin", focus);
    reduced.addEventListener("change", sync);
    desktop.addEventListener("change", sync);
    discover();
    return () => {
      observer.disconnect();
      heroObserver.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      element.removeEventListener("focusin", focus);
      reduced.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
    };
  }, []);

  return <div ref={root} className="landing-page">{children}</div>;
}
