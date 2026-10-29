"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  X,
  LogOut,
  Trophy,
  Skull,
  Crosshair,
  TrendingUp,
  Calendar,
  CheckCircle,
  PlusCircle,
  Shield,
} from "lucide-react";
import type { TournamentState } from "@/lib/types";

interface UserProfileModalProps {
  onTabChange?: (tab: "bracket" | "leaderboard") => void;
}

export default function UserProfileModal({ onTabChange }: UserProfileModalProps) {
  const { user, token, isProfileModalOpen, closeProfileModal, logout } = useAuth();
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    if (!isProfileModalOpen || !token) return;
    setJoinSuccess(false);

    async function loadTournament() {
      try {
        const res = await fetch("/api/tournament", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setTournament(data);
        }
      } catch (err) {
        console.warn("Could not load tournament state for profile:", err);
      }
    }

    loadTournament();
  }, [isProfileModalOpen, token]);

  if (!isProfileModalOpen || !user) return null;

  // Calculate personal stats
  const playerName = user.displayName || user.username;
  const isEnrolled =
    tournament?.participants?.some(
      (p) => p.trim().toLowerCase() === user.username.toLowerCase() ||
             p.trim().toLowerCase() === user.displayName.toLowerCase()
    ) || false;

  const playerStats =
    tournament?.leaderboard?.[playerName] ||
    tournament?.leaderboard?.[user.username] || { kills: 0, deaths: 0 };

  const kills = playerStats.kills || 0;
  const deaths = playerStats.deaths || 0;
  const diff = kills - deaths;
  const kdRatio = deaths === 0 ? kills.toFixed(2) : (kills / deaths).toFixed(2);

  // Check bracket status
  let tournamentStatus = "No inscripto en el torneo actual";
  if (tournament?.generated) {
    if (tournament.champion === playerName || tournament.champion === user.username) {
      tournamentStatus = "🏆 ¡CAMPEÓN DEL TORNEO!";
    } else if (isEnrolled) {
      tournamentStatus = "En competencia activa";
    }
  } else if (isEnrolled) {
    tournamentStatus = "Inscripto (esperando inicio de llaves)";
  }

  const handleJoinTournament = async () => {
    if (!tournament) return;
    setIsJoining(true);

    try {
      const updatedParticipants = Array.from(
        new Set([...(tournament.participants || []), playerName])
      );

      const updatedLeaderboard = {
        ...(tournament.leaderboard || {}),
        [playerName]: tournament.leaderboard?.[playerName] || { kills: 0, deaths: 0 },
      };

      const updatedState: TournamentState = {
        ...tournament,
        participants: updatedParticipants,
        leaderboard: updatedLeaderboard,
      };

      const res = await fetch("/api/tournament", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedState),
      });

      if (res.ok) {
        setTournament(updatedState);
        setJoinSuccess(true);
        setTimeout(() => setJoinSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Error joining tournament:", e);
    } finally {
      setIsJoining(false);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Reciente";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#141518] border border-[#282a32] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with user's avatar color */}
        <div
          className="h-20 w-full relative"
          style={{
            background: `linear-gradient(135deg, ${user.avatarColor}40 0%, #141518 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:12px_12px]" />
          <button
            onClick={closeProfileModal}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-[#8d939e] hover:text-white hover:bg-black/40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-0">
          {/* Avatar and Name */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="flex items-end gap-3">
              <div
                className="w-16 h-16 rounded-xl border-4 border-[#141518] shadow-xl flex items-center justify-center text-white font-black text-2xl uppercase tracking-wider"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.displayName.charAt(0) || user.username.charAt(0)}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                    {user.displayName}
                  </h3>
                  {user.role === "admin" && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 uppercase">
                      <Shield size={10} /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8d939e] font-mono">@{user.username}</p>
              </div>
            </div>
          </div>

          {/* Member since badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#8d939e] mb-5">
            <Calendar size={13} />
            <span>Miembro desde el {formattedDate}</span>
          </div>

          {/* Tournament Personal Stats */}
          <div className="bg-[#0c0d0f] border border-[#282a32] rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#8d939e] uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair size={13} className="text-[#FF5500]" />
                Estadísticas del Torneo
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#1a1b1f] border border-[#282a32] text-white">
                {tournamentStatus}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="bg-[#141518] p-2.5 rounded-lg border border-[#282a32] text-center">
                <div className="text-[10px] text-[#8d939e] font-bold uppercase">Kills</div>
                <div className="text-base font-black text-white mt-0.5 flex items-center justify-center gap-1">
                  <Crosshair size={12} className="text-emerald-400" />
                  {kills}
                </div>
              </div>

              <div className="bg-[#141518] p-2.5 rounded-lg border border-[#282a32] text-center">
                <div className="text-[10px] text-[#8d939e] font-bold uppercase">Deaths</div>
                <div className="text-base font-black text-white mt-0.5 flex items-center justify-center gap-1">
                  <Skull size={12} className="text-rose-400" />
                  {deaths}
                </div>
              </div>

              <div className="bg-[#141518] p-2.5 rounded-lg border border-[#282a32] text-center">
                <div className="text-[10px] text-[#8d939e] font-bold uppercase">+/- Diff</div>
                <div
                  className={`text-base font-black mt-0.5 ${
                    diff > 0
                      ? "text-emerald-400"
                      : diff < 0
                      ? "text-rose-400"
                      : "text-zinc-400"
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </div>
              </div>

              <div className="bg-[#141518] p-2.5 rounded-lg border border-[#282a32] text-center">
                <div className="text-[10px] text-[#8d939e] font-bold uppercase">K/D</div>
                <div className="text-base font-black text-[#FF5500] mt-0.5">
                  {kdRatio}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2.5">
            {!isEnrolled ? (
              <button
                type="button"
                onClick={handleJoinTournament}
                disabled={isJoining || joinSuccess}
                className="w-full py-2.5 px-4 bg-[#FF5500] hover:bg-[#ff6b1a] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-md shadow-[#FF5500]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {joinSuccess ? (
                  <>
                    <CheckCircle size={15} />
                    <span>¡Inscripto con Éxito!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={15} />
                    <span>Anotarme al Torneo como {playerName}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-2 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center justify-center gap-2 font-semibold">
                <CheckCircle size={15} />
                <span>Estás participando en este torneo</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                closeProfileModal();
                if (onTabChange) onTabChange("leaderboard");
              }}
              className="w-full py-2.5 px-4 bg-[#1a1b1f] hover:bg-[#282a32] text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-[#282a32] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy size={15} className="text-[#FF5500]" />
              <span>Ver mi posición en el Leaderboard</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider rounded-lg border border-red-500/30 transition flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <LogOut size={15} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
