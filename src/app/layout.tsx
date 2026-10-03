import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import YouTubeLab from "@/components/YouTubeLab";

export const metadata: Metadata = {
  title: "Read to Speak — American English A1–C2",
  description:
    "Natural General American audio, video shadowing, useful spoken chunks, and guided speaking practice for every CEFR level from A1 to C2.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <YouTubeLab />
      </body>
    </html>
  );
}
