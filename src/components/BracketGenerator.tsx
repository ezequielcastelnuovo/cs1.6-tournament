"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import type { TournamentState } from "@/lib/types";
import {
  INITIAL_STATE,
  generateBracket,
  selectWinner,
  undoMatch,
} from "@/lib/types";
import BracketTree from "./BracketTree";
import ChampionCelebration from "./ChampionCelebration";
import { useAuth } from "@/context/AuthContext";

export default function BracketGenerator() {
  const { user, token } = useAuth();
  const [state, setState] = useState<TournamentState>(INITIAL_STATE);
  const [backupState, setBackupState] = useState<TournamentState | null>(null);
  const [isEditingPlayers, setIsEditingPlayers] = useState(false);
  const [newPlayer, setNewPlayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setState(data);
      setError(null);
    } catch (err) {
      console.warn("Fetch fallback:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Save state scoped to the logged-in user
  const saveState = useCallback(
    async (newState: TournamentState) => {
      setState(newState);
      if (!token) return;

      setSaving(true);
      try {
        const res = await fetch("/api/tournament", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newState),
        });

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
    [token]
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
    if (
      confirm("¿Reiniciar todo el torneo? Se perderán todos los datos y jugadores.")
    ) {
      setIsEditingPlayers(false);
      setBackupState(null);
      saveState(INITIAL_STATE);
    }
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
          {saving && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#282a32] text-[11px] text-[#8d939e]">
              <Loader2 className="w-3 h-3 animate-spin text-[#FF5500]" />
              Guardando...
            </div>
          )}
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
        <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-6 space-y-5 shadow-xl animate-fade-in-up">
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
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayer}
              onChange={(e) => setNewPlayer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              placeholder="Ingresar nick del jugador..."
              className="flex-1 bg-[#141518] border border-[#282a32] focus:border-[#FF5500] rounded-lg px-4 py-2.5 text-sm font-semibold text-white placeholder:text-[#474c57] focus:outline-none transition-colors"
            />
            <button
              onClick={addPlayer}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5500] hover:bg-[#ff6b1a] text-white text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#FF5500]/20 cursor-pointer"
            >
              <UserPlus size={14} />
              Añadir
            </button>
            {user &&
              !state.participants.some(
                (p) =>
                  p.toLowerCase() ===
                  (user.displayName || user.username).toLowerCase()
              ) && (
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
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-[#FF5500]/15 hover:bg-[#FF5500]/25 text-[#FF5500] border border-[#FF5500]/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Anotarme al torneo con mi cuenta activa"
                >
                  <UserPlus size={14} />
                  <span>Anotarme</span>
                </button>
              )}
          </div>

          {/* Player List */}
          {state.participants.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {state.participants.map((player, i) => (
                <div
                  key={player}
                  className="flex items-center justify-between bg-[#141518] border border-[#282a32] hover:border-[#383b46] rounded-lg px-3.5 py-2.5 group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-[#FF5500] font-mono font-bold w-5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-bold text-white truncate max-w-[140px]">
                      {player}
                    </span>
                  </div>
                  <button
                    onClick={() => removePlayer(player)}
                    title="Eliminar jugador"
                    className="text-[#8d939e] hover:text-red-400 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {isEditingPlayers && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="sm:w-1/3 py-3.5 bg-[#141518] hover:bg-[#22242a] border border-[#282a32] hover:border-[#FF5500] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} />
                Cancelar (Volver al Bracket)
              </button>
            )}

            {state.participants.length >= 2 ? (
              <button
                onClick={handleGenerate}
                className={`py-3.5 bg-gradient-to-r from-[#FF5500] to-[#E04B00] text-white font-black uppercase tracking-wider rounded-lg hover:from-[#ff6b1a] hover:to-[#FF5500] transition-all shadow-xl shadow-[#FF5500]/25 cursor-pointer ${
                  isEditingPlayers ? "flex-1" : "w-full"
                }`}
              >
                {isEditingPlayers
                  ? `Regenerar Bracket Oficial (${state.participants.length} Jugadores)`
                  : `Generar Bracket Oficial (${state.participants.length} Jugadores)`}
              </button>
            ) : (
              <p className="text-center text-xs text-[#8d939e] py-2 flex-1">
                Se requieren al menos 2 jugadores para generar el bracket.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bracket Tree */}
      {state.generated && !isEditingPlayers && (
        <BracketTree
          state={state}
          onSelectWinner={handleSelectWinner}
          onUndoMatch={handleUndoMatch}
        />
      )}
    </div>
  );
}
