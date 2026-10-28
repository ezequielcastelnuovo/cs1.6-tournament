"use client";

import { useState } from "react";
import {
  Coins,
  RotateCcw,
  Ban,
  Trophy,
  Swords,
  CheckCircle2,
  Shield,
  Crosshair,
  Flame,
  Zap,
  Target,
  Waves,
  Snowflake,
} from "lucide-react";
import { CS_MAPS } from "@/lib/types";

type CoinSide = "cara" | "cruz";
type VetoPhase = "setup" | "flipping" | "result" | "veto" | "done";

interface MapState {
  name: string;
  icon: string;
  label: string;
  banned: boolean;
  bannedBy: string | null;
  order: number | null;
}

function getMapIcon(iconName: string) {
  switch (iconName) {
    case "crosshair":
      return <Crosshair size={28} className="text-[#FF5500]" />;
    case "snowflake":
      return <Snowflake size={28} className="text-cyan-400" />;
    case "flame":
      return <Flame size={28} className="text-amber-500" />;
    case "zap":
      return <Zap size={28} className="text-yellow-400" />;
    case "target":
      return <Target size={28} className="text-red-400" />;
    case "shield":
      return <Shield size={28} className="text-emerald-400" />;
    case "waves":
      return <Waves size={28} className="text-blue-400" />;
    default:
      return <Crosshair size={28} className="text-[#FF5500]" />;
  }
}

