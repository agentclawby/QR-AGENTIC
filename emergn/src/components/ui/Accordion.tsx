"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AccordionProps {
  question: string;
  answer: string;
  className?: string;
}

export function Accordion({ question, answer, className }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        "border-b border-ghost-gray/30 transition-colors",
        isOpen && "border-pulse-cyan/30",
        className
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-6 text-left transition-colors"
      >
        <span className="pr-8 font-headline text-lg font-bold text-neural-white md:text-xl">
          &ldquo;{question}&rdquo;
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center border border-ghost-gray text-neural-white/50"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 font-body text-sm leading-relaxed text-neural-white/60 md:text-base">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
