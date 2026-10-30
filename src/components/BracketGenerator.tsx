"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  UserPlus,
  Trash2,
  Trophy,
  RefreshCw,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Users,
  Shuffle,
  Edit3,
  ArrowLeft,
  Swords,
  X,
} from "lucide-react";
import type { TournamentState, Match } from "@/lib/types";
import {
  INITIAL_STATE,
  generateBracket,
  selectWinner,
  undoMatch,
  setMatchMap,
  setMatchScoreAndWinner,
} from "@/lib/types";
import BracketTree from "./BracketTree";
import ChampionCelebration from "./ChampionCelebration";
import MatchDetailModal from "./MatchDetailModal";
import MapVeto from "./MapVeto";
import { useAuth } from "@/context/AuthContext";

export default function BracketGenerator() {
  const { user, token } = useAuth();
  const [state, setState] = useState<TournamentState>(INITIAL_STATE);
  const [backupState, setBackupState] = useState<TournamentState | null>(null);
  const [isEditingPlayers, setIsEditingPlayers] = useState(false);
  const [newPlayer, setNewPlayer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Match detail and Veto modals
  const [activeDetailMatch, setActiveDetailMatch] = useState<Match | null>(null);
  const [activeVetoMatch, setActiveVetoMatch] = useState<Match | null>(null);

  // Fetch state scoped to the logged-in user
  const fetchState = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/tournament", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Inicia sesión para sincronizar los datos de tu torneo.");
        }
        return;
      }

      const data: TournamentState = await res.json();
      if (data && data.generated) {
        setState(data);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `cs16-tournament-bracket-${user?.id || "guest"}`,
              JSON.stringify(data)
            );
          } catch (e) {}
        }
      } else {
        // Respaldo resiliente: si el servidor se reinició, recuperar del almacenamiento local
        let localRestored = false;
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem(
              `cs16-tournament-bracket-${user?.id || "guest"}`
            );
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.generated) {
                setState(parsed);
                localRestored = true;
                // Re-sincronizar con el servidor
                saveState(parsed);
              }
            }
          } catch (e) {}
        }
        if (!localRestored) setState(data || INITIAL_STATE);
      }
      setError(null);
    } catch (err) {
      console.warn("Fetch fallback:", err);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  // Save state scoped to the logged-in user
  const saveState = useCallback(
    async (newState: TournamentState) => {
      setState(newState);

      // Respaldo local instantáneo e indestructible
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `cs16-tournament-bracket-${user?.id || "guest"}`,
            JSON.stringify(newState)
          );
        } catch (e) {}
      }

      if (!token) return;

      setSaving(true);
      try {
        let currentToken = token;
        let res = await fetch("/api/tournament", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify(newState),
        });

        // Si el token expiró o se desincronizó, intentar auto-recuperar silenciosamente
        if (res.status === 401 && user) {
          try {
            const recRes = await fetch("/api/auth/recover", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user }),
            });
            if (recRes.ok) {
              const recData = await recRes.json();
              if (recData.token) {
                currentToken = recData.token;
                localStorage.setItem("cs16_auth_token", recData.token);
                res = await fetch("/api/tournament", {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentToken}`,
                  },
                  body: JSON.stringify(newState),
                });
              }
            }
          } catch (recoverErr) {
            console.warn("Silent recovery failed:", recoverErr);
          }
        }

        if (!res.ok) {
          throw new Error("Error al guardar");
        }
        setError(null);
      } catch (err) {
        console.warn("Save fallback:", err);
        setError("Cambios guardados solo localmente.");
      } finally {
        setSaving(false);
      }
    },
    [token, user]
  );

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const addPlayer = () => {
    const name = newPlayer.trim();
    if (!name) return;
    if (state.participants.includes(name)) {
      setError("Ese jugador ya fue añadido al torneo.");
      return;
    }
    const newState = {
      ...state,
      participants: [...state.participants, name],
    };
    setNewPlayer("");
    setError(null);
    inputRef.current?.focus();
    if (isEditingPlayers) {
      setState(newState);
    } else {
      saveState(newState);
    }
  };

  const removePlayer = (name: string) => {
    const newState = {
      ...state,
      participants: state.participants.filter((p) => p !== name),
    };
    if (isEditingPlayers) {
      setState(newState);
    } else {
      saveState(newState);
    }
  };

  const shufflePlayers = () => {
    const shuffled = [...state.participants].sort(() => Math.random() - 0.5);
    const newState = {
      ...state,
      participants: shuffled,
    };
    if (isEditingPlayers) {
      setState(newState);
    } else {
      saveState(newState);
    }
  };

  const handleGenerate = () => {
    if (state.participants.length < 2) {
      setError("Se necesitan al menos 2 jugadores para armar el bracket.");
      return;
    }
    const newState = generateBracket(state.participants, state.leaderboard);
    saveState(newState);
    setIsEditingPlayers(false);
    setBackupState(null);
  };

  const handleSelectWinner = (matchId: string, winner: string) => {
    const newState = selectWinner(state, matchId, winner);
    saveState(newState);
  };

  const handleUndoMatch = (matchId: string) => {
    const newState = undoMatch(state, matchId);
    saveState(newState);
  };

  const handleOpenVeto = (match: Match) => {
    setActiveDetailMatch(null);
    setActiveVetoMatch(match);
  };

  const handleOpenDetail = (match: Match) => {
    // Keep updated match reference from current state
    const current = state.matches.find((m) => m.id === match.id) || match;
    setActiveDetailMatch(current);
  };

  const handleMapSelected = (mapName: string) => {
    if (!activeVetoMatch) return;
    const newState = setMatchMap(state, activeVetoMatch.id, mapName);
    saveState(newState);
    setActiveVetoMatch(null);
  };

  const handleSaveScore = (
    matchId: string,
    p1Kills: number,
    p2Kills: number,
    winner?: string
  ) => {
    const newState = setMatchScoreAndWinner(
      state,
      matchId,
      p1Kills,
      p2Kills,
      winner
    );
    saveState(newState);
    setActiveDetailMatch(null);
  };

  const handleEditBracket = () => {
    setBackupState(state);
    setIsEditingPlayers(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    if (backupState) {
      setState(backupState);
    }
    setIsEditingPlayers(false);
    setBackupState(null);
    setError(null);
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const handleConfirmReset = () => {
    setIsEditingPlayers(false);
    setBackupState(null);
    saveState(INITIAL_STATE);
    setShowResetModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5500]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#282a32] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#FF5500] rounded-sm"></div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              Cuadro del Torneo
            </h2>
            <p className="text-xs text-[#8d939e] uppercase tracking-wide">
              Eliminación Directa 1v1 LAN
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#282a32] text-[11px] text-[#8d939e] transition-opacity duration-150 ${
              saving ? "opacity-100" : "opacity-0 pointer-events-none select-none"
            }`}
          >
            <Loader2 className="w-3 h-3 animate-spin text-[#FF5500]" />
            <span>Guardando...</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {state.generated && !isEditingPlayers && (
            <button
              onClick={handleEditBracket}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#24262e] border border-[#282a32] hover:border-[#FF5500] rounded transition-colors cursor-pointer"
            >
              <Edit3 size={13} className="text-[#FF5500]" />
              Modificar Jugadores
            </button>
          )}
          {isEditingPlayers && (
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] rounded transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} className="text-[#FF5500]" />
              Cancelar Edición
            </button>
          )}
          <button
            onClick={fetchState}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#8d939e] hover:text-white bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] rounded transition-colors cursor-pointer"
          >
            <RefreshCw size={13} />
            Sincronizar
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 bg-red-950/20 border border-red-500/30 rounded hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            Reiniciar Todo
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1b1f] border border-[#FF5500]/50 rounded-lg text-white text-xs shadow-md">
          <AlertTriangle size={15} className="text-[#FF5500] shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-[#8d939e] hover:text-white font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Champion Celebration Overlay (Full-screen celebration with FaceIT orange aura & gradual fade) */}
      {state.champion && !isEditingPlayers && (
        <ChampionCelebration champion={state.champion} />
      )}

      {/* Champion Banner FaceIT Style */}
      {state.champion && !isEditingPlayers && (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1a1b1f] via-[#22242a] to-[#1a1b1f] border-2 border-[#FF5500] rounded-xl p-8 text-center shadow-faceit-orange animate-fade-in-up">
          <div className="shimmer absolute inset-0 pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-[#FF5500]/20 border border-[#FF5500]/50 flex items-center justify-center mx-auto mb-3 text-[#FF5500]">
            <Trophy className="w-8 h-8" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] font-extrabold text-[#FF5500] mb-1">
            CAMPEÓN DEL TORNEO
          </p>
          <p className="text-4xl font-black text-white tracking-wider uppercase">
            {state.champion}
          </p>
        </div>
      )}

      {/* Player Management (Before generation or while editing) */}
      {(!state.generated || isEditingPlayers) && (
        <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-6 space-y-5 shadow-xl">
          {/* Warning banner when in edit mode */}
          {isEditingPlayers && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-950/20 border border-amber-500/40 rounded-lg text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <span>
                  <strong>Modo edición activo:</strong> Puedes modificar la lista de jugadores. Si confirmas con <strong>"Regenerar Bracket"</strong> se reiniciará el cuadro. Si te arrepientes, pulsa <strong>"Cancelar"</strong> para volver al bracket actual sin perder nada.
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 bg-[#141518] hover:bg-[#22242a] text-white border border-[#282a32] hover:border-[#FF5500] rounded text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 self-end sm:self-auto"
              >
                <ArrowLeft size={13} />
                Cancelar y Volver
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-[#282a32] pb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
              <Users size={16} className="text-[#FF5500]" />
              {isEditingPlayers ? "Modificar Jugadores del Torneo" : "Inscripción de Jugadores"}
            </h3>
            <div className="flex items-center gap-2">
              {state.participants.length >= 2 && (
                <button
                  type="button"
                  onClick={shufflePlayers}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-[#8d939e] hover:text-white bg-[#141518] border border-[#282a32] rounded hover:border-[#FF5500] transition-colors cursor-pointer"
                >
                  <Shuffle size={12} className="text-[#FF5500]" />
                  Mezclar Orden
                </button>
              )}
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#282a32] text-[#8d939e]">
                {state.participants.length} Registrados
              </span>
            </div>
          </div>

          {/* Add Player Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                placeholder="Ingresar nick del jugador..."
                className="flex-1 min-w-0 bg-[#141518] border border-[#282a32] focus:border-[#FF5500] rounded-lg px-4 py-2.5 text-base font-semibold text-white placeholder:text-[#474c57] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={addPlayer}
                className="w-28 shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF5500] hover:bg-[#ff6b1a] text-white text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#FF5500]/20 cursor-pointer"
              >
                <UserPlus size={14} />
                <span>Añadir</span>
              </button>
            </div>

            {/* Quick action to add own logged-in user without resizing the input */}
            {user &&
              !state.participants.some(
                (p) =>
                  p.toLowerCase() ===
                  (user.displayName || user.username).toLowerCase()
              ) && (
                <div className="flex items-center justify-between text-xs bg-[#141518]/90 border border-[#282a32] rounded-lg px-3.5 py-2 text-[#8d939e]">
                  <span>¿Participarás con tu cuenta activa?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const name = user.displayName || user.username;
                      const updated = [...state.participants, name];
                      const updatedLeaderboard = {
                        ...(state.leaderboard || {}),
                        [name]: state.leaderboard?.[name] || {
                          kills: 0,
                          deaths: 0,
                        },
                      };
                      const newState = {
                        ...state,
                        participants: updated,
                        leaderboard: updatedLeaderboard,
                      };
                      if (isEditingPlayers) setState(newState);
                      else saveState(newState);
                    }}
                    className="text-[#FF5500] hover:text-[#ff6b1a] font-bold uppercase text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <UserPlus size={13} />
                    <span>Anotarme ({user.displayName || user.username})</span>
                  </button>
                </div>
              )}
          </div>

          {/* Player List with stable container */}
          <div className="min-h-[58px] rounded-lg border border-[#282a32]/60 bg-[#141518]/30 p-2.5">
            {state.participants.length === 0 ? (
              <div className="h-10 flex items-center justify-center text-xs text-[#8d939e]/60 font-semibold">
                No hay jugadores inscriptos aún. Escribe un nick arriba para comenzar.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {state.participants.map((player, i) => (
                  <div
                    key={player}
                    className="flex items-center justify-between bg-[#141518] border border-[#282a32] hover:border-[#383b46] rounded-lg px-3.5 py-2.5 group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] text-[#FF5500] font-mono font-bold w-5 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-bold text-white truncate">
                        {player}
                      </span>
                    </div>
                    <button
                      onClick={() => removePlayer(player)}
                      title="Eliminar jugador"
                      className="text-[#8d939e] hover:text-red-400 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer shrink-0 ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons - Stable height without jumping */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {isEditingPlayers && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="sm:w-1/3 py-3.5 bg-[#141518] hover:bg-[#22242a] border border-[#282a32] hover:border-[#FF5500] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Cancelar</span>
              </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={state.participants.length < 2}
              className={`py-3.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isEditingPlayers ? "flex-1" : "w-full"
              } ${
                state.participants.length >= 2
                  ? "bg-gradient-to-r from-[#FF5500] to-[#E04B00] hover:from-[#ff6b1a] hover:to-[#FF5500] text-white shadow-xl shadow-[#FF5500]/25 cursor-pointer"
                  : "bg-[#141518] border border-[#282a32] text-[#8d939e]/50 cursor-not-allowed opacity-60"
              }`}
            >
              <Swords size={15} />
              <span>
                {state.participants.length >= 2
                  ? isEditingPlayers
                    ? `Regenerar Bracket Oficial (${state.participants.length} Jugadores)`
                    : `Generar Bracket Oficial (${state.participants.length} Jugadores)`
                  : "Se requieren al menos 2 jugadores para generar el bracket"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Bracket Tree */}
      {state.generated && !isEditingPlayers && (
        <BracketTree
          state={state}
          onSelectWinner={handleSelectWinner}
          onUndoMatch={handleUndoMatch}
          onOpenMatchDetail={handleOpenDetail}
          onOpenVeto={handleOpenVeto}
        />
      )}

      {/* Match Detail & Score Entry Modal */}
      {activeDetailMatch && (
        <MatchDetailModal
          match={state.matches.find((m) => m.id === activeDetailMatch.id) || activeDetailMatch}
          onClose={() => setActiveDetailMatch(null)}
          onOpenVeto={handleOpenVeto}
          onSaveScore={handleSaveScore}
          onUndoMatch={handleUndoMatch}
        />
      )}

      {/* In-context Map Veto Modal */}
      {activeVetoMatch && activeVetoMatch.player1 && activeVetoMatch.player2 && (
        <MapVeto
          player1={activeVetoMatch.player1}
          player2={activeVetoMatch.player2}
          onMapSelected={handleMapSelected}
          onClose={() => setActiveVetoMatch(null)}
        />
      )}

      {/* Modal personalizado para reiniciar el torneo con estilo FaceIT */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in-up"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="bg-[#141518] border-2 border-red-500/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-red-950/50 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-xl font-black uppercase text-white tracking-wider mb-2">
              ¿Reiniciar Torneo Completo?
            </h3>

            <p className="text-xs text-[#8d939e] leading-relaxed mb-6">
              Se eliminarán todos los jugadores inscriptos, los cruces de la bracket, los resultados cargados y los mapas vetados. Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3 bg-[#1a1b1f] hover:bg-[#22242a] text-[#8d939e] hover:text-white border border-[#282a32] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                Sí, Reiniciar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
