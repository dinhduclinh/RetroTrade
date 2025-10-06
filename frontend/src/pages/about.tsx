import Head from "next/head";
import { AboutHero } from "@/components/ui/about-hero";
import { AboutStory } from "@/components/ui/about-story";
import { AboutValues } from "@/components/ui/about-values";
import { AboutStats } from "@/components/ui/about-stats";
import { AboutTeam } from "@/components/ui/about-team";
import { CTASection } from "@/components/ui/cta-section";

export default function About() {
  return (
    <>
      <Head>
        <title>Về chúng tôi - RetroTrade</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Tìm hiểu về RetroTrade - nền tảng buôn bán đồ cũ uy tín và hiệu quả" />
      </Head>

      <AboutHero />
      <AboutStory />
      <AboutValues />
      <AboutStats />
      <AboutTeam />
      <CTASection />
    </>
  );
}