"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/icons/Logo";
import { ScanlineOverlay } from "@/components/effects/ScanlineOverlay";
import { Button } from "@/components/ui/Button";
import { BootProgress } from "./BootProgress";
import { BootStep } from "./BootStep";
import { ONBOARDING_STEPS } from "@/lib/onboarding-data";
import { bootOverlayExit } from "@/lib/animations";

interface BootSequenceProps {
  onComplete: () => void;
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handleSkip]);

  return (
    <motion.div
      variants={bootOverlayExit}
      initial={{ opacity: 0 }}
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[60] flex flex-col bg-void-black"
    >
      <ScanlineOverlay />

      {/* Grid background texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8 sm:py-6">
        <Logo />
        <button
          onClick={handleSkip}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30 transition-colors hover:text-neural-white/60"
        >
          [SKIP BOOT]
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 sm:px-8 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-2xl">
          {/* Progress bar */}
          <div className="mb-8">
            <BootProgress
              currentStep={currentStep}
              totalSteps={totalSteps}
              accentColor={step.accentColor}
            />
          </div>

          {/* Step content with AnimatePresence */}
          <div className="min-h-[320px] sm:min-h-[360px]">
            <AnimatePresence mode="wait">
              <BootStep key={step.id} step={step} />
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-8 sm:py-8 md:px-16 lg:px-24">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30">
          SYS {currentStep + 1}/{totalSteps}
        </span>

        {isLastStep ? (
          <Button variant="primary" size="lg" onClick={onComplete}>
            Enter the Network
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={handleNext}>
            Next {">"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
