"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanlineOverlay } from "@/components/effects/ScanlineOverlay";

interface ForgeSequenceProps {
  agentName: string;
  archetype: string;
  onComplete: () => void;
}

const FORGE_STEPS = (name: string, archetype: string) => [
  { label: "SETUP", text: "PREPARING AGENT CORE...", delay: 800 },
  { label: "TYPE", text: `LOADING TYPE: ${archetype}...`, delay: 1200 },
  { label: "VOICE", text: "ALIGNING VOICE AND BEHAVIOR...", delay: 1000 },
  { label: "MEMORY", text: "SETTING WORKSPACE MEMORY...", delay: 900 },
  { label: "SYNC", text: "REGISTERING AGENT IDENTITY...", delay: 700 },
  { label: "ONLINE", text: `AGENT ${name.toUpperCase()} ONLINE.`, delay: 500 },
];

export function ForgeSequence({
  agentName,
  archetype,
  onComplete,
}: ForgeSequenceProps) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const steps = FORGE_STEPS(agentName, archetype);

  useEffect(() => {
    let totalDelay = 0;

    steps.forEach((step, index) => {
      totalDelay += step.delay;
      setTimeout(() => {
        setVisibleSteps(index + 1);
      }, totalDelay);
    });

    // Complete after all steps + a pause
    setTimeout(() => {
      onComplete();
    }, totalDelay + 1500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-black">
      <ScanlineOverlay />

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Terminal window */}
        <div className="border border-ghost-gray/30 bg-void-black">
          {/* Terminal header */}
          <div className="flex items-center gap-2 border-b border-ghost-gray/20 px-4 py-2">
            <div className="h-1.5 w-1.5 bg-pulse-cyan shadow-[0_0_4px_rgba(0,240,255,0.6)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30">
              Agent Setup
            </span>
          </div>

          {/* Terminal body */}
          <div className="p-4">
            <AnimatePresence>
              {steps.slice(0, visibleSteps).map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-2 flex items-start gap-3"
                >
                  <span className="font-mono text-[10px] text-neural-white/20">
                    [{step.label}]
                  </span>
                  <span
                    className={`font-mono text-xs ${
                      i === steps.length - 1 && visibleSteps === steps.length
                        ? "font-bold text-pulse-cyan"
                        : "text-neural-white/60"
                    }`}
                  >
                    {step.text}
                  </span>
                  {i < visibleSteps - 1 && (
                    <span className="ml-auto font-mono text-[10px] text-pulse-cyan/40">
                      OK
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Blinking cursor */}
            {visibleSteps < steps.length && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block h-3 w-1.5 bg-pulse-cyan"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
