"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VisitsRedirect() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/users/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.username) {
          router.replace(`/profile/${data.username}`);
        } else {
          router.replace("/onboarding");
        }
      })
      .catch(() => router.replace("/map"));
  }, [router]);

  return null;
}
