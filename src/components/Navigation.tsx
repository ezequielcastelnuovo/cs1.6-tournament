"use client";

import { Swords, Map, Trophy, User, LogIn, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import UserProfileModal from "@/components/UserProfileModal";

interface NavigationProps {
  activeTab: "bracket" | "leaderboard";
  onTabChange: (tab: "bracket" | "leaderboard") => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { user, openAuthModal, openProfileModal, isLoading } = useAuth();

  return (
    <>
      <header className="border-b border-[#282a32] bg-[#0c0d0f]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-md overflow-hidden bg-[#1a1b1f] border border-[#282a32] p-1 flex items-center justify-center shadow-md shrink-0">
                <img
                  src="/logo.png"
                  alt="CS Logo"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xs sm:text-base font-extrabold tracking-wider uppercase text-white truncate">
                    UADE CS 1.6 <span className="text-[#FF5500] hidden sm:inline">1V1 TOURNAMENT</span>
                    <span className="text-[#FF5500] sm:hidden">1v1</span>
                  </h1>
                  <span className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 rounded shrink-0">
                    LAN EDITION
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-[#8d939e] tracking-widest uppercase font-semibold hidden xs:block truncate">
                  TOURNAMENT & VETO SYSTEM
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex gap-1 bg-[#141518] p-1 rounded-lg border border-[#282a32] shrink-0">
              <button
                onClick={() => onTabChange("bracket")}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeTab === "bracket"
                    ? "bg-[#FF5500] text-white shadow-lg shadow-[#FF5500]/25"
                    : "text-[#8d939e] hover:text-white hover:bg-[#1a1b1f]"
                }`}
              >
                <Swords size={14} className="shrink-0" />
                <span className="hidden md:inline">Brackets Torneo</span>
                <span className="md:hidden">Bracket</span>
              </button>
              <button
                onClick={() => onTabChange("leaderboard")}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeTab === "leaderboard"
                    ? "bg-[#FF5500] text-white shadow-lg shadow-[#FF5500]/25"
                    : "text-[#8d939e] hover:text-white hover:bg-[#1a1b1f]"
                }`}
              >
                <Trophy size={14} className="shrink-0" />
                <span className="hidden md:inline">Leaderboard</span>
                <span className="md:hidden">Tabla</span>
              </button>
            </nav>

            {/* User Account / Profile Section */}
            <div className="flex items-center shrink-0">
              {isLoading ? (
                <div className="w-8 h-8 rounded-lg bg-[#1a1b1f] animate-pulse border border-[#282a32]" />
              ) : user ? (
                <button
                  type="button"
                  onClick={openProfileModal}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#141518] hover:bg-[#1c1d22] border border-[#282a32] hover:border-[#FF5500]/50 transition-all cursor-pointer group"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-black shadow-sm"
                    style={{ backgroundColor: user.avatarColor || "#FF5500" }}
                  >
                    {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-bold text-white group-hover:text-[#FF5500] transition-colors leading-tight">
                      {user.displayName || user.username}
                    </div>
                    <div className="text-[9px] text-[#8d939e] uppercase font-bold tracking-wider">
                      {user.role === "admin" ? "Admin" : "Jugador"}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-[#8d939e] group-hover:text-white transition-colors" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FF5500] hover:bg-[#ff6b1a] text-white text-xs font-black uppercase tracking-wider transition shadow-md shadow-[#FF5500]/20 cursor-pointer"
                >
                  <LogIn size={14} />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                  <span className="sm:hidden">Entrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <AuthModal />
      <UserProfileModal onTabChange={onTabChange} />
    </>
  );
}
