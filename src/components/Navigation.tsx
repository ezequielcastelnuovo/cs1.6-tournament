"use client";

import { Swords, Map, Trophy } from "lucide-react";

interface NavigationProps {
  activeTab: "bracket" | "veto" | "leaderboard";
  onTabChange: (tab: "bracket" | "veto" | "leaderboard") => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <header className="border-b border-[#282a32] bg-[#0c0d0f]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-md overflow-hidden bg-[#1a1b1f] border border-[#282a32] p-1 flex items-center justify-center shadow-md">
              <img
                src="/logo.png"
                alt="CS Logo"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-wider uppercase text-white">
                  UADE CS 1.6 <span className="text-[#FF5500]">1V1 TOURNAMENT</span>
                </h1>
                <span className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 rounded">
                  LAN EDITION
                </span>
              </div>
              <p className="text-[10px] text-[#8d939e] tracking-widest uppercase font-semibold">
                TOURNAMENT & VETO SYSTEM
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1.5 bg-[#141518] p-1 rounded-lg border border-[#282a32]">
            <button
              onClick={() => onTabChange("bracket")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                activeTab === "bracket"
                  ? "bg-[#FF5500] text-white shadow-lg shadow-[#FF5500]/25"
                  : "text-[#8d939e] hover:text-white hover:bg-[#1a1b1f]"
              }`}
            >
              <Swords size={15} />
              <span className="hidden sm:inline">Brackets Torneo</span>
              <span className="sm:hidden">Brackets</span>
            </button>
            <button
              onClick={() => onTabChange("veto")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                activeTab === "veto"
                  ? "bg-[#FF5500] text-white shadow-lg shadow-[#FF5500]/25"
                  : "text-[#8d939e] hover:text-white hover:bg-[#1a1b1f]"
              }`}
            >
              <Map size={15} />
              <span className="hidden sm:inline">Veto de Mapas</span>
              <span className="sm:hidden">Veto</span>
            </button>
            <button
              onClick={() => onTabChange("leaderboard")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                activeTab === "leaderboard"
                  ? "bg-[#FF5500] text-white shadow-lg shadow-[#FF5500]/25"
                  : "text-[#8d939e] hover:text-white hover:bg-[#1a1b1f]"
              }`}
            >
              <Trophy size={15} />
              <span className="hidden sm:inline">Leaderboard</span>
              <span className="sm:hidden">Leaderboard</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
