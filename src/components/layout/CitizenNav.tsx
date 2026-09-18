"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CitizenNav() {
  const pathname = usePathname() || "";

  const itemClass = (href: string) => {
    const isActive = pathname === href;
    return `flex flex-col items-center justify-center flex-1 py-2 text-[10px] font-medium transition-colors ${
      isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
    }`;
  };

  return (
    <nav aria-label="Citizen Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-surface-container flex items-center justify-around h-16 px-2 shadow-elevated">
      <Link href="/citizen/dashboard" aria-label="Go to My Home Citizen Dashboard" className={`${itemClass("/citizen/dashboard")} min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none rounded-xl`}>
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">dashboard</span>
        <span>My Home</span>
      </Link>
      <Link href="/citizen/submit" aria-label="Report New Civic Issue" className={`${itemClass("/citizen/submit")} min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none rounded-xl`}>
        <div className="w-10 h-10 -mt-5 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-elevated" aria-hidden="true">
          <span className="material-symbols-outlined text-[24px]">add</span>
        </div>
        <span className="mt-1 font-bold">Report Issue</span>
      </Link>
      <Link href="/authority/grievances/GRV-2026-1042" aria-label="View Active Case GRV-1042" className={`${itemClass("/authority/grievances/GRV-2026-1042")} min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none rounded-xl`}>
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">inbox</span>
        <span>Case GRV-1042</span>
      </Link>
    </nav>
  );
}
