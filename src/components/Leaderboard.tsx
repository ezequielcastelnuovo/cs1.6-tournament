"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Trophy,
  Flame,
  Search,
  RefreshCw,
  Skull,
  Crosshair,
  TrendingUp,
  RotateCcw,
  UserPlus,
  Check,
  AlertCircle,
  Clock,
  Trash2,
} from "lucide-react";
import type { TournamentState } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

interface PlayerStats {
  name: string;
  kills: number;
  deaths: number;
}

type SortMode = "kills" | "kd" | "diff" | "name";

const LOCAL_STORAGE_KEY = "cs16-tournament-leaderboard";

export default function Leaderboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<Record<string, { kills: number; deaths: number }>>({});
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("kills");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(3);

  const storageKey = user ? `cs16-tournament-leaderboard:${user.id}` : LOCAL_STORAGE_KEY;

  // Cargar estado inicial del torneo y estadísticas
  const loadData = useCallback(async (isManualSync = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (isManualSync) setSyncing(true);
    else setLoading(true);

    try {
      // 1. Obtener estado del bracket desde el servidor con autenticación
      const res = await fetch("/api/tournament", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      let serverState: TournamentState | null = null;
      if (res.ok) {
        serverState = await res.json();
        setTournamentState(serverState);
      }

      // 2. Obtener respaldo de localStorage si existe
      let localStats: Record<string, { kills: number; deaths: number }> = {};
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) localStats = JSON.parse(raw);
        } catch (e) {
          console.warn("Error leyendo localStorage:", e);
        }
      }

      // 3. Fusionar datos: El leaderboard calculado del torneo es la fuente de verdad
      let mergedStats: Record<string, { kills: number; deaths: number }> = {};
      if (serverState?.leaderboard && Object.keys(serverState.leaderboard).length > 0) {
        mergedStats = { ...serverState.leaderboard };
      } else {
        mergedStats = { ...localStats };
      }

      // Asegurar que todos los participantes del bracket figuren en la tabla
      if (serverState?.participants && Array.isArray(serverState.participants)) {
        serverState.participants.forEach((p) => {
          const clean = p.trim();
          if (clean && !mergedStats[clean]) {
            mergedStats[clean] = { kills: 0, deaths: 0 };
          }
        });
      }

      setStats(mergedStats);

      // Si fue sincronización manual, persistir la mezcla
      if (isManualSync && serverState) {
        await persistStats(mergedStats, serverState);
      }
    } catch (err) {
      console.warn("Error cargando datos de leaderboard:", err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Contador de 3 segundos para confirmación segura de reseteo
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (showResetModal) {
      setResetCountdown(3);
      timer = setInterval(() => {
        setResetCountdown((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showResetModal]);

  // Persistir en LocalStorage y en la API del servidor (Vercel KV / in-memory)
  const persistStats = async (
    newStats: Record<string, { kills: number; deaths: number }>,
    currentState?: TournamentState | null
  ) => {
    setSaveStatus("saving");

    // Guardar en LocalStorage para persistencia instantánea y offline
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newStats));
      } catch (e) {
        console.warn("Error guardando en localStorage:", e);
      }
    }

    // Guardar en la API del servidor
    try {
      const stateToSave = currentState || tournamentState;
      if (stateToSave && token) {
        const payload: TournamentState = {
          ...stateToSave,
          leaderboard: newStats,
        };
        await fetch("/api/tournament", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        setTournamentState(payload);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1800);
    } catch (err) {
      console.warn("Error guardando en API:", err);
      setSaveStatus("idle");
    }
  };

  // Agregar jugador manual
  const handleAddPlayer = () => {
    const clean = newPlayerName.trim();
    if (!clean) return;
    if (stats[clean]) {
      alert("Ese jugador ya se encuentra en la tabla");
      return;
    }

    setStats((prev) => {
      const next = { ...prev, [clean]: { kills: 0, deaths: 0 } };
      persistStats(next);
      return next;
    });
    setNewPlayerName("");
    setShowAddPlayer(false);
  };

  // Abrir modal de confirmación con cuenta regresiva
  const handleOpenResetModal = () => {
    setShowResetModal(true);
  };

  // Confirmar reinicio y limpiar la tabla completa
  const handleConfirmReset = async () => {
    if (resetCountdown > 0) return;

    const emptyStats: Record<string, { kills: number; deaths: number }> = {};
    setStats(emptyStats);
    setShowResetModal(false);

    // 1. Guardar en LocalStorage vacío
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(emptyStats));
      } catch (e) {
        console.warn("Error guardando en localStorage:", e);
      }
    }

    // 2. Guardar en API servidor con leaderboard vacío
    try {
      if (tournamentState && token) {
        const payload: TournamentState = {
          ...tournamentState,
          leaderboard: emptyStats,
        };
        await fetch("/api/tournament", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        setTournamentState(payload);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1800);
    } catch (err) {
      console.warn("Error guardando en API:", err);
    }
  };

  // Array transformado para ordenar y filtrar
  const playerList: PlayerStats[] = useMemo(() => {
    return Object.entries(stats).map(([name, data]) => ({
      name,
      kills: data.kills || 0,
      deaths: data.deaths || 0,
    }));
  }, [stats]);

  // Lista ordenada y filtrada
  const sortedPlayers = useMemo(() => {
    let list = [...playerList];

    // Filtrar por búsqueda
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Ordenar
    list.sort((a, b) => {
      if (sortMode === "kills") {
        if (b.kills !== a.kills) return b.kills - a.kills;
        return a.deaths - b.deaths; // menos muertes como desempate
      }
      if (sortMode === "kd") {
        const kdA = a.deaths === 0 ? a.kills : a.kills / a.deaths;
        const kdB = b.deaths === 0 ? b.kills : b.kills / b.deaths;
        if (kdB !== kdA) return kdB - kdA;
        return b.kills - a.kills;
      }
      if (sortMode === "diff") {
        const diffA = a.kills - a.deaths;
        const diffB = b.kills - b.deaths;
        if (diffB !== diffA) return diffB - diffA;
        return b.kills - a.kills;
      }
      // Alfabético
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [playerList, search, sortMode]);

  // Totales y destacados
  const totalKills = useMemo(
    () => playerList.reduce((acc, p) => acc + p.kills, 0),
    [playerList]
  );
  const totalDeaths = useMemo(
    () => playerList.reduce((acc, p) => acc + p.deaths, 0),
    [playerList]
  );
  const topFragger = useMemo(() => {
    if (playerList.length === 0) return null;
    return [...playerList].sort((a, b) => b.kills - a.kills)[0];
  }, [playerList]);
  const bestKD = useMemo(() => {
    if (playerList.length === 0) return null;
    return [...playerList]
      .filter((p) => p.kills > 0 || p.deaths > 0)
      .sort((a, b) => {
        const kdA = a.deaths === 0 ? a.kills : a.kills / a.deaths;
        const kdB = b.deaths === 0 ? b.kills : b.kills / b.deaths;
        return kdB - kdA;
      })[0];
  }, [playerList]);

  // Formateador de KD
  const formatKD = (kills: number, deaths: number) => {
    if (deaths === 0) return kills > 0 ? `${kills}.00` : "0.00";
    return (kills / deaths).toFixed(2);
  };

  const getKDBadgeClass = (kills: number, deaths: number) => {
    const ratio = deaths === 0 ? kills : kills / deaths;
    if (kills === 0 && deaths === 0) return "text-[#8d939e] bg-[#22242a]";
    if (ratio >= 2.0) return "text-emerald-400 bg-emerald-950/40 border border-emerald-500/40";
    if (ratio >= 1.2) return "text-green-400 bg-green-950/30 border border-green-500/30";
    if (ratio >= 0.9) return "text-[#FF5500] bg-[#FF5500]/15 border border-[#FF5500]/30";
    return "text-red-400 bg-red-950/30 border border-red-500/30";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282a32] pb-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF5500] rounded-sm inline-block"></span>
            Leaderboard 1v1
          </h2>
          <p className="text-xs text-[#8d939e] tracking-wide uppercase mt-0.5">
            Estadísticas calculadas automáticamente a partir de los resultados de cada duelo
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          {saveStatus === "saving" && (
            <span className="text-[10px] font-bold text-[#FF5500] uppercase tracking-wider px-2 py-1 bg-[#FF5500]/10 border border-[#FF5500]/20 rounded animate-pulse">
              Guardando...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded flex items-center gap-1">
              <Check size={11} /> Guardado
            </span>
          )}

          {/* Botón sincronizar */}
          <button
            onClick={() => loadData(true)}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] rounded transition-all cursor-pointer disabled:opacity-50"
            title="Sincronizar participantes del bracket creado"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin text-[#FF5500]" : ""} />
            <span>{syncing ? "Sincronizando..." : "Sincronizar Bracket"}</span>
          </button>

          {/* Botón reiniciar */}
          <button
            onClick={handleOpenResetModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#8d939e] hover:text-red-400 bg-[#1a1b1f] border border-[#282a32] hover:border-red-500/40 rounded transition-all cursor-pointer"
            title="Limpiar la tabla completa del torneo"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reiniciar Stats</span>
          </button>
        </div>
      </div>

      {/* STATS HIGHLIGHTS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Top Fragger */}
        <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8d939e]">
              Top Fragger
            </span>
            <Trophy size={14} className="text-amber-400" />
          </div>
          <p className="text-lg font-black text-white truncate">
            {topFragger && topFragger.kills > 0 ? topFragger.name : "—"}
          </p>
          <p className="text-xs text-[#FF5500] font-bold mt-0.5">
            {topFragger ? `${topFragger.kills} Kills` : "Sin frags"}
          </p>
        </div>

        {/* Mejor K/D */}
        <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8d939e]">
              Mejor K/D
            </span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <p className="text-lg font-black text-white truncate">
            {bestKD && (bestKD.kills > 0 || bestKD.deaths > 0) ? bestKD.name : "—"}
          </p>
          <p className="text-xs text-emerald-400 font-bold mt-0.5">
            {bestKD ? `${formatKD(bestKD.kills, bestKD.deaths)} Ratio` : "—"}
          </p>
        </div>

        {/* Total Kills */}
        <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8d939e]">
              Total Kills
            </span>
            <Crosshair size={14} className="text-[#FF5500]" />
          </div>
          <p className="text-2xl font-black text-white">{totalKills}</p>
          <p className="text-[10px] text-[#8d939e] uppercase tracking-wider mt-0.5">
            Frags del Torneo
          </p>
        </div>

        {/* Total Muertes / Jugadores */}
        <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8d939e]">
              Competidores
            </span>
            <Skull size={14} className="text-slate-400" />
          </div>
          <p className="text-2xl font-black text-white">{playerList.length}</p>
          <p className="text-[10px] text-[#8d939e] uppercase tracking-wider mt-0.5">
            {totalDeaths} Muertes registradas
          </p>
        </div>
      </div>

      {/* CONTROLS: BUSCADOR & FILTROS DE ORDENAMIENTO */}
      <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d939e]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar competidor por nick..."
              className="w-full pl-9 pr-8 py-2 bg-[#141518] border border-[#282a32] focus:border-[#FF5500] rounded-lg text-xs font-bold text-white placeholder:text-[#474c57] focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8d939e] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Ordenar por */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8d939e] mr-1">
              Ordenar:
            </span>
            <button
              onClick={() => setSortMode("kills")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                sortMode === "kills"
                  ? "bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/20"
                  : "bg-[#141518] text-[#8d939e] hover:text-white border border-[#282a32]"
              }`}
            >
              Más Kills
            </button>
            <button
              onClick={() => setSortMode("kd")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                sortMode === "kd"
                  ? "bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/20"
                  : "bg-[#141518] text-[#8d939e] hover:text-white border border-[#282a32]"
              }`}
            >
              Mejor K/D
            </button>
            <button
              onClick={() => setSortMode("diff")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                sortMode === "diff"
                  ? "bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/20"
                  : "bg-[#141518] text-[#8d939e] hover:text-white border border-[#282a32]"
              }`}
            >
              +/- (Diff)
            </button>
            <button
              onClick={() => setSortMode("name")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                sortMode === "name"
                  ? "bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/20"
                  : "bg-[#141518] text-[#8d939e] hover:text-white border border-[#282a32]"
              }`}
            >
              A-Z
            </button>

            {/* Agregar jugador manual */}
            <button
              onClick={() => setShowAddPlayer(!showAddPlayer)}
              className="ml-auto md:ml-2 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-[#141518] hover:border-[#FF5500] text-white border border-[#282a32] transition-colors cursor-pointer"
            >
              <UserPlus size={13} />
              <span>+ Jugador</span>
            </button>
          </div>
        </div>

        {/* Formulario rápido para agregar jugador manual */}
        {showAddPlayer && (
          <div className="pt-3 border-t border-[#282a32] flex items-center gap-2 animate-fade-in-up">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
              placeholder="Nick del competidor a agregar..."
              className="flex-1 max-w-sm px-3 py-1.5 bg-[#141518] border border-[#282a32] focus:border-[#FF5500] rounded-lg text-xs font-bold text-white placeholder:text-[#474c57] focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleAddPlayer}
              className="px-4 py-1.5 bg-[#FF5500] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg hover:bg-[#ff6b1a] transition-all cursor-pointer"
            >
              Agregar
            </button>
            <button
              onClick={() => setShowAddPlayer(false)}
              className="px-3 py-1.5 bg-[#141518] text-[#8d939e] text-xs font-bold uppercase rounded-lg hover:text-white"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* TABLA PRINCIPAL DE STATS */}
      <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#282a32] bg-[#141518]/90 text-[10px] font-black uppercase tracking-widest text-[#8d939e]">
                <th className="py-3 px-4 w-16 text-center"># Pos</th>
                <th className="py-3 px-4">Jugador</th>
                <th className="py-3 px-4 text-center w-28">Kills</th>
                <th className="py-3 px-4 text-center w-28">Deaths</th>
                <th className="py-3 px-4 text-center w-24">+/- Diff</th>
                <th className="py-3 px-4 text-center w-28">K/D Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282a32]/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#8d939e]">
                    Cargando estadísticas del torneo...
                  </td>
                </tr>
              ) : sortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center space-y-2">
                    <p className="text-sm font-bold text-slate-300">
                      {search ? "No se encontraron jugadores con ese nombre" : "No hay jugadores en la tabla"}
                    </p>
                    <p className="text-xs text-[#8d939e]">
                      Puedes pulsar en{" "}
                      <strong className="text-[#FF5500]">"Sincronizar Bracket"</strong> para traer los del
                      torneo o agregar uno manualmente.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedPlayers.map((player, idx) => {
                  const diff = player.kills - player.deaths;
                  const isTop1 = idx === 0 && !search;
                  const isTop2 = idx === 1 && !search;
                  const isTop3 = idx === 2 && !search;
                  const isCurrentUser = Boolean(
                    user &&
                      (player.name.trim().toLowerCase() === user.username.trim().toLowerCase() ||
                       player.name.trim().toLowerCase() === user.displayName.trim().toLowerCase())
                  );

                  return (
                    <tr
                      key={player.name}
                      className={`transition-colors hover:bg-[#141518]/60 ${
                        isCurrentUser
                          ? "bg-[#FF5500]/10 border-l-2 border-l-[#FF5500]"
                          : isTop1
                          ? "bg-[#FF5500]/5"
                          : ""
                      }`}
                    >
                      {/* Posición */}
                      <td className="py-3.5 px-4 text-center">
                        {isTop1 ? (
                          <div className="w-7 h-7 mx-auto rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                            1
                          </div>
                        ) : isTop2 ? (
                          <div className="w-7 h-7 mx-auto rounded-full bg-slate-300/20 border border-slate-300 text-slate-200 flex items-center justify-center font-black text-xs">
                            2
                          </div>
                        ) : isTop3 ? (
                          <div className="w-7 h-7 mx-auto rounded-full bg-amber-700/20 border border-amber-600 text-amber-500 flex items-center justify-center font-black text-xs">
                            3
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-bold text-[#8d939e]">
                            #{idx + 1}
                          </span>
                        )}
                      </td>

                      {/* Nick del jugador */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-md border flex items-center justify-center font-black text-xs ${
                              isCurrentUser
                                ? "bg-[#FF5500] text-white border-[#FF5500]"
                                : "bg-[#141518] border-[#282a32] text-[#FF5500]"
                            }`}
                          >
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white tracking-wide block">
                              {player.name}
                            </span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#FF5500] text-white shadow-sm">
                                TÚ
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* KILLS BADGE */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] font-black text-sm min-w-[50px]">
                          {player.kills}
                        </span>
                      </td>

                      {/* DEATHS BADGE */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded bg-[#141518] border border-[#282a32] text-slate-300 font-bold text-sm min-w-[50px]">
                          {player.deaths}
                        </span>
                      </td>

                      {/* +/- DIFF */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                            diff > 0
                              ? "text-emerald-400 bg-emerald-950/30 border border-emerald-500/20"
                              : diff < 0
                              ? "text-red-400 bg-red-950/30 border border-red-500/20"
                              : "text-slate-400"
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      </td>

                      {/* K/D RATIO */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block font-mono text-xs font-black px-2.5 py-1 rounded ${getKDBadgeClass(
                            player.kills,
                            player.deaths
                          )}`}
                        >
                          {formatKD(player.kills, player.deaths)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota al pie */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8d939e] px-1 gap-2">
        <p>
          💡 <strong>Tip:</strong> Puedes escribir directamente la cantidad en la casilla o pulsar{" "}
          <strong className="text-white">+ / -</strong> para sumar o restar en vivo.
        </p>
        <p>Guardado persistente activo</p>
      </div>

      {/* Modal de confirmación con cuenta regresiva de 3s */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141518] border-2 border-red-500/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center animate-fade-in-up">
            <div className="w-14 h-14 bg-red-950/40 border border-red-500/50 rounded-full flex items-center justify-center mx-auto text-red-400 mb-4 shadow-lg shadow-red-950/40">
              <AlertCircle size={30} />
            </div>

            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
              ¿Limpiar Tabla Completa?
            </h3>

            <p className="text-xs text-[#8d939e] leading-relaxed mb-6">
              Esta acción eliminará a <strong className="text-white">todos los competidores</strong> y reseteará todas las Kills y Muertes del Leaderboard.
              <br />
              <span className="text-[11px] text-slate-400 block mt-2">
                (Podrás volver a cargar a los participantes en cualquier momento con el botón <strong>"Sincronizar Bracket"</strong>).
              </span>
            </p>

            <div className="space-y-2.5">
              {resetCountdown > 0 ? (
                <button
                  disabled
                  className="w-full py-3 bg-[#1e2026] text-[#8d939e] font-black text-xs uppercase tracking-wider rounded-lg opacity-60 cursor-not-allowed flex items-center justify-center gap-2 border border-[#282a32]"
                >
                  <Clock size={15} className="animate-spin text-[#FF5500]" />
                  <span>Confirmar disponible en {resetCountdown}s...</span>
                </button>
              ) : (
                <button
                  onClick={handleConfirmReset}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 size={15} />
                  <span>Sí, Limpiar Tabla Completa</span>
                </button>
              )}

              <button
                onClick={() => setShowResetModal(false)}
                className="w-full py-2.5 bg-[#1a1b1f] hover:bg-[#22242a] text-[#8d939e] hover:text-white border border-[#282a32] text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
