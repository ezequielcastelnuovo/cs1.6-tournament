"use client";

import { useState } from "react";
import {
  RotateCcw,
  Ban,
  Trophy,
  CheckCircle2,
  X,
} from "lucide-react";
import { CS_MAPS } from "@/lib/types";
import {
  RealisticCoin,
  FlipCoin3D,
  type CoinSide,
} from "./RealisticCoin";

type VetoPhase = "setup" | "flipping" | "result" | "veto" | "done";

interface MapState {
  name: string;
  label: string;
  image: string;
  mode: string;
  banned: boolean;
  bannedBy: string | null;
  order: number | null;
}

interface MapVetoProps {
  player1?: string;
  player2?: string;
  onMapSelected?: (mapName: string) => void;
  onClose?: () => void;
}

export default function MapVeto({
  player1: initialP1,
  player2: initialP2,
  onMapSelected,
  onClose,
}: MapVetoProps = {}) {
  const [phase, setPhase] = useState<VetoPhase>("setup");
  const [player1, setPlayer1] = useState(initialP1 || "");
  const [player2, setPlayer2] = useState(initialP2 || "");

  const [player1Choice, setPlayer1Choice] = useState<CoinSide>("cara");
  const player2Choice: CoinSide = player1Choice === "cara" ? "cruz" : "cara";

  const [coinResult, setCoinResult] = useState<CoinSide | null>(null);
  const [flipHistory, setFlipHistory] = useState<CoinSide[]>([]);
  const [winnerName, setWinnerName] = useState<string>("");
  const [firstBanner, setFirstBanner] = useState<string>("");
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [banCount, setBanCount] = useState(0);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);

  const [maps, setMaps] = useState<MapState[]>(() =>
    CS_MAPS.map((m) => ({
      name: m.name,
      label: m.label,
      image: m.image,
      mode: m.mode,
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
        label: m.label,
        image: m.image,
        mode: m.mode,
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

    // Sistema de aleatoriedad criptográfica con protección contra rachas consecutivas
    let result: CoinSide;
    const history = flipHistory;

    // Si salieron 2 resultados iguales consecutivos, forzamos alternancia para que nunca salgan 3 iguales
    if (history.length >= 2 && history[history.length - 1] === history[history.length - 2]) {
      result = history[history.length - 1] === "cara" ? "cruz" : "cara";
    } else {
      // Entropía de hardware mediante Web Crypto API
      if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        result = randomBuffer[0] % 2 === 0 ? "cara" : "cruz";
      } else {
        result = Math.random() < 0.5 ? "cara" : "cruz";
      }
    }

    setTimeout(() => {
      setCoinResult(result);
      setFlipHistory((prev) => [...prev, result]);

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

  const content = (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#282a32] pb-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF5500] rounded-sm inline-block"></span>
            Veto de Mapas 1v1
          </h2>
          <p className="text-xs text-[#8d939e] tracking-wide uppercase mt-0.5">
            {p1Clean} <span className="text-[#FF5500]">VS</span> {p2Clean} · Sorteo centralizado & descarte
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#8d939e] hover:text-white bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] rounded transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reiniciar</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8d939e] hover:text-white bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] transition-colors cursor-pointer"
              title="Cerrar veto"
            >
              <X size={16} />
            </button>
          )}
        </div>
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
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 flex items-center gap-1.5">
                    <RealisticCoin side={player1Choice} size={15} showShadow={false} />
                    <span>{player1Choice === "cara" ? "CARA" : "CRUZ"}</span>
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
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#282a32] text-slate-300 flex items-center gap-1.5">
                    <RealisticCoin side={player2Choice} size={15} showShadow={false} />
                    <span>{player2Choice === "cara" ? "CARA" : "CRUZ"}</span>
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
                  <RealisticCoin side="cara" size={20} showShadow={false} />
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
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    player1Choice === "cara"
                      ? "bg-[#FF5500]/15 border-[#FF5500] text-white shadow-lg shadow-[#FF5500]/15"
                      : "bg-[#1a1b1f] border-[#282a32] text-[#8d939e] hover:border-[#3e424e] hover:text-white"
                  }`}
                >
                  <div className="mb-2 transition-transform hover:scale-105">
                    <RealisticCoin side="cara" size={54} />
                  </div>
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
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    player1Choice === "cruz"
                      ? "bg-[#FF5500]/15 border-[#FF5500] text-white shadow-lg shadow-[#FF5500]/15"
                      : "bg-[#1a1b1f] border-[#282a32] text-[#8d939e] hover:border-[#3e424e] hover:text-white"
                  }`}
                >
                  <div className="mb-2 transition-transform hover:scale-105">
                    <RealisticCoin side="cruz" size={54} />
                  </div>
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
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#FF5500] to-[#E04B00] text-white font-extrabold uppercase tracking-wider rounded-lg hover:from-[#ff6b1a] hover:to-[#FF5500] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#FF5500]/25 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <RealisticCoin side="cara" size={18} showShadow={false} />
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
            <div className="text-center py-10 space-y-6 animate-fade-in-up">
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <FlipCoin3D isFlipping={true} result={null} size={110} />
              </div>
              <div>
                <p className="text-base font-black uppercase tracking-widest text-[#FF5500] animate-pulse">
                  Lanzando Moneda al Aire...
                </p>
                <p className="text-xs text-[#8d939e] uppercase tracking-wider mt-1">
                  Sorteando quién banea primero de manera imparcial
                </p>
              </div>
            </div>
          )}

          {/* FLIP RESULT & BANNER */}
          {phase === "result" && coinResult && (
            <div className="text-center py-6 space-y-5 animate-fade-in-up">
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <FlipCoin3D isFlipping={false} result={coinResult} size={115} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#8d939e]">
                  Resultado del Sorteo
                </p>
                <h3 className="text-3xl font-black uppercase tracking-wider text-white mt-1">
                  ¡SALIÓ {coinResult.toUpperCase()}!
                </h3>
                <p className="text-sm text-slate-300 mt-2 flex items-center justify-center gap-2">
                  <strong className="text-[#FF5500] font-extrabold text-base">
                    {winnerName}
                  </strong>{" "}
                  eligió{" "}
                  <span className="inline-flex items-center gap-1.5 font-bold text-white bg-[#141518] px-2 py-0.5 rounded border border-[#282a32]">
                    <RealisticCoin side={coinResult} size={16} showShadow={false} />
                    {coinResult === "cara" ? "Cara" : "Cruz"}
                  </span>{" "}
                  y <strong className="text-white">banea primero</strong>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={startVeto}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#FF5500] to-[#E04B00] text-white font-black uppercase tracking-wider rounded-lg hover:from-[#ff6b1a] hover:to-[#FF5500] transition-all shadow-xl shadow-[#FF5500]/30 inline-flex items-center gap-2 cursor-pointer"
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
                className={`relative group rounded-xl border overflow-hidden text-left transition-all ${
                  map.banned
                    ? "bg-[#141518]/70 border-[#282a32]/40 opacity-45 cursor-not-allowed"
                    : "bg-[#1a1b1f] border-[#282a32] hover:border-[#FF5500] hover:shadow-faceit-orange cursor-pointer hover:-translate-y-0.5"
                }`}
              >
                {/* Map preview thumbnail */}
                <div className="relative w-full h-28 overflow-hidden bg-[#141518]">
                  <img
                    src={map.image}
                    alt={map.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      map.banned
                        ? "grayscale brightness-40"
                        : "group-hover:scale-105"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b1f] via-transparent to-black/40 pointer-events-none" />

                  {/* Banned icon overlay */}
                  {map.banned && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] pointer-events-none">
                      <Ban className="w-12 h-12 text-red-500/80 drop-shadow-md" />
                    </div>
                  )}

                  {/* Top status badge (BAN or Order, no emojis) */}
                  <div className="absolute top-2 right-2 pointer-events-none">
                    {!map.banned ? (
                      <span className="opacity-0 group-hover:opacity-100 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-[#FF5500] text-white rounded transition-opacity shadow-md">
                        BAN
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-red-950/90 text-red-300 border border-red-500/40 rounded backdrop-blur-sm">
                        #{map.order}
                      </span>
                    )}
                  </div>
                </div>

                {/* Map info bar */}
                <div className="p-3 bg-[#1a1b1f]">
                  <p
                    className={`text-sm font-black tracking-wide uppercase truncate ${
                      map.banned ? "line-through text-slate-500" : "text-white"
                    }`}
                  >
                    {map.name}
                  </p>

                  {/* Aclaración de armas debajo del nombre del mapa */}
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span
                      className={`text-[11px] font-bold tracking-wide uppercase ${
                        map.banned
                          ? "text-slate-500 line-through"
                          : "text-[#FF5500]"
                      }`}
                    >
                      {map.mode}
                    </span>

                    {map.banned && map.bannedBy && (
                      <span className="text-[10px] text-red-400 font-semibold truncate">
                        Ban: {map.bannedBy}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 4: DECIDED MAP */}
      {phase === "done" && selectedMap && (() => {
        const winningMap = maps.find((m) => m.name === selectedMap);
        return (
          <div className="animate-fade-in-up space-y-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1b1f] via-[#141518] to-[#1a1b1f] border-2 border-[#FF5500] rounded-2xl p-8 sm:p-10 text-center shadow-faceit-orange">
              {/* Imagen de fondo del mapa con iluminación viva (más visible y reconocible) */}
              {winningMap?.image && (
                <img
                  src={winningMap.image}
                  alt={selectedMap}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none filter brightness-[0.78] contrast-105 scale-105"
                />
              )}
              {/* Overlay viñeta suave: protege el contraste de textos dejando brillar el mapa */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141518]/85 via-black/25 to-[#141518]/35 pointer-events-none" />
              <div className="shimmer absolute inset-0 pointer-events-none" />

              {/* Contenido limpio del cartel con sombras reforzadas */}
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#141518]/80 backdrop-blur-sm border-2 border-[#FF5500] rounded-full flex items-center justify-center mx-auto mb-3 text-[#FF5500] shadow-xl">
                  <Trophy size={28} className="filter drop-shadow-[0_0_8px_rgba(255,85,0,0.7)]" />
                </div>

                <p className="text-xs uppercase tracking-[0.25em] text-[#FF5500] font-extrabold mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  Mapa Final Seleccionado
                </p>
                <h3 className="text-4xl sm:text-5xl font-black text-white tracking-wider uppercase mb-1 drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]">
                  {selectedMap}
                </h3>
                {winningMap?.mode && (
                  <div className="mb-3">
                    <span className="inline-block px-3 py-0.5 rounded bg-[#141518]/80 border border-[#FF5500]/50 text-[#FF5500] text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-md">
                      {winningMap.mode}
                    </span>
                  </div>
                )}
                <p className="text-sm font-bold text-white uppercase tracking-wider drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  {p1Clean} <span className="text-[#FF5500]">VS</span> {p2Clean}
                </p>
              </div>
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

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onMapSelected && (
              <button
                type="button"
                onClick={() => {
                  onMapSelected(selectedMap);
                  onClose?.();
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#FF5500] to-[#E04B00] hover:from-[#ff6b1a] hover:to-[#FF5500] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#FF5500]/30 cursor-pointer"
              >
                Asignar Mapa al Duelo y Volver a la Bracket
              </button>
            )}
            <button
              onClick={resetAll}
              className="py-3.5 px-6 bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] text-[#8d939e] hover:text-white font-extrabold uppercase tracking-wider rounded-xl hover:bg-[#22242a] transition-all shadow-lg text-xs cursor-pointer"
            >
              Reiniciar Veto
            </button>
          </div>
        </div>
        );
      })()}
    </div>
  );

  if (onClose) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in-up"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-4xl my-auto bg-[#141518] border border-[#282a32] rounded-2xl shadow-2xl overflow-hidden p-3 sm:p-5 max-h-[95vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
}
