"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const EXEMPT_PATHS = ['/onboarding', '/sign-in', '/sign-up', '/sso-callback', '/'];

export default function OnboardingGuard() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (EXEMPT_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return;

    fetch('/api/users/me')
      .then(res => {
        if (res.status === 404) {
          router.replace('/onboarding');
        }
      })
      .catch(() => {});
  }, [isLoaded, isSignedIn, pathname, router]);

  return null;
}
