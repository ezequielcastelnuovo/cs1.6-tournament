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

  // Initial score state from match: empty string when unplayed so it never starts with "0"
  const [p1Kills, setP1Kills] = useState<string>(() => {
    if (match.score?.player1Kills !== undefined && match.score.player1Kills !== null) {
      return String(match.score.player1Kills);
    }
    return "";
  });
  const [p2Kills, setP2Kills] = useState<string>(() => {
    if (match.score?.player2Kills !== undefined && match.score.player2Kills !== null) {
      return String(match.score.player2Kills);
    }
    return "";
  });
  const [selectedWinner, setSelectedWinner] = useState<string | null>(
    match.winner || null
  );

  const selectedMapData = match.selectedMap
    ? CS_MAPS.find((m) => m.name === match.selectedMap)
    : null;

  const handleP1Change = (raw: string) => {
    let clean = raw.replace(/\D/g, "");
    if (clean.length > 1 && clean.startsWith("0")) {
      clean = clean.replace(/^0+/, "") || "0";
    }
    setP1Kills(clean);
    const k1 = clean === "" ? 0 : parseInt(clean, 10);
    const k2 = p2Kills === "" ? 0 : parseInt(p2Kills, 10);
    if (clean !== "" && (p2Kills !== "" || k1 > k2)) {
      if (k1 > k2) setSelectedWinner(match.player1);
      else if (k2 > k1) setSelectedWinner(match.player2);
    }
  };

  const handleP2Change = (raw: string) => {
    let clean = raw.replace(/\D/g, "");
    if (clean.length > 1 && clean.startsWith("0")) {
      clean = clean.replace(/^0+/, "") || "0";
    }
    setP2Kills(clean);
    const k1 = p1Kills === "" ? 0 : parseInt(p1Kills, 10);
    const k2 = clean === "" ? 0 : parseInt(clean, 10);
    if (clean !== "" && (p1Kills !== "" || k2 > k1)) {
      if (k1 > k2) setSelectedWinner(match.player1);
      else if (k2 > k1) setSelectedWinner(match.player2);
    }
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBothPlayers) return;

    const num1 = p1Kills === "" ? 0 : parseInt(p1Kills, 10);
    const num2 = p2Kills === "" ? 0 : parseInt(p2Kills, 10);

    let winner = selectedWinner;
    if (!winner) {
      if (num1 > num2) winner = match.player1;
      else if (num2 > num1) winner = match.player2;
      else winner = match.player1; // Tiebreaker default
    }

    onSaveScore(match.id, num1, num2, winner || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#141518] border border-[#282a32] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF5500] via-[#ff7a33] to-[#FF5500] shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-[#8d939e] hover:text-white bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X size={16} />
        </button>

        <div className="p-4 sm:p-7 space-y-5 overflow-y-auto">
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
                <div className="bg-[#141518] border border-[#282a32] focus-within:border-[#FF5500] rounded-xl p-3 sm:p-3.5 transition-colors">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8d939e] block mb-1 truncate">
                    Kills de {player1}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={p1Kills}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleP1Change(e.target.value)}
                    className="w-full bg-transparent text-2xl sm:text-3xl font-black text-white placeholder:text-[#383b46] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    autoComplete="off"
                  />
                  <div className="text-[10px] text-[#8d939e] mt-1">
                    Muertes: <strong className="text-slate-300">{p2Kills !== "" ? p2Kills : "0"}</strong>
                  </div>
                </div>

                {/* Player 2 Score */}
                <div className="bg-[#141518] border border-[#282a32] focus-within:border-[#FF5500] rounded-xl p-3 sm:p-3.5 transition-colors">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8d939e] block mb-1 truncate">
                    Kills de {player2}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={p2Kills}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleP2Change(e.target.value)}
                    className="w-full bg-transparent text-2xl sm:text-3xl font-black text-white placeholder:text-[#383b46] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    autoComplete="off"
                  />
                  <div className="text-[10px] text-[#8d939e] mt-1">
                    Muertes: <strong className="text-slate-300">{p1Kills !== "" ? p1Kills : "0"}</strong>
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

