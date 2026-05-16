"use client";

import { motion } from "framer-motion";
import { FAQ_ITEMS } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function FAQ() {
  return (
    <section
      id="faq"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading title="Questions." subtitle="Answers that don't hedge." />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {FAQ_ITEMS.map((item) => (
            <motion.div key={item.question} variants={fadeInUp}>
              <Accordion question={item.question} answer={item.answer} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
