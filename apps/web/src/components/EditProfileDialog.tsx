"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUsername?: string;
  initialBio?: string;
  onSaved?: (username: string, bio: string, fullName: string | null) => void;
}

export default function EditProfileDialog({
  open,
  onOpenChange,
  initialUsername = "",
  initialBio = "",
  onSaved,
}: EditProfileDialogProps) {
  const { user } = useUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync Clerk name into local state when dialog opens
  useEffect(() => {
    if (open && user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setUsername(initialUsername);
      setBio(initialBio);
      setError("");
    }
  }, [open, user, initialUsername, initialBio]);

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      // Update display name via Clerk
      if (user) {
        await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      }

      // Update username + bio via our API
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          bio: bio.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save profile");
        return;
      }

      const savedUsername = username.trim().toLowerCase();
      const savedBio = bio.trim();
      const savedFullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || null;
      onSaved?.(savedUsername, savedBio, savedFullName);
      onOpenChange(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name row */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="ep-first" className="text-sm font-medium">First name</Label>
              <input
                id="ep-first"
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                maxLength={50}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="ep-last" className="text-sm font-medium">Last name</Label>
              <input
                id="ep-last"
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                maxLength={50}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-username" className="text-sm font-medium">Username</Label>
            <div className="flex items-center gap-0">
              <span className="px-3 py-2 text-sm bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">@</span>
              <input
                id="ep-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <p className="text-[11px] text-gray-400">3–20 characters: letters, numbers, underscores</p>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-bio" className="text-sm font-medium">
              Bio <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <textarea
              id="ep-bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A short description about yourself"
              rows={3}
              maxLength={200}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
            <p className="text-[11px] text-gray-400 text-right">{bio.length}/200</p>
          </div>

          {/* Email — read-only */}
          {email && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Email <span className="text-gray-400 font-normal">(read-only)</span>
              </Label>
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{email}</p>
              <p className="text-[11px] text-gray-400">Email changes are managed through your account security settings.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || username.trim().length < 3}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
