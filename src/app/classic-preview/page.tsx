import { LandingPage } from "@/components/landing/landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Classic Preview",
  description: "Backup der bisherigen ADR Bot Landing Page vor dem neuen Live-Design.",
  alternates: {
    canonical: "/classic-preview",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ClassicPreviewRoute() {
  return <LandingPage />;
}
