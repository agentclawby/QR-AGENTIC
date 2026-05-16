import type { Variants, Transition } from "framer-motion";

// ═══════════════════════════════════════════════
// EASING — coherent system: signature snap + spring + linear
// ═══════════════════════════════════════════════
export const easeSnap = [0.22, 1, 0.36, 1] as const;
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeInOutCubic = [0.65, 0, 0.35, 1] as const;
export const springSoft: Transition = { type: "spring", stiffness: 220, damping: 26, mass: 0.6 };
export const springSnappy: Transition = { type: "spring", stiffness: 380, damping: 28, mass: 0.5 };

// ═══════════════════════════════════════════════
// ENTRY — opacity + translate
// ═══════════════════════════════════════════════
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeSnap },
  },
};

export const fadeInUpSoft: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutExpo },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easeSnap },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easeSnap },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easeSnap },
  },
};

// ═══════════════════════════════════════════════
// CINEMATIC — blur cascade, clip reveal, depth
// ═══════════════════════════════════════════════
export const blurReveal: Variants = {
  hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.8, ease: easeOutExpo },
  },
};

export const clipReveal: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)", opacity: 0 },
  visible: {
    clipPath: "inset(0 0% 0 0)",
    opacity: 1,
    transition: { duration: 0.9, ease: easeOutExpo },
  },
};

export const clipRevealUp: Variants = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  visible: {
    clipPath: "inset(0% 0 0 0)",
    transition: { duration: 0.9, ease: easeOutExpo },
  },
};

export const depthIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: easeOutExpo },
  },
};

export const liftIn: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: -6 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
};

// ═══════════════════════════════════════════════
// STAGGER CONTAINERS
// ═══════════════════════════════════════════════
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const staggerWords: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

export const wordReveal: Variants = {
  hidden: { opacity: 0, y: "0.5em", filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: easeOutExpo },
  },
};

// ═══════════════════════════════════════════════
// SVG / PATH
// ═══════════════════════════════════════════════
export const drawLine: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.5, ease: "easeInOut" },
  },
};

export const drawLineSlow: Variants = {
  hidden: { pathLength: 0 },
  visible: {
    pathLength: 1,
    transition: { duration: 2.4, ease: easeInOutCubic },
  },
};

// ═══════════════════════════════════════════════
// HOVER / INTERACTION PRIMITIVES
// ═══════════════════════════════════════════════
export const hoverLift = {
  rest: { y: 0, transition: springSoft },
  hover: { y: -4, transition: springSoft },
};

export const hoverGlow = {
  rest: { opacity: 0 },
  hover: { opacity: 1, transition: { duration: 0.4, ease: easeOutExpo } },
};

export const tapPress = {
  scale: 0.98,
  transition: { duration: 0.12, ease: easeSnap },
};

// ═══════════════════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════════════════
export const shake: Variants = {
  rest: { x: 0 },
  shake: {
    x: [0, -6, 6, -4, 4, -2, 0],
    transition: { duration: 0.45, ease: "easeInOut" },
  },
};

export const pulseGlow: Variants = {
  rest: { boxShadow: "0 0 0px rgba(0, 240, 255, 0)" },
  pulse: {
    boxShadow: [
      "0 0 0px rgba(0, 240, 255, 0)",
      "0 0 24px rgba(0, 240, 255, 0.45)",
      "0 0 0px rgba(0, 240, 255, 0)",
    ],
    transition: { duration: 1.6, ease: "easeInOut" },
  },
};

// ═══════════════════════════════════════════════
// PAGE TRANSITION
// ═══════════════════════════════════════════════
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(6px)",
    transition: { duration: 0.25, ease: easeSnap },
  },
};

// ═══════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════
export const bootSlideIn: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easeSnap },
  },
  exit: {
    opacity: 0,
    x: -60,
    transition: { duration: 0.3, ease: easeSnap },
  },
};

export const bootOverlayExit: Variants = {
  visible: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: { duration: 0.6, ease: easeSnap },
  },
};

export const terminalLineReveal: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

export const staggerTerminal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};
