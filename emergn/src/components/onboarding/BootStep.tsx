"use client";

import { motion } from "framer-motion";
import type { OnboardingStep } from "@/types";
import { GlitchText } from "@/components/effects/GlitchText";
import { bootSlideIn, terminalLineReveal, staggerTerminal, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface BootStepProps {
  step: OnboardingStep;
}

const textColorMap = {
  cyan: "text-pulse-cyan",
  violet: "text-signal-violet",
  orange: "text-ember-orange",
};

const borderColorMap = {
  cyan: "border-pulse-cyan/30",
  violet: "border-signal-violet/30",
  orange: "border-ember-orange/30",
};

export function BootStep({ step }: BootStepProps) {
  return (
    <motion.div
      key={step.id}
      variants={bootSlideIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col gap-6"
    >
      {/* System label row */}
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em]">
        <span className={cn(textColorMap[step.accentColor])}>
          {">"} {step.systemLabel}
        </span>
        <span className="text-neural-white/30">{step.statusCode}</span>
      </div>

      {/* Terminal block */}
      <motion.div
        variants={staggerTerminal}
        initial="hidden"
        animate="visible"
        className={cn(
          "border bg-ghost-gray/10 p-4 font-mono text-xs leading-relaxed",
          borderColorMap[step.accentColor]
        )}
      >
        {step.terminalLines.map((line, i) => (
          <motion.div
            key={i}
            variants={terminalLineReveal}
            className="flex gap-2"
          >
            <span className={cn(textColorMap[step.accentColor])}>{">"}</span>
            <span className="text-neural-white/60">{line}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Headline */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.8 }}
      >
        <GlitchText
          as="h2"
          className="font-headline text-2xl font-bold uppercase tracking-tight text-neural-white sm:text-3xl md:text-4xl"
        >
          {step.headline}
        </GlitchText>
      </motion.div>

      {/* Body */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="max-w-lg font-body text-sm leading-relaxed text-neural-white/50 sm:text-base"
      >
        {step.body}
      </motion.p>
    </motion.div>
  );
}
