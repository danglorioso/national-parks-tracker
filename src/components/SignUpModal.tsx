"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Trees } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  switchToSignIn?: () => void;
}

export default function SignUpModal({ open, onOpenChange, switchToSignIn }: SignUpModalProps) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message?: string }> };
      setError(error?.errors?.[0]?.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError("");
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        onOpenChange(false);
        router.push("/");
        router.refresh();
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message?: string }> };
      setError(error?.errors?.[0]?.message || "Verification code is incorrect");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "oauth_google" | "oauth_apple") => {
    if (!isLoaded || !signUp) return;
    
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/",
        redirectUrlComplete: "/",
      });
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message?: string }> };
      setError(error?.errors?.[0]?.message || "An error occurred during authentication");
    }
  };

  if (pendingVerification) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Trees className="w-8 h-8 text-green-600" />
              <DialogTitle className="text-2xl font-bold text-gray-900">ParkQuest</DialogTitle>
            </div>
            <DialogDescription className="text-center text-base">
              Verify your email address
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={loading || !isLoaded}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                We sent a verification code to {email}
              </p>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={loading || !isLoaded}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setPendingVerification(false);
                setCode("");
                setError("");
              }}
            >
              Back
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Trees className="w-8 h-8 text-green-600" />
              <DialogTitle className="text-2xl font-bold text-gray-900">ParkQuest</DialogTitle>
            </div>
            <DialogDescription className="text-center text-base">
              Start tracking your national park adventures
            </DialogDescription>
          </DialogHeader>
        <div className="space-y-4">
          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuth("oauth_google")}
              disabled={!isLoaded}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuth("oauth_apple")}
              disabled={!isLoaded}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder=""
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading || !isLoaded}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder=""
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading || !isLoaded}
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || !isLoaded}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || !isLoaded}
                className="w-full"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white hover:cursor-pointer"
              disabled={loading || !isLoaded}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            {switchToSignIn && (
              <div className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    switchToSignIn();
                  }}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign in
                </button>
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

