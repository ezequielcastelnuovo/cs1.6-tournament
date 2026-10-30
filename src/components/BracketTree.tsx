"use client";

import { useMemo } from "react";
import { RotateCcw, Trophy, Map, Crosshair } from "lucide-react";
import type { TournamentState, Match } from "@/lib/types";

interface BracketTreeProps {
  state: TournamentState;
  onSelectWinner: (matchId: string, winner: string) => void;
  onUndoMatch: (matchId: string) => void;
  onOpenMatchDetail?: (match: Match) => void;
  onOpenVeto?: (match: Match) => void;
}

function getRoundLabel(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - 1 - round;
  if (fromFinal === 0) return "GRAN FINAL";
  if (fromFinal === 1) return "SEMIFINAL";
  if (fromFinal === 2) return "CUARTOS DE FINAL";
  if (round === 0) return "RONDA 1";
  return `RONDA ${round + 1}`;
}

const CARD_WIDTH = 250;
const CARD_HEIGHT = 90;
const COL_GAP = 70;
const BASE_GAP = 28;
const PADDING_TOP = 64;
const PADDING_LEFT = 24;

export default function BracketTree({
  state,
  onSelectWinner,
  onUndoMatch,
  onOpenMatchDetail,
  onOpenVeto,
}: BracketTreeProps) {
  // 1. Calculate positions for every match so children are centered at parent midpoints
  const { positions, totalWidth, totalHeight } = useMemo(() => {
    const pos: Record<string, number> = {};

    // Round 0 baseline positions
    const r0Matches = state.matches.filter((m) => m.round === 0);
    r0Matches.forEach((m, idx) => {
      pos[m.id] = idx * (CARD_HEIGHT + BASE_GAP);
    });

    // Subsequent rounds centered at midpoint of feeder matches
    for (let r = 1; r < state.rounds; r++) {
      const roundMatches = state.matches.filter((m) => m.round === r);
      roundMatches.forEach((m) => {
        const feeders = state.matches.filter((prev) => prev.nextMatchId === m.id);
        if (
          feeders.length === 2 &&
          pos[feeders[0].id] !== undefined &&
          pos[feeders[1].id] !== undefined
        ) {
          pos[m.id] = (pos[feeders[0].id] + pos[feeders[1].id]) / 2;
        } else if (feeders.length === 1 && pos[feeders[0].id] !== undefined) {
          pos[m.id] = pos[feeders[0].id];
        } else {
          pos[m.id] = m.position * (CARD_HEIGHT + BASE_GAP);
        }
      });
    }

    const maxY = Math.max(...Object.values(pos), 200);
    const height = maxY + CARD_HEIGHT + PADDING_TOP + 40;
    const width =
      state.rounds * CARD_WIDTH +
      (state.rounds - 1) * COL_GAP +
      PADDING_LEFT * 2;

    return { positions: pos, totalWidth: width, totalHeight: height };
  }, [state.matches, state.rounds]);

  // 2. Generate SVG connector lines (Image 2 style)
  const connectorLines = useMemo(() => {
    const lines: {
      id: string;
      d: string;
      won: boolean;
    }[] = [];

    state.matches.forEach((m) => {
      if (!m.nextMatchId) return;

      const targetMatch = state.matches.find((t) => t.id === m.nextMatchId);
      if (!targetMatch) return;

      const ySrc = PADDING_TOP + (positions[m.id] ?? 0) + CARD_HEIGHT / 2;
      const xSrc = PADDING_LEFT + m.round * (CARD_WIDTH + COL_GAP) + CARD_WIDTH;

      const yTgt =
        PADDING_TOP + (positions[targetMatch.id] ?? 0) + CARD_HEIGHT / 2;
      const xTgt =
        PADDING_LEFT + targetMatch.round * (CARD_WIDTH + COL_GAP);

      const xMid = (xSrc + xTgt) / 2;

      // Path: Out of source right -> turn at mid -> to target Y -> into target left
      const pathD = `M ${xSrc} ${ySrc} H ${xMid} V ${yTgt} H ${xTgt}`;

      lines.push({
        id: `${m.id}->${targetMatch.id}`,
        d: pathD,
        won: m.winner !== null || m.isBye === true,
      });
    });

    return lines;
  }, [state.matches, positions]);

  return (
    <div className="bg-[#1a1b1f] border border-[#282a32] rounded-2xl p-3 sm:p-6 lg:p-8 shadow-2xl">
      {/* Scroll hint on smaller screens */}
      <div className="lg:hidden flex items-center justify-between pb-3 px-1 text-[10px] text-[#8d939e] uppercase font-bold tracking-wider border-b border-[#282a32]/60 mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]"></span>
          Árbol del Torneo
        </span>
        <span className="text-[#FF5500] font-black">
          Desliza horizontalmente →
        </span>
      </div>

      <div className="overflow-x-auto overscroll-x-contain pb-2">
        <div
          className="relative"
          style={{
            width: `${totalWidth}px`,
            height: `${totalHeight}px`,
            minHeight: "450px",
          }}
        >
        {/* Round Header Labels */}
        {Array.from({ length: state.rounds }).map((_, r) => {
          const x = PADDING_LEFT + r * (CARD_WIDTH + COL_GAP);
          return (
            <div
              key={`header-${r}`}
              className="absolute text-center"
              style={{
                left: `${x}px`,
                width: `${CARD_WIDTH}px`,
                top: "10px",
              }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-[#141518] border border-[#282a32] rounded-lg shadow-sm">
                <span className="w-2 h-2 bg-[#FF5500] rounded-sm"></span>
                {getRoundLabel(r, state.rounds)}
              </div>
            </div>
          );
        })}

        {/* SVG Connector Lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={totalHeight}
        >
          {connectorLines.map((line) => (
            <path
              key={line.id}
              d={line.d}
              fill="none"
              stroke={line.won ? "#FF5500" : "#383c4a"}
              strokeWidth={line.won ? "2.5" : "2"}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />
          ))}
        </svg>

        {/* Match Cards */}
        {state.matches.map((match) => {
          const x = PADDING_LEFT + match.round * (CARD_WIDTH + COL_GAP);
          const y = PADDING_TOP + (positions[match.id] ?? 0);

          const isFinal = match.round === state.rounds - 1;
          const isDecided = match.winner !== null;
          const canClick =
            match.player1 !== null && match.player2 !== null && !match.winner && !match.isBye;

          return (
            <div
              key={match.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${CARD_WIDTH}px`,
                height: `${CARD_HEIGHT}px`,
              }}
            >
              <div
                className={`w-full h-full rounded-xl overflow-hidden border flex flex-col justify-between shadow-lg transition-all duration-200 ${
                  match.isBye
                    ? "border-[#FF5500]/50 bg-[#1a1b1f] shadow-faceit-orange"
                    : isFinal && isDecided
                    ? "border-[#FF5500] shadow-faceit-orange ring-1 ring-[#FF5500]/50 bg-[#1a1b1f]"
                    : isDecided
                    ? "border-[#282a32] bg-[#1a1b1f]"
                    : canClick
                    ? "border-[#FF5500]/80 bg-[#1a1b1f] hover:border-[#FF5500] hover:shadow-faceit-orange"
                    : "border-[#282a32] bg-[#141518]"
                }`}
              >
                {/* Header status & Map tag */}
                {match.isBye ? (
                  <div className="bg-[#242630] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#FF5500] flex items-center justify-between border-b border-[#282a32]">
                    <span>PASE DIRECTO</span>
                    <span className="text-[#FF5500] font-extrabold text-[9px] bg-[#FF5500]/15 px-1.5 py-0.5 rounded border border-[#FF5500]/30">
                      BYE
                    </span>
                  </div>
                ) : (
                  <div className="bg-[#20222a] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider flex items-center justify-between border-b border-[#282a32]">
                    <div className="flex items-center gap-1.5 truncate">
                      {isDecided ? (
                        <>
                          <span className="text-[#8d939e]">Finalizado</span>
                          {match.score && (
                            <span className="text-white font-mono font-bold">
                              {match.score.player1Kills}-{match.score.player2Kills}
                            </span>
                          )}
                        </>
                      ) : canClick ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse"></span>
                          <span className="text-[#FF5500]">Duelo Activo</span>
                        </>
                      ) : (
                        <span className="text-[#525763]">En Espera</span>
                      )}
                    </div>

                    {/* Map badge or Veto button */}
                    <div className="flex items-center gap-1 shrink-0">
                      {match.selectedMap ? (
                        <button
                          type="button"
                          onClick={() => onOpenMatchDetail?.(match)}
                          className="flex items-center gap-1 text-[9px] font-extrabold uppercase text-[#FF5500] bg-[#FF5500]/15 hover:bg-[#FF5500]/25 px-1.5 py-0.5 rounded border border-[#FF5500]/30 transition-all cursor-pointer"
                          title="Ver detalle del partido"
                        >
                          <Map size={9} />
                          <span className="max-w-[70px] truncate">{match.selectedMap}</span>
                        </button>
                      ) : match.player1 && match.player2 ? (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenVeto ? onOpenVeto(match) : onOpenMatchDetail?.(match)
                          }
                          className="flex items-center gap-1 text-[8.5px] font-black uppercase text-white bg-[#FF5500] hover:bg-[#ff6b1a] px-1.5 py-0.5 rounded transition-all cursor-pointer shadow-sm animate-pulse"
                          title="Realizar veto de mapa"
                        >
                          <Map size={9} />
                          <span>Vetar</span>
                        </button>
                      ) : null}

                      {/* Detail / Score trigger */}
                      {match.player1 && match.player2 && (
                        <button
                          type="button"
                          onClick={() => onOpenMatchDetail?.(match)}
                          className="p-0.5 text-[#8d939e] hover:text-white transition-colors cursor-pointer"
                          title="Cargar score / Info del duelo"
                        >
                          <Crosshair size={11} />
                        </button>
                      )}

                      {/* Undo trigger if decided */}
                      {isDecided && (
                        <button
                          type="button"
                          onClick={() => onUndoMatch(match.id)}
                          className="text-[#8d939e] hover:text-[#FF5500] transition-colors cursor-pointer ml-0.5"
                          title="Deshacer resultado"
                        >
                          <RotateCcw size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Player Slots */}
                {match.isBye ? (
                  <div className="flex-1 flex flex-col justify-center px-3.5 py-2 bg-[#FF5500]/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-black bg-[#FF5500] text-white">
                          ✓
                        </span>
                        <span className="text-xs font-black text-white truncate">
                          {match.player1}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-[#FF5500] uppercase tracking-wider">
                        Avanza
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8d939e] mt-1 italic">
                      Avanza por falta de rival
                    </span>
                  </div>
                ) : (
                  <div className="divide-y divide-[#282a32]/80 flex-1 flex flex-col justify-center">
                    {[match.player1, match.player2].map((player, idx) => {
                      if (!player) {
                        return (
                          <div
                            key={idx}
                            className="px-3 py-1.5 bg-[#121316]/70 text-[11px] text-[#525763] italic flex items-center gap-2"
                          >
                            <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold bg-[#1e2026] text-[#424652]">
                              {idx + 1}
                            </span>
                            <span className="truncate">Por definir</span>
                          </div>
                        );
                      }

                      const isWinner = match.winner === player;
                      const isLoser = match.winner && match.winner !== player;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!canClick && !match.winner}
                          onClick={() => {
                            if (onOpenMatchDetail && (canClick || match.winner)) {
                              onOpenMatchDetail(match);
                            } else if (canClick) {
                              onSelectWinner(match.id, player);
                            }
                          }}
                          className={`w-full px-2.5 py-1.5 text-left text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                            isWinner
                              ? "bg-[#FF5500]/15 text-white"
                              : isLoser
                              ? "bg-[#141518] text-[#525763] line-through"
                              : canClick
                              ? "bg-[#1a1b1f] hover:bg-[#22242a] text-white hover:text-[#FF5500] cursor-pointer"
                              : "bg-[#1a1b1f] text-[#8d939e]"
                          }`}
                          title={
                            canClick
                              ? "Cargar score y definir ganador"
                              : match.winner
                              ? "Ver resultado del duelo"
                              : undefined
                          }
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black shrink-0 ${
                                isWinner
                                  ? "bg-[#FF5500] text-white shadow-sm"
                                  : "bg-[#282a32] text-[#8d939e]"
                              }`}
                            >
                              {isWinner ? "W" : idx + 1}
                            </span>
                            <span className="truncate">{player}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {match.score && (
                              <span className="text-[10px] font-mono font-black text-amber-400 bg-[#121316] px-1.5 py-0.5 rounded border border-[#282a32]">
                                {idx === 0
                                  ? match.score.player1Kills
                                  : match.score.player2Kills}K
                              </span>
                            )}
                            {isWinner && isFinal && (
                              <Trophy size={13} className="text-[#FF5500] shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
