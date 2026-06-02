"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TypewriterProps {
  phrases: string[];
  typingSpeed?: number;
  pauseMs?: number;
  className?: string;
}

export default function TypewriterText({
  phrases,
  typingSpeed = 60,
  pauseMs = 2800,
  className = "",
}: TypewriterProps) {
  const [phraseIdx,  setPhraseIdx]  = useState(0);
  const [displayed,  setDisplayed]  = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayed.length < current.length) {
          setDisplayed(current.slice(0, displayed.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), pauseMs);
        }
      } else {
        if (displayed.length > 0) {
          setDisplayed(displayed.slice(0, -1));
        } else {
          setIsDeleting(false);
          setPhraseIdx((i) => (i + 1) % phrases.length);
        }
      }
    }, isDeleting ? typingSpeed * 0.5 : typingSpeed);

    return () => clearTimeout(timer);
  }, [displayed, isDeleting, phraseIdx, phrases, typingSpeed, pauseMs]);

  return (
    <span className={className}>
      {displayed}
      <span className="animate-blink border-r-2 border-current ml-0.5 inline-block h-[1em] w-0" />
    </span>
  );
}

// Simpler word-swap version with framer motion
export function WordRotator({
  words,
  interval = 3000,
  className = "",
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words, interval]);

 // REPLACE with:
return (
  <span className="relative inline-block">
    <AnimatePresence mode="wait">
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
        exit={{   opacity: 0, y: -20, filter: "blur(8px)" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`inline-block ${className}`}
      >
        {words[idx]}
      </motion.span>
    </AnimatePresence>
  </span>
);
}
