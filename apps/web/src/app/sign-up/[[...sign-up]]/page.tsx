import { SignUp } from "@clerk/nextjs";
import { AuthHeroLayout } from "@/components/AuthHeroLayout";

const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: "#1F3D2E",
    colorBackground: "#FFFBF1",
    colorInputBackground: "#FFFBF1",
    colorInputText: "#1B1A16",
    colorText: "#1B1A16",
    colorTextSecondary: "#7A746A",
    colorTextOnPrimaryBackground: "#FFFBF1",
    colorDanger: "#C56B3D",
    borderRadius: "12px",
    fontFamily: "Archivo, system-ui, -apple-system, sans-serif",
  },
  elements: {
    card: {
      boxShadow: "none",
      border: "none",
      background: "transparent",
      padding: 0,
      width: "100%",
    },
    header: { display: "none" },
    socialButtonsBlockButton: {
      background: "#FFFBF1",
      border: "0.5px solid rgba(27,26,22,0.10)",
      borderRadius: "12px",
      padding: "11px 0",
      fontWeight: "600",
      fontSize: "13px",
    },
    dividerText: {
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "10px",
      letterSpacing: "1.5px",
    },
    formFieldInput: {
      background: "#FFFBF1",
      border: "0.5px solid rgba(27,26,22,0.10)",
      borderRadius: "12px",
      padding: "12px 14px",
      fontSize: "15px",
      fontWeight: "500",
    },
    formFieldLabel: {
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "9px",
      letterSpacing: "1.4px",
      textTransform: "uppercase",
      color: "#7A746A",
      fontWeight: "600",
    },
    formButtonPrimary: {
      background: "#1F3D2E",
      borderRadius: "12px",
      padding: "14px 0",
      fontSize: "14px",
      fontWeight: "700",
      boxShadow: "0 8px 22px rgba(31,61,46,0.30)",
    },
    footerActionLink: { color: "#1F3D2E", fontWeight: "600" },
  },
} as const;

export default function SignUpPage() {
  return (
    <AuthHeroLayout title="Start your quest." subtitle="Free, ad-free, your data stays yours.">
      <SignUp
        appearance={CLERK_APPEARANCE}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
      />
    </AuthHeroLayout>
  );
}
