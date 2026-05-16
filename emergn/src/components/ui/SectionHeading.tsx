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
        "mb-10 sm:mb-12 md:mb-16",
        align === "center" && "text-center",
        className
      )}
    >
      <h2 className="mx-auto max-w-4xl break-words font-headline text-3xl font-bold uppercase tracking-[0.06em] text-neural-white sm:tracking-[0.1em] md:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl font-mono text-xs uppercase leading-relaxed tracking-[0.1em] text-neural-white/40 sm:text-sm sm:tracking-[0.15em] md:text-base">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
