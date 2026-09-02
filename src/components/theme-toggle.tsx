"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  // null until mounted, so we never render the wrong icon before we've
  // read the attribute the no-flash script in the root layout set.
  const [theme, setTheme] = useState<Theme | null>(null);
  // Guards against a second click starting a new view transition while one
  // is still in flight, which throws InvalidStateError.
  const transitioning = useRef(false);

  useEffect(() => {
    // One-time read of the attribute the blocking init script (see the
    // root layout) already set on <html> before hydration — not derived
    // React state, so the usual "don't setState in an effect" guidance
    // doesn't apply here.
    const current = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    if (transitioning.current) return;

    const next: Theme = theme === "dark" ? "light" : "dark";
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!document.startViewTransition || reduceMotion) {
      applyTheme(next);
      setTheme(next);
      return;
    }

    const { clientX: x, clientY: y } = event;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    transitioning.current = true;
    const transition = document.startViewTransition(() => {
      applyTheme(next);
      setTheme(next);
    });

    transition.finished
      .catch(() => {
        // Rejects if the browser aborts the transition mid-flight (e.g. the
        // tab loses focus); nothing to recover, just don't let it surface
        // as an unhandled rejection.
      })
      .finally(() => {
        transitioning.current = false;
      });

    transition.ready
      .then(() => {
        return document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 550,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          },
        ).finished;
      })
      .catch(() => {
        // The browser can abort a transition mid-flight (tab loses focus,
        // another transition starts, reduced-motion kicks in). The theme
        // attribute is already applied by this point either way, so there's
        // nothing to recover — just avoid an unhandled rejection.
      });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={theme === null}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] disabled:opacity-0"
    >
      <span className="relative block h-4.5 w-4.5">
        <SunIcon
          className={`absolute inset-0 h-4.5 w-4.5 transition-all duration-300 ${
            theme === "dark"
              ? "scale-0 -rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }`}
        />
        <MoonIcon
          className={`absolute inset-0 h-4.5 w-4.5 transition-all duration-300 ${
            theme === "dark"
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 rotate-90 opacity-0"
          }`}
        />
      </span>
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
    </svg>
  );
}
