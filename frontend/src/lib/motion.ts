import { Variants } from "framer-motion";
import { Transition } from "framer-motion";

/* ================= BASE EASING ================= */
export const ease = [0.25, 0.1, 0.25, 1] as any;

/* ================= FADE UP ================= */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease,
    },
  },
};

/* ================= FADE IN ================= */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease,
    },
  },
};

/* ================= SCALE IN ================= */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease,
    },
  },
};

/* ================= STAGGER ================= */
export const stagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/* ================= HOVER (APPLE STYLE) ================= */
export const hoverLift = {
  whileHover: {
    y: -6,
    scale: 1.02,
  },
  transition: {
    type: "tween" as const,
    duration: 0.25,
    ease,
  } as Transition,
};

/* ================= BUTTON ================= */
export const buttonTap = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.04 },
  transition: {
    type: "tween" as const, // ✅ FIX
    duration: 0.2,
    ease,
  } as Transition, // ✅ FIX
};
