"use client";

import { useCallback, useEffect, useState } from "react";

export function useGlitch(minInterval = 3000, maxInterval = 8000) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const trigger = () => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 200);

      const next = minInterval + Math.random() * (maxInterval - minInterval);
      timeout = setTimeout(trigger, next);
    };

    let timeout = setTimeout(trigger, minInterval + Math.random() * (maxInterval - minInterval));
    return () => clearTimeout(timeout);
  }, [minInterval, maxInterval]);

  const triggerGlitch = useCallback(() => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
  }, []);

  return { isGlitching, triggerGlitch };
}
