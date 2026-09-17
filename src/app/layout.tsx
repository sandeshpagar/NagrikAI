import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { GrievanceProvider } from "@/context/GrievanceContext";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";

export const metadata: Metadata = {
  title: "NagrikAI · AI-Powered Civic Grievance & Resolution Platform",
  description:
    "Government Trust + Modern AI Product for intelligent civic grievance triage, evidence verification, and autonomous follow-up.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface antialiased h-full flex flex-col">
        <AuthProvider>
          <GrievanceProvider>
            <AppLayoutShell>{children}</AppLayoutShell>
          </GrievanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
