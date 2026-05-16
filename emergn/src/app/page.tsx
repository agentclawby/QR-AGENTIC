import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Civilization } from "@/components/sections/Civilization";
import { Pillars } from "@/components/sections/Pillars";
import { Features } from "@/components/sections/Features";
import { SentienceIndex } from "@/components/sections/SentienceIndex";
import { Token } from "@/components/sections/Token";
import { ViralGrowth } from "@/components/sections/ViralGrowth";
import { Manifesto } from "@/components/sections/Manifesto";
import { FAQ } from "@/components/sections/FAQ";
import { CursorSpotlight } from "@/components/effects/CursorSpotlight";

export default function Home() {
  return (
    <>
      <CursorSpotlight />
      <Header />
      <main className="relative">
        <Hero />
        <Civilization />
        <Pillars />
        <Features />
        <SentienceIndex />
        <Token />
        <ViralGrowth />
        <Manifesto />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
