"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AuthHeroLayout } from "@/components/AuthHeroLayout";

export default function OnboardingUsernamePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.replace("/"); return; }
    if (user.username) { router.replace("/map"); }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user || user.username) return null;

  return <AuthHeroLayout forcedMode="username" />;
}