export default function MapVeto() {
  const [phase, setPhase] = useState<VetoPhase>("setup");
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");

  const [player1Choice, setPlayer1Choice] = useState<CoinSide>("cara");
  const player2Choice: CoinSide = player1Choice === "cara" ? "cruz" : "cara";

  const [coinResult, setCoinResult] = useState<CoinSide | null>(null);
  const [winnerName, setWinnerName] = useState<string>("");
  const [firstBanner, setFirstBanner] = useState<string>("");
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [banCount, setBanCount] = useState(0);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);

  const [maps, setMaps] = useState<MapState[]>(() =>
    CS_MAPS.map((m) => ({
      name: m.name,
      icon: m.icon,
      label: m.label,
      banned: false,
      bannedBy: null,
      order: null,
    }))
  );

  const resetAll = () => {
    setPhase("setup");
    setPlayer1("");
    setPlayer2("");
    setPlayer1Choice("cara");
    setCoinResult(null);
    setWinnerName("");
    setFirstBanner("");
    setCurrentTurn(1);
    setBanCount(0);
    setSelectedMap(null);
    setMaps(
      CS_MAPS.map((m) => ({
        name: m.name,
        icon: m.icon,
        label: m.label,
        banned: false,
        bannedBy: null,
        order: null,
      }))
    );
  };

  const p1Clean = player1.trim() || "Jugador 1";
  const p2Clean = player2.trim() || "Jugador 2";
  const canFlip = player1.trim().length > 0 && player2.trim().length > 0;

  const handleFlipCoin = () => {
    if (!canFlip) return;
    setPhase("flipping");
    setCoinResult(null);

    setTimeout(() => {
      const result: CoinSide = Math.random() < 0.5 ? "cara" : "cruz";
      setCoinResult(result);

      const winner = result === player1Choice ? player1.trim() : player2.trim();
      setWinnerName(winner);
      setFirstBanner(winner);
      setPhase("result");
    }, 1400);
  };

  const startVeto = () => {
    setPhase("veto");
    setCurrentTurn(1);
  };

  const getSecondBanner = () => {
    return firstBanner === player1.trim() ? player2.trim() : player1.trim();
  };

  const getCurrentBannerName = () => {
    return currentTurn === 1 ? firstBanner : getSecondBanner();
  };

  const handleBanMap = (mapName: string) => {
    if (phase !== "veto") return;

    const remaining = maps.filter((m) => !m.banned);
    if (remaining.length <= 1) return;

    const newMaps = maps.map((m) => {
      if (m.name === mapName) {
        return {
          ...m,
          banned: true,
          bannedBy: getCurrentBannerName(),
          order: banCount + 1,
        };
      }
      return m;
    });

    setMaps(newMaps);
    const newBanCount = banCount + 1;
    setBanCount(newBanCount);

    const stillRemaining = newMaps.filter((m) => !m.banned);
    if (stillRemaining.length === 1) {
      setSelectedMap(stillRemaining[0].name);
      setPhase("done");
    } else {
      setCurrentTurn(currentTurn === 1 ? 2 : 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#282a32] pb-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF5500] rounded-sm inline-block"></span>
            Veto de Mapas 1v1
          </h2>
          <p className="text-xs text-[#8d939e] tracking-wide uppercase mt-0.5">
            Sorteo centralizado & descarte competitivo estilo FaceIT
          </p>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#8d939e] hover:text-white bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] rounded transition-all"
        >
          <RotateCcw size={13} />
          Reiniciar
        </button>
      </div>

      {/* PHASE 1 & 2: SETUP + COIN FLIP */}
      {(phase === "setup" || phase === "flipping" || phase === "result") && (
        <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-6 sm:p-8 space-y-7 shadow-2xl relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5500]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Centralized Matchup Configuration */}
          <div>
            <div className="text-center mb-6">
              <span className="px-3 py-1 bg-[#282a32] text-[#8d939e] text-[10px] font-bold uppercase tracking-widest rounded-full">
                Configuración del Enfrentamiento
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
              {/* Player 1 Card */}
              <div className="md:col-span-5 bg-[#141518] border border-[#282a32] focus-within:border-[#FF5500] rounded-lg p-4 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5500]">
                    Jugador 1
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 flex items-center gap-1">
                    {player1Choice === "cara" ? <Coins size={12} /> : <Shield size={12} />}
                    {player1Choice === "cara" ? "CARA" : "CRUZ"}
                  </span>
                </div>
                <input
                  type="text"
                  disabled={phase !== "setup"}
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  placeholder="Nick del Jugador 1..."
                  className="w-full bg-transparent text-white font-bold text-base placeholder:text-[#474c57] focus:outline-none"
                />
              </div>

              {/* VS Divider */}
              <div className="md:col-span-1 flex justify-center py-1">
                <div className="w-10 h-10 rounded-full bg-[#22242a] border border-[#282a32] flex items-center justify-center font-black text-xs text-[#FF5500] shadow-md">
                  VS
                </div>
              </div>

              {/* Player 2 Card */}
              <div className="md:col-span-5 bg-[#141518] border border-[#282a32] focus-within:border-[#FF5500] rounded-lg p-4 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8d939e]">
                    Jugador 2
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#282a32] text-slate-300 flex items-center gap-1">
                    {player2Choice === "cara" ? <Coins size={12} /> : <Shield size={12} />}
                    {player2Choice === "cara" ? "CARA" : "CRUZ"}
                    <span className="text-[9px] text-[#8d939e] ml-0.5">(auto)</span>
                  </span>
                </div>
                <input
                  type="text"
                  disabled={phase !== "setup"}
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  placeholder="Nick del Jugador 2..."
                  className="w-full bg-transparent text-white font-bold text-base placeholder:text-[#474c57] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* COIN SELECTION */}
          {phase === "setup" && (
            <div className="bg-[#141518] border border-[#282a32] rounded-lg p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#282a32] pb-3">
                <div className="flex items-center gap-2">
                  <Coins className="text-[#FF5500]" size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Elección de Sorteo
                  </span>
                </div>
                <p className="text-[11px] text-[#8d939e]">
                  {p1Clean} elige su opción. La contraria se asigna a {p2Clean}.
                </p>
              </div>

              {/* Choice selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlayer1Choice("cara")}
                  className={`p-4 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                    player1Choice === "cara"
                      ? "bg-[#FF5500]/15 border-[#FF5500] text-white shadow-lg shadow-[#FF5500]/15"
                      : "bg-[#1a1b1f] border-[#282a32] text-[#8d939e] hover:border-[#3e424e] hover:text-white"
                  }`}
                >
                  <Coins size={28} className={player1Choice === "cara" ? "text-[#FF5500] mb-2" : "text-[#8d939e] mb-2"} />
                  <div className="text-xs font-black uppercase tracking-wider">
                    CARA
                  </div>
                  <div className="text-[10px] text-[#8d939e] mt-1">
                    {p1Clean}: <strong className="text-white">Cara</strong> · {p2Clean}: <span className="text-[#8d939e]">Cruz</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlayer1Choice("cruz")}
                  className={`p-4 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                    player1Choice === "cruz"
                      ? "bg-[#FF5500]/15 border-[#FF5500] text-white shadow-lg shadow-[#FF5500]/15"
                      : "bg-[#1a1b1f] border-[#282a32] text-[#8d939e] hover:border-[#3e424e] hover:text-white"
                  }`}
                >
                  <Shield size={28} className={player1Choice === "cruz" ? "text-[#FF5500] mb-2" : "text-[#8d939e] mb-2"} />
                  <div className="text-xs font-black uppercase tracking-wider">
                    CRUZ
                  </div>
                  <div className="text-[10px] text-[#8d939e] mt-1">
                    {p1Clean}: <strong className="text-white">Cruz</strong> · {p2Clean}: <span className="text-[#8d939e]">Cara</span>
                  </div>
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={handleFlipCoin}
                disabled={!canFlip}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#FF5500] to-[#E04B00] text-white font-extrabold uppercase tracking-wider rounded-lg hover:from-[#ff6b1a] hover:to-[#FF5500] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#FF5500]/25 flex items-center justify-center gap-2"
              >
                <Coins size={18} />
                Lanzar Sorteo
              </button>
              {!canFlip && (
                <p className="text-center text-[11px] text-[#8d939e]">
                  Ingresá los nombres de ambos jugadores para sortear
                </p>
              )}
            </div>
          )}

          {/* FLIPPING IN PROGRESS */}
          {phase === "flipping" && (
            <div className="text-center py-8 space-y-4 animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#141518] border-2 border-[#FF5500] text-[#FF5500] shadow-faceit-orange coin-flip">
                <Coins size={40} />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-[#FF5500] animate-pulse">
                Sorteando inicio de baneo...
              </p>
            </div>
          )}

          {/* FLIP RESULT & BANNER */}
          {phase === "result" && coinResult && (
            <div className="text-center py-4 space-y-4 animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#141518] border-2 border-[#FF5500] shadow-faceit-orange text-[#FF5500] mb-1">
                {coinResult === "cara" ? <Coins size={38} /> : <Shield size={38} />}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#8d939e]">
                  Resultado del Sorteo
                </p>
                <h3 className="text-2xl font-black uppercase tracking-wider text-white">
                  ¡SALIÓ {coinResult.toUpperCase()}!
                </h3>
                <p className="text-sm text-slate-300 mt-2">
                  <strong className="text-[#FF5500] font-extrabold text-base">
                    {winnerName}
                  </strong>{" "}
                  acertó el sorteo y <strong className="text-white">banea primero</strong>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={startVeto}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#FF5500] to-[#E04B00] text-white font-black uppercase tracking-wider rounded-lg hover:from-[#ff6b1a] hover:to-[#FF5500] transition-all shadow-xl shadow-[#FF5500]/30 inline-flex items-center gap-2"
                >
                  <Ban size={16} />
                  Comenzar Veto de Mapas →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: VETO SELECTION */}
      {phase === "veto" && (
        <div className="space-y-5 animate-fade-in-up">
          {/* Active Turn Banner FaceIT style */}
          <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF5500]/15 border border-[#FF5500]/40 flex items-center justify-center text-[#FF5500]">
                  <Ban size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8d939e] block">
                    Turno de Ban #{banCount + 1}
                  </span>
                  <p className="text-xl font-black uppercase text-white tracking-wide">
                    Le toca a:{" "}
                    <span className="text-[#FF5500]">
                      {getCurrentBannerName()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 bg-[#141518] border border-[#282a32] rounded text-xs font-bold text-[#8d939e]">
                  {maps.filter((m) => !m.banned).length} mapas restantes
                </span>
                <p className="text-[10px] text-[#8d939e] uppercase tracking-wider mt-1">
                  Elige un mapa para descartarlo
                </p>
              </div>
            </div>
          </div>

          {/* Map Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {maps.map((map) => (
              <button
                key={map.name}
                disabled={map.banned}
                onClick={() => handleBanMap(map.name)}
                className={`relative group rounded-xl border p-5 text-left transition-all ${
                  map.banned
                    ? "bg-[#141518]/60 border-[#282a32]/40 opacity-40 cursor-not-allowed"
                    : "bg-[#1a1b1f] border-[#282a32] hover:border-[#FF5500] hover:shadow-faceit-orange cursor-pointer hover:-translate-y-0.5"
                }`}
              >
                {/* Banned icon overlay */}
                {map.banned && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Ban className="w-16 h-16 text-red-500/30" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#141518] border border-[#282a32] flex items-center justify-center">
                    {getMapIcon(map.icon)}
                  </div>
                  {!map.banned ? (
                    <span className="opacity-0 group-hover:opacity-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-[#FF5500] text-white rounded transition-opacity">
                      BAN
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-red-950/40 text-red-400 border border-red-500/30 rounded">
                      #{map.order}
                    </span>
                  )}
                </div>

                <p
                  className={`text-sm font-extrabold tracking-wide ${
                    map.banned ? "line-through text-slate-500" : "text-white"
                  }`}
                >
                  {map.name}
                </p>

                {map.banned && map.bannedBy && (
                  <p className="text-[10px] text-red-400/80 mt-1 font-semibold truncate">
                    Baneado por {map.bannedBy}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 4: DECIDED MAP */}
      {phase === "done" && selectedMap && (
        <div className="animate-fade-in-up space-y-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1b1f] via-[#141518] to-[#1a1b1f] border-2 border-[#FF5500] rounded-2xl p-8 text-center shadow-faceit-orange">
            <div className="shimmer absolute inset-0 pointer-events-none" />
            <div className="w-14 h-14 bg-[#FF5500]/20 border border-[#FF5500]/50 rounded-full flex items-center justify-center mx-auto mb-3 text-[#FF5500]">
              <Trophy size={28} />
            </div>

            <p className="text-xs uppercase tracking-[0.25em] text-[#FF5500] font-extrabold mb-1">
              Mapa Final Seleccionado
            </p>
            <div className="w-16 h-16 rounded-xl bg-[#141518] border border-[#282a32] flex items-center justify-center mx-auto my-3">
              {getMapIcon(maps.find((m) => m.name === selectedMap)?.icon || "crosshair")}
            </div>
            <h3 className="text-4xl font-black text-white tracking-wider uppercase mb-2">
              {selectedMap}
            </h3>
            <p className="text-sm font-bold text-[#8d939e] uppercase tracking-wider">
              {p1Clean} <span className="text-[#FF5500]">VS</span> {p2Clean}
            </p>
          </div>

          {/* Ban history log */}
          <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-5">
            <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-[#8d939e] mb-3">
              Registro del Proceso de Veto
            </h4>
            <div className="divide-y divide-[#282a32]/60">
              {maps
                .filter((m) => m.banned)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center justify-between py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8d939e] font-mono w-5">
                        #{m.order}
                      </span>
                      <Ban size={12} className="text-red-400" />
                      <span className="line-through text-slate-400 font-medium">
                        {m.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8d939e] font-semibold">
                      Baneado por <span className="text-white">{m.bannedBy}</span>
                    </span>
                  </div>
                ))}
              <div className="flex items-center justify-between py-2.5 text-xs text-[#FF5500] font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#FF5500]" />
                  <span>{selectedMap}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider bg-[#FF5500]/10 px-2 py-0.5 rounded border border-[#FF5500]/30">
                  Mapa Elegido
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={resetAll}
            className="w-full py-3.5 bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] text-white font-extrabold uppercase tracking-wider rounded-xl hover:bg-[#22242a] transition-all shadow-lg"
          >
            Configurar Nuevo Duelo / Revancha
          </button>
        </div>
      )}
    </div>
  );
}
