import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { GrievanceProvider } from "@/context/GrievanceContext";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { CitizenNav } from "@/components/layout/CitizenNav";

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
            <Navbar />
            <div className="flex-1 flex w-full">
              {/* Desktop Persistent Sidebar */}
              <div className="hidden lg:block">
                <Sidebar />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 w-full lg:pl-72 pt-16 pb-20 lg:pb-8 transition-all">
                {children}
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <CitizenNav />
          </GrievanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
