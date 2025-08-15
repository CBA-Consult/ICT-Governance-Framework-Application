'use client';

import { useState, useEffect, useRef } from 'react';

export const useCountUp = (end, duration = 2) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  const easeOutExpo = (t) => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  useEffect(() => {
    let start = 0;
    const endValue = end;
    const durationMs = duration * 1000;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const t = Math.min(progress / durationMs, 1);
      const easedProgress = easeOutExpo(t);
      const currentValue = Math.round(easedProgress * (endValue - start) + start);
      setCount(currentValue);

      if (progress < durationMs) {
        ref.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue); // Ensure it finishes on the exact value
      }
    };

    ref.current = requestAnimationFrame(animate);

    return () => {
      if (ref.current) {
        cancelAnimationFrame(ref.current);
      }
    };
  }, [end, duration]);

  return count;
};
