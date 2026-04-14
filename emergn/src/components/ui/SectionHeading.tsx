"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  title,
  subtitle,
  className,
  align = "center",
}: SectionHeadingProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={cn(
        "mb-16",
        align === "center" && "text-center",
        className
      )}
    >
      <h2 className="font-headline text-3xl font-bold uppercase tracking-[0.1em] text-neural-white md:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 font-mono text-sm uppercase tracking-[0.15em] text-neural-white/40 md:text-base">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
