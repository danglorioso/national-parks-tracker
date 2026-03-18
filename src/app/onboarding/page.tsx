"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalized = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setError("3–20 characters: letters, numbers, and underscores only");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalized }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.replace("/map");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Logo />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Choose your username</h1>
          <p className="text-sm text-gray-500 text-center">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}! Pick a username so others can find and follow you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent">
              <span className="text-gray-400 text-sm select-none">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="your_username"
                maxLength={20}
                className="flex-1 outline-none text-sm text-gray-900 bg-transparent"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-400">3–20 characters. Letters, numbers, and underscores.</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading || username.length < 3}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? "Saving..." : "Get started"}
          </Button>
        </form>
      </div>
    </div>
  );
}
