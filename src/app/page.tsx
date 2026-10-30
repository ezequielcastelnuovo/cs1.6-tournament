"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import BracketGenerator from "@/components/BracketGenerator";
import Leaderboard from "@/components/Leaderboard";
import MapPool from "@/components/MapPool";
import { useAuth } from "@/context/AuthContext";
import { Lock, LogIn, UserPlus, Shield, Swords, Trophy, Map, Sparkles, Loader2 } from "lucide-react";

export default function Home() {
  const { user, isLoading, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<"bracket" | "leaderboard" | "maps">("bracket");

  return (
    <>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[65vh] p-6 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF5500] mb-4" />
            <p className="text-xs uppercase tracking-widest text-[#8d939e] font-bold">
              Verificando sesión...
            </p>
          </div>
        ) : !user ? (
          /* AUTH GATE: Requiere login para utilizar la plataforma y asegurar persistencia por cuenta */
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="max-w-3xl w-full bg-[#141518] border border-[#282a32] rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden animate-fade-in-up">
              {/* Decorative top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF5500] to-transparent" />
              <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-96 bg-[#FF5500]/5 rounded-full blur-3xl pointer-events-none" />

              {/* Lock Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] text-[10px] font-black uppercase tracking-widest mb-6">
                <Lock size={13} />
                <span>ACCESO RESTRINGIDO · INICIO DE SESIÓN REQUERIDO</span>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-wider text-white mb-4">
                UADE CS 1.6 <span className="text-[#FF5500]">TOURNAMENT PLATFORM</span>
              </h2>
              <p className="text-sm text-[#8d939e] max-w-xl mx-auto leading-relaxed mb-8">
                Para que todos tus torneos, cuadros de llaves eliminatorias, veto de mapas y
                estadísticas del leaderboard <strong className="text-white">persistan de forma segura en tu cuenta personal</strong>, debes iniciar sesión o registrarte.
              </p>

              {/* Direct Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-10">
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="w-full sm:w-auto flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E04B00] hover:from-[#ff6b1a] hover:to-[#FF5500] text-white font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-[#FF5500]/25 hover:shadow-faceit-orange flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn size={16} />
                  <span>Iniciar Sesión</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="w-full sm:w-auto flex-1 px-6 py-3.5 rounded-xl bg-[#1a1b1f] hover:bg-[#22242a] text-white hover:text-[#FF5500] border border-[#282a32] hover:border-[#FF5500]/50 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>Crear Cuenta</span>
                </button>
              </div>

              {/* Feature pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[#282a32]/80 text-left">
                <div className="bg-[#101114] border border-[#282a32]/60 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-[#FF5500]/15 flex items-center justify-center text-[#FF5500] mb-3">
                    <Shield size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase text-white mb-1 tracking-wide">
                    Persistencia por Cuenta
                  </h3>
                  <p className="text-[11px] text-[#8d939e] leading-relaxed">
                    Tus brackets y partidas guardadas en la nube, exclusivas para tu perfil sin interferir con otros usuarios.
                  </p>
                </div>

                <div className="bg-[#101114] border border-[#282a32]/60 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-[#FF5500]/15 flex items-center justify-center text-[#FF5500] mb-3">
                    <Swords size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase text-white mb-1 tracking-wide">
                    Brackets Dinámicos 1v1
                  </h3>
                  <p className="text-[11px] text-[#8d939e] leading-relaxed">
                    Generación inteligente con pase de impares, avance directo a la Gran Final y veto de mapas integrado.
                  </p>
                </div>

                <div className="bg-[#101114] border border-[#282a32]/60 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-[#FF5500]/15 flex items-center justify-center text-[#FF5500] mb-3">
                    <Trophy size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase text-white mb-1 tracking-wide">
                    Scores & Leaderboard
                  </h3>
                  <p className="text-[11px] text-[#8d939e] leading-relaxed">
                    Carga los resultados de cada enfrentamiento y observa cómo el ranking se actualiza de forma automática.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* USUARIO LOGUEADO: Acceso completo con persistencia asegurada en su cuenta */
          <>
            {activeTab === "bracket" && <BracketGenerator />}
            {activeTab === "leaderboard" && <Leaderboard />}
            {activeTab === "maps" && <MapPool />}
          </>
        )}
      </main>
    </>
  );
}
