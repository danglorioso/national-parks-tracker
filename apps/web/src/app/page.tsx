"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";
import CTA from "@/components/CTA";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/map');
    }
  }, [isLoaded, isSignedIn, router]);
  
  if (isSignedIn) {
    return (
      <></>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Hero />
      <About />
      <Features />
      <CTA />
    </div>
  );
}
