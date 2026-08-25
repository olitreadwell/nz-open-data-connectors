import { useEffect, useRef, useState } from "react";

/**
 * Reveal-on-scroll hook. Adds `reveal-visible` once the element enters the
 * viewport. Falls back to visible immediately when IntersectionObserver is
 * unavailable, so content never stays hidden.
 *
 * @param rootMargin - Viewport margin passed to the observer
 * @returns Ref to attach and whether the element is currently revealed
 */
export function useReveal<T extends HTMLElement>(
  rootMargin = "0px 0px -40px 0px",
): {
  ref: React.RefObject<T | null>;
  visible: boolean;
} {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (node === null) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, visible };
}
