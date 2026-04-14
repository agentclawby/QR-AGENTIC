import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Civilization } from "@/components/sections/Civilization";
import { Pillars } from "@/components/sections/Pillars";
import { Features } from "@/components/sections/Features";
import { SentienceIndex } from "@/components/sections/SentienceIndex";
import { Token } from "@/components/sections/Token";
import { ViralGrowth } from "@/components/sections/ViralGrowth";
import { Roadmap } from "@/components/sections/Roadmap";
import { Manifesto } from "@/components/sections/Manifesto";
import { FAQ } from "@/components/sections/FAQ";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Civilization />
        <Pillars />
        <Features />
        <SentienceIndex />
        <Token />
        <ViralGrowth />
        <Roadmap />
        <Manifesto />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
