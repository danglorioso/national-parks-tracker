import Header from "@/components/Header";
import Hero from "@/components/Hero";
import MapHomePage from "@/components/MapHomePage";
import Features from "@/components/Features";
import CTA from "@/components/CTA";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Hero />
      <MapHomePage />
      <Features />
      <CTA />
    </div>
  );
}
