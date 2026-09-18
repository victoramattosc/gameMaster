import { useEffect, useState } from "react";

const BREAKPOINT = "(max-width: 819px)";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(BREAKPOINT).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
