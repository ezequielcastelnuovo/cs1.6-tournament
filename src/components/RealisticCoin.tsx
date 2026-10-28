"use client";

import React from "react";

export type CoinSide = "cara" | "cruz";

interface RealisticCoinProps {
  side: CoinSide;
  size?: number;
  className?: string;
  showShadow?: boolean;
}

/**
 * Token / Moneda minimalista estilo FaceIT:
 * - Geometría limpia, bordes nítidos y paleta FaceIT (#141518, #282a32, #FF5500, #8d939e)
 * - CARA: Icono de usuario / perfil minimalista con acento naranja FaceIT
 * - CRUZ: Icono de aspa / cruz táctica minimalista con el mismo peso visual
 * - Adaptable perfectamente tanto a miniaturas (16px) como a tamaños grandes (120px)
 */
export function RealisticCoin({
  side,
  size = 96,
  className = "",
  showShadow = true,
}: RealisticCoinProps) {
  const isCara = side === "cara";
  const showLabel = size >= 48;

  // Colores FaceIT
  const accentColor = isCara ? "#FF5500" : "#ffffff";
  const borderColor = isCara ? "#FF5500" : "#3e424e";
  const bgBadge = isCara ? "rgba(255, 85, 0, 0.12)" : "rgba(255, 255, 255, 0.05)";

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none ${
        showShadow ? "drop-shadow-md" : ""
      } ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full block"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fondo principal circular FaceIT */}
        <circle cx="50" cy="50" r="46" fill="#141518" stroke={borderColor} strokeWidth="2.5" />

        {/* Anillo interior sutil */}
        <circle
          cx="50"
          cy="50"
          r="41"
          fill={bgBadge}
          stroke={borderColor}
          strokeWidth="0.75"
          strokeDasharray={isCara ? "none" : "3 3"}
          opacity="0.4"
        />

        {isCara ? (
          /* ================= CARA: Perfil / Avatar Minimalista ================= */
          <g transform={showLabel ? "translate(0, -5)" : "translate(0, 0)"}>
            {/* Cabeza */}
            <circle cx="50" cy="40" r="10.5" fill={accentColor} />
            {/* Hombros / Busto estilizado FaceIT */}
            <path
              d="M31 64.5 C31 54.5 39.5 49 50 49 C60.5 49 69 54.5 69 64.5 C69 65.5 68 66 67 66 L33 66 C32 66 31 65.5 31 64.5 Z"
              fill={accentColor}
            />
          </g>
        ) : (
          /* ================= CRUZ: Cruz Táctica Minimalista ================= */
          <g transform={showLabel ? "translate(0, -5)" : "translate(0, 0)"}>
            {/* Aspas / Cruz limpia con el mismo peso visual */}
            <line
              x1="34"
              y1="34"
              x2="66"
              y2="66"
              stroke={accentColor}
              strokeWidth="7"
              strokeLinecap="round"
            />
            <line
              x1="66"
              y1="34"
              x2="34"
              y2="66"
              stroke={accentColor}
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Detalle central FaceIT */}
            <circle cx="50" cy="50" r="3" fill="#141518" />
          </g>
        )}

        {/* Texto inferior de etiqueta solo visible en tamaños medianos/grandes */}
        {showLabel && (
          <text
            x="50"
            y="84"
            textAnchor="middle"
            fontSize="9"
            fontWeight="900"
            letterSpacing="1.8"
            fill={accentColor}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {isCara ? "CARA" : "CRUZ"}
          </text>
        )}
      </svg>
    </div>
  );
}

/**
 * Animación de lanzamiento 3D estilo FaceIT
 */
interface FlipCoin3DProps {
  isFlipping: boolean;
  result: CoinSide | null;
  size?: number;
}

export function FlipCoin3D({
  isFlipping,
  result,
  size = 110,
}: FlipCoin3DProps) {
  const finalRotation = result === "cruz" ? 2340 : 2160;

  return (
    <div
      style={{
        width: size,
        height: size,
        perspective: 900,
      }}
      className="relative mx-auto flex items-center justify-center select-none"
    >
      <div
        style={{
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          transform: isFlipping
            ? undefined
            : result
            ? `rotateY(${finalRotation}deg)`
            : "rotateY(0deg)",
        }}
        className={`relative w-full h-full ${
          isFlipping
            ? "coin-flipping-active"
            : "transition-transform duration-700 ease-out"
        }`}
      >
        {/* CARA (Front) */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
          className="flex items-center justify-center"
        >
          <RealisticCoin side="cara" size={size} />
        </div>

        {/* CRUZ (Back) */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          className="flex items-center justify-center"
        >
          <RealisticCoin side="cruz" size={size} />
        </div>
      </div>
    </div>
  );
}
