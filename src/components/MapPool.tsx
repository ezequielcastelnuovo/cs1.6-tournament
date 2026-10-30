"use client";

import React, { useState, useEffect } from "react";
import {
  Map as MapIcon,
  Crosshair,
  Zap,
  Target,
  Flame,
  Shield,
  Waves,
  Snowflake,
  Search,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { CS_MAPS } from "@/lib/types";

interface ExtendedMapData {
  name: string;
  label: string;
  image: string;
  mode: string;
  category: "rifles" | "awp" | "knife" | "variety";
  weapons: string;
  description: string;
  tacticalTip: string;
}

const MAP_DETAILS: Record<string, {
  category: "rifles" | "awp" | "knife" | "variety";
  weapons: string;
  description: string;
  tacticalTip: string;
}> = {
  aim_map: {
    category: "rifles",
    weapons: "AK-47 / M4A1 / Desert Eagle",
    description: "El mítico mapa simétrico de entrenamiento por excelencia. Obstáculos geométricos de hormigón diseñados para duelos puros de puntería sin distracciones.",
    tacticalTip: "Controla el ángulo cerrado tras la pared intermedia y aprovecha las ranuras superiores para el primer headshot.",
  },
  fy_iceworld2k: {
    category: "variety",
    weapons: "Armas del piso (Rifles, Escopetas, SMG)",
    description: "Arena helada de bloques simétricos en el suelo. Requiere reflejos veloces para recoger el armamento adecuado y posicionarse antes del rival.",
    tacticalTip: "Avanza rápido recogiendo la AK o Colt en la primera línea. Las esquinas con bloques brindan cobertura ideal contra ráfagas.",
  },
  "35hp_lava": {
    category: "knife",
    weapons: "Cuchillo (Vida reducida a 35 HP)",
    description: "Plataformas flotantes suspendidas sobre un foso de lava hirviente. Con 35 HP de salud, un solo ataque secundario (click derecho) sentencia el round.",
    tacticalTip: "Calcula los tiempos de salto y mantén la distancia. El click derecho con buena sincronización de strafe asegura la kill instantánea.",
  },
  "aim_ak-colt": {
    category: "rifles",
    weapons: "AK-47 (Terroristas) vs M4A1 (Counter-Terrorists)",
    description: "Separado por una fosa central profunda, este mapa mide la efectividad de las dos armas principales del juego a larga y media distancia.",
    tacticalTip: "Dispara ráfagas cortas de 2 o 3 balas. El desnivel del suelo puede ocultar tu cabeza si te agachas a tiempo.",
  },
  aim_headshot: {
    category: "rifles",
    weapons: "AK-47 / M4A1 (Headshot Only)",
    description: "Estructuras defensivas de concreto calculadas milimétricamente para que solo la cabeza del oponente quede visible al asomarse.",
    tacticalTip: "Mantén la mira permanentemente a la altura de la cabeza. Disparar al cuerpo no otorga ventaja; la calma y el tap firing ganan la partida.",
  },
  awp_india: {
    category: "awp",
    weapons: "AWP & Cuchillo",
    description: "El templo icónico para francotiradores. Columnas históricas, rampas elevadas y amplios pasillos que ponen a prueba los reflejos y el no-scope.",
    tacticalTip: "Usa el cover de los pilares laterales para asomarte en counter-strafe. Evita correr en línea recta por el pasillo central descubierto.",
  },
  fy_pool_day: {
    category: "variety",
    weapons: "Arsenal completo del piso",
    description: "El mapa más legendario de la cultura CS en Argentina y el mundo. Una piscina pública con trampolines y baldosas donde la acción es inmediata.",
    tacticalTip: "Toma el trampolín superior solo si tienes visión despejada. El vestuario lateral ofrece una ruta de flanqueo sorpresa.",
  },
};

export default function MapPool() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

  const mapsList: ExtendedMapData[] = CS_MAPS.map((m) => {
    const details = MAP_DETAILS[m.name] || {
      category: "variety",
      weapons: m.mode,
      description: "Mapa competitivo oficial del torneo 1v1.",
      tacticalTip: "Asegura el control del centro del mapa.",
    };
    return {
      name: m.name,
      label: m.label,
      image: m.image,
      mode: m.mode,
      category: details.category,
      weapons: details.weapons,
      description: details.description,
      tacticalTip: details.tacticalTip,
    };
  });

  const filteredMaps = mapsList.filter((m) => {
    const matchesCategory =
      selectedCategory === "all" || m.category === selectedCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.weapons.toLowerCase().includes(search.toLowerCase()) ||
      m.label.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Keyboard navigation for presentation modal
  useEffect(() => {
    if (activeModalIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModalIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActiveModalIndex((prev) =>
          prev !== null ? (prev === 0 ? filteredMaps.length - 1 : prev - 1) : null
        );
      } else if (e.key === "ArrowRight") {
        setActiveModalIndex((prev) =>
          prev !== null ? (prev === filteredMaps.length - 1 ? 0 : prev + 1) : null
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalIndex, filteredMaps.length]);

  const activeMap =
    activeModalIndex !== null ? filteredMaps[activeModalIndex] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282a32] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF5500] rounded-sm inline-block"></span>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              Map Pool Oficial
            </h2>
            <span className="px-2 py-0.5 rounded bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] text-[10px] font-black uppercase tracking-widest">
              {CS_MAPS.length} MAPAS
            </span>
          </div>
          <p className="text-xs text-[#8d939e] uppercase tracking-wide mt-1">
            Rotación competitiva oficial para el torneo 1v1 LAN · Modo Presentador
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d939e]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar mapa o arma..."
            className="w-full bg-[#141518] border border-[#282a32] focus:border-[#FF5500] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-[#474c57] focus:outline-none transition-colors"
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
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === "all"
              ? "bg-[#FF5500] text-white border-[#FF5500] shadow-md shadow-[#FF5500]/20"
              : "bg-[#141518] text-[#8d939e] border-[#282a32] hover:text-white"
          }`}
        >
          Todos ({CS_MAPS.length})
        </button>
        <button
          onClick={() => setSelectedCategory("rifles")}
          className={`px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === "rifles"
              ? "bg-[#FF5500] text-white border-[#FF5500] shadow-md shadow-[#FF5500]/20"
              : "bg-[#141518] text-[#8d939e] border-[#282a32] hover:text-white"
          }`}
        >
          Rifles & Aim (3)
        </button>
        <button
          onClick={() => setSelectedCategory("awp")}
          className={`px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === "awp"
              ? "bg-[#FF5500] text-white border-[#FF5500] shadow-md shadow-[#FF5500]/20"
              : "bg-[#141518] text-[#8d939e] border-[#282a32] hover:text-white"
          }`}
        >
          Solo AWP (1)
        </button>
        <button
          onClick={() => setSelectedCategory("variety")}
          className={`px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === "variety"
              ? "bg-[#FF5500] text-white border-[#FF5500] shadow-md shadow-[#FF5500]/20"
              : "bg-[#141518] text-[#8d939e] border-[#282a32] hover:text-white"
          }`}
        >
          Armas Variadas (2)
        </button>
        <button
          onClick={() => setSelectedCategory("knife")}
          className={`px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === "knife"
              ? "bg-[#FF5500] text-white border-[#FF5500] shadow-md shadow-[#FF5500]/20"
              : "bg-[#141518] text-[#8d939e] border-[#282a32] hover:text-white"
          }`}
        >
          Solo Cuchillo (1)
        </button>
      </div>

      {/* Map Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMaps.map((map, idx) => (
          <div
            key={map.name}
            onClick={() => setActiveModalIndex(idx)}
            className="group bg-[#1a1b1f] border border-[#282a32] hover:border-[#FF5500] rounded-xl overflow-hidden shadow-lg transition-all duration-200 cursor-pointer flex flex-col hover:-translate-y-1 hover:shadow-faceit-orange"
          >
            {/* Map Preview Image */}
            <div className="relative h-44 w-full bg-[#121316] overflow-hidden">
              <img
                src={map.image}
                alt={map.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b1f] via-transparent to-transparent opacity-90" />

              {/* Weapon Mode Badge */}
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/75 text-[#FF5500] border border-[#FF5500]/40 backdrop-blur-md shadow-md">
                  {map.mode}
                </span>
              </div>

              {/* Fullscreen hover hint */}
              <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1 border border-[#282a32]">
                <Maximize2 size={11} className="text-[#FF5500]" />
                <span>Presentar</span>
              </div>
            </div>

            {/* Map Info Bar */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="text-base font-black uppercase text-white tracking-wide group-hover:text-[#FF5500] transition-colors">
                  {map.name}
                </h3>
                <p className="text-[11px] text-[#8d939e] font-semibold mt-0.5 line-clamp-2">
                  {map.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#282a32]/70 flex items-center justify-between text-[11px]">
                <span className="text-[#8d939e] uppercase font-bold text-[10px]">
                  Armas:
                </span>
                <span className="text-slate-200 font-bold truncate max-w-[160px] text-right">
                  {map.weapons}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMaps.length === 0 && (
        <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-12 text-center text-[#8d939e]">
          <p className="text-sm font-bold text-white mb-1">
            No se encontraron mapas con ese criterio
          </p>
          <p className="text-xs">
            Prueba buscando otro nombre o cambiando el filtro de categoría.
          </p>
        </div>
      )}

      {/* FULLSCREEN PRESENTER MODAL */}
      {activeMap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in-up"
          onClick={() => setActiveModalIndex(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#141518] border-2 border-[#FF5500]/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FF5500] via-[#ff7a33] to-[#FF5500] shrink-0" />

            {/* Close Button */}
            <button
              onClick={() => setActiveModalIndex(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-lg text-[#8d939e] hover:text-white bg-[#1a1b1f]/90 border border-[#282a32] hover:border-[#FF5500] transition-colors cursor-pointer"
              title="Cerrar vista de mapa (Esc)"
            >
              <X size={18} />
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={() =>
                setActiveModalIndex((prev) =>
                  prev !== null
                    ? prev === 0
                      ? filteredMaps.length - 1
                      : prev - 1
                    : null
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/75 hover:bg-[#FF5500] text-white border border-[#282a32] hover:border-[#FF5500] transition-all cursor-pointer shadow-xl hidden sm:flex items-center justify-center"
              title="Mapa anterior (←)"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() =>
                setActiveModalIndex((prev) =>
                  prev !== null
                    ? prev === filteredMaps.length - 1
                      ? 0
                      : prev + 1
                    : null
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/75 hover:bg-[#FF5500] text-white border border-[#282a32] hover:border-[#FF5500] transition-all cursor-pointer shadow-xl hidden sm:flex items-center justify-center"
              title="Siguiente mapa (→)"
            >
              <ChevronRight size={20} />
            </button>

            {/* Modal Content */}
            <div className="overflow-y-auto p-4 sm:p-8 space-y-6">
              {/* Large Map Image Banner */}
              <div className="relative h-64 sm:h-96 w-full rounded-xl overflow-hidden border border-[#282a32] shadow-2xl bg-black">
                <img
                  src={activeMap.image}
                  alt={activeMap.name}
                  className="w-full h-full object-cover filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-5 sm:p-7">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/80 text-[#FF5500] border border-[#FF5500]/40 backdrop-blur-md">
                      {activeMap.mode}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-wider drop-shadow-md">
                    {activeMap.name}
                  </h2>
                </div>
              </div>

              {/* Detailed Specs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-4 sm:p-5 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5500] block">
                    Reglas y Armamento Permitido
                  </span>
                  <p className="text-sm font-bold text-white">
                    {activeMap.weapons}
                  </p>
                  <p className="text-xs text-[#8d939e] pt-1 leading-relaxed">
                    {activeMap.description}
                  </p>
                </div>

                <div className="bg-[#1a1b1f] border border-[#282a32] rounded-xl p-4 sm:p-5 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Consejo Táctico del Mapa
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {activeMap.tacticalTip}
                  </p>
                </div>
              </div>

              {/* Mobile next/prev controls */}
              <div className="flex sm:hidden items-center justify-between gap-3 pt-2">
                <button
                  onClick={() =>
                    setActiveModalIndex((prev) =>
                      prev !== null
                        ? prev === 0
                          ? filteredMaps.length - 1
                          : prev - 1
                        : null
                    )
                  }
                  className="flex-1 py-2.5 bg-[#1a1b1f] border border-[#282a32] rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <button
                  onClick={() =>
                    setActiveModalIndex((prev) =>
                      prev !== null
                        ? prev === filteredMaps.length - 1
                          ? 0
                          : prev + 1
                        : null
                    )
                  }
                  className="flex-1 py-2.5 bg-[#FF5500] rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

