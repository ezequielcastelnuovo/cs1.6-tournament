"use client";

import React, { useState } from "react";
import {
  X,
  Map,
  Trophy,
  Swords,
  CheckCircle2,
  RotateCcw,
  Skull,
  Crosshair,
  Flame,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { Match } from "@/lib/types";
import { CS_MAPS } from "@/lib/types";

interface MatchDetailModalProps {
  match: Match | null;
  onClose: () => void;
  onOpenVeto: (match: Match) => void;
  onSaveScore: (matchId: string, p1Kills: number, p2Kills: number, winner?: string) => void;
  onUndoMatch: (matchId: string) => void;
}

export default function MatchDetailModal({
  match,
  onClose,
  onOpenVeto,
  onSaveScore,
  onUndoMatch,
}: MatchDetailModalProps) {
  if (!match) return null;

  const player1 = match.player1 || "Por definir";
  const player2 = match.player2 || "Por definir";
  const hasBothPlayers = match.player1 !== null && match.player2 !== null;

  // Initial score state from match or defaults
  const [p1Kills, setP1Kills] = useState<number>(
    match.score?.player1Kills ?? (match.winner === match.player1 ? 16 : 0)
  );
  const [p2Kills, setP2Kills] = useState<number>(
    match.score?.player2Kills ?? (match.winner === match.player2 ? 16 : 0)
  );
  const [selectedWinner, setSelectedWinner] = useState<string | null>(
    match.winner || null
  );

  const selectedMapData = match.selectedMap
    ? CS_MAPS.find((m) => m.name === match.selectedMap)
    : null;

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBothPlayers) return;

    let winner = selectedWinner;
    if (!winner) {
      if (p1Kills > p2Kills) winner = match.player1;
      else if (p2Kills > p1Kills) winner = match.player2;
      else winner = match.player1; // Tiebreaker default
    }

    onSaveScore(match.id, p1Kills, p2Kills, winner || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#141518] border border-[#282a32] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF5500] via-[#ff7a33] to-[#FF5500]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[#8d939e] hover:text-white bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X size={16} />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Title */}
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#FF5500] rounded-sm"></span>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#8d939e]">
              Ronda {match.round + 1} · Enfrentamiento 1v1
            </span>
          </div>

          {/* Players Matchup Hero Banner */}
          <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-5">
            <div className="grid grid-cols-11 items-center gap-2 text-center">
              {/* Player 1 */}
              <div className="col-span-5 flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-md border ${
                    match.winner === match.player1 && match.winner !== null
                      ? "bg-[#FF5500] text-white border-[#FF5500] ring-2 ring-[#FF5500]/50"
                      : "bg-[#141518] text-white border-[#282a32]"
                  }`}
                >
                  {player1.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm sm:text-base font-black text-white mt-2 truncate max-w-full">
                  {player1}
                </span>
                {match.winner === match.player1 && (
                  <span className="mt-1 px-2 py-0.5 rounded text-[9px] font-black bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40 uppercase tracking-wider">
                    Ganador
                  </span>
                )}
              </div>

              {/* VS Divider */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <span className="text-xs font-black text-[#FF5500] bg-[#141518] px-2 py-1 rounded-full border border-[#282a32]">
                  VS
                </span>
              </div>

              {/* Player 2 */}
              <div className="col-span-5 flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-md border ${
                    match.winner === match.player2 && match.winner !== null
                      ? "bg-[#FF5500] text-white border-[#FF5500] ring-2 ring-[#FF5500]/50"
                      : "bg-[#141518] text-white border-[#282a32]"
                  }`}
                >
                  {player2.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm sm:text-base font-black text-white mt-2 truncate max-w-full">
                  {player2}
                </span>
                {match.winner === match.player2 && (
                  <span className="mt-1 px-2 py-0.5 rounded text-[9px] font-black bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40 uppercase tracking-wider">
                    Ganador
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Map Veto Status / Action */}
          <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
                  <Map size={20} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#8d939e] block">
                    Mapa de Juego
                  </span>
                  {match.selectedMap ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-black text-white tracking-wider uppercase">
                        {match.selectedMap}
                      </span>
                      {selectedMapData?.mode && (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-[#282a32] text-amber-400 border border-amber-500/20">
                          {selectedMapData.mode}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 italic">
                      Pendiente de veto
                    </span>
                  )}
                </div>
              </div>

              {hasBothPlayers && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVeto(match);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    match.selectedMap
                      ? "bg-[#141518] hover:bg-[#22242a] text-[#8d939e] hover:text-white border border-[#282a32]"
                      : "bg-[#FF5500] hover:bg-[#ff6b1a] text-white shadow-lg shadow-[#FF5500]/30 animate-pulse"
                  }`}
                >
                  <Map size={13} />
                  <span>{match.selectedMap ? "Re-vetar Mapa" : "Iniciar Veto"}</span>
                </button>
              )}
            </div>

            {/* Map image preview if selected */}
            {selectedMapData?.image && (
              <div className="mt-3 relative h-24 rounded-lg overflow-hidden border border-[#282a32]">
                <img
                  src={selectedMapData.image}
                  alt={selectedMapData.name}
                  className="w-full h-full object-cover filter brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-xs font-black text-white tracking-wider uppercase">
                    {selectedMapData.label} · {selectedMapData.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Score & Winner Input Section */}
          {hasBothPlayers && (
            <form onSubmit={handleScoreSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#282a32] pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Crosshair size={14} className="text-[#FF5500]" />
                  Cargar Score del Partido (Kills)
                </span>
                <span className="text-[10px] text-[#8d939e]">
                  Se actualizará el Leaderboard automáticamente
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Player 1 Score */}
                <div className="bg-[#141518] border border-[#282a32] focus-within:border-[#FF5500] rounded-xl p-3.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8d939e] block mb-1 truncate">
                    Kills de {player1}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={p1Kills}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setP1Kills(val);
                      if (val > p2Kills) setSelectedWinner(match.player1);
                      else if (p2Kills > val) setSelectedWinner(match.player2);
                    }}
                    className="w-full bg-transparent text-2xl font-black text-white focus:outline-none"
                    placeholder="0"
                  />
                  <div className="text-[10px] text-[#8d939e] mt-1">
                    Muertes: <strong className="text-slate-300">{p2Kills}</strong>
                  </div>
                </div>

                {/* Player 2 Score */}
                <div className="bg-[#141518] border border-[#282a32] focus-within:border-[#FF5500] rounded-xl p-3.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8d939e] block mb-1 truncate">
                    Kills de {player2}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={p2Kills}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setP2Kills(val);
                      if (p1Kills > val) setSelectedWinner(match.player1);
                      else if (val > p1Kills) setSelectedWinner(match.player2);
                    }}
                    className="w-full bg-transparent text-2xl font-black text-white focus:outline-none"
                    placeholder="0"
                  />
                  <div className="text-[10px] text-[#8d939e] mt-1">
                    Muertes: <strong className="text-slate-300">{p1Kills}</strong>
                  </div>
                </div>
              </div>

              {/* Winner Selector Indicator */}
              <div className="flex items-center justify-between bg-[#141518] border border-[#282a32] p-3 rounded-xl text-xs">
                <span className="text-[#8d939e] font-semibold">Ganador asignado:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWinner(match.player1)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedWinner === match.player1
                        ? "bg-[#FF5500] text-white shadow-sm"
                        : "bg-[#1a1b1f] text-[#8d939e] hover:text-white"
                    }`}
                  >
                    {player1}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWinner(match.player2)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedWinner === match.player2
                        ? "bg-[#FF5500] text-white shadow-sm"
                        : "bg-[#1a1b1f] text-[#8d939e] hover:text-white"
                    }`}
                  >
                    {player2}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#FF5500] to-[#E04B00] hover:from-[#ff6b1a] hover:to-[#FF5500] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#FF5500]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trophy size={15} />
                  <span>Guardar Score y Avanzar Ganador</span>
                </button>

                {match.winner && (
                  <button
                    type="button"
                    onClick={() => {
                      onUndoMatch(match.id);
                      onClose();
                    }}
                    className="px-4 py-3.5 bg-[#1a1b1f] hover:bg-[#22242a] text-[#8d939e] hover:text-white border border-[#282a32] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Deshacer resultado"
                  >
                    <RotateCcw size={14} />
                    <span>Deshacer</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
