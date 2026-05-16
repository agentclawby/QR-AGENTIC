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
    <motion.div
      initial={false}
      animate={{
        backgroundColor: isOpen ? "rgba(0, 240, 255, 0.03)" : "rgba(0, 0, 0, 0)",
      }}
      className={cn(
        "group relative border-b border-ghost-gray/30 transition-colors",
        isOpen && "border-pulse-cyan/40",
        className
      )}
    >
      {/* hover sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pulse-cyan/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-start justify-between gap-4 py-5 text-left transition-colors sm:items-center sm:py-6"
      >
        <motion.span
          animate={{ x: isOpen ? 4 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "min-w-0 break-words font-headline text-base font-bold leading-snug transition-colors sm:text-lg md:text-xl",
            isOpen ? "text-pulse-cyan" : "text-neural-white group-hover:text-pulse-cyan"
          )}
        >
          &ldquo;{question}&rdquo;
        </motion.span>
        <motion.span
          animate={{
            rotate: isOpen ? 45 : 0,
            borderColor: isOpen ? "rgba(0,240,255,0.7)" : "rgba(42,42,53,1)",
            color: isOpen ? "rgba(0,240,255,1)" : "rgba(232,230,227,0.5)",
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-8 w-8 shrink-0 items-center justify-center border"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <motion.p
              initial={{ y: -8 }}
              animate={{ y: 0 }}
              exit={{ y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="pb-6 font-body text-sm leading-relaxed text-neural-white/70 md:text-base"
            >
              {answer}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
