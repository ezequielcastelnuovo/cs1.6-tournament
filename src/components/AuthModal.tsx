"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Lock, UserPlus, LogIn, X, AlertCircle, Sparkles, Check } from "lucide-react";

const AVATAR_COLORS = [
  { name: "FaceIT Orange", color: "#FF5500" },
  { name: "Cyan Ice", color: "#06B6D4" },
  { name: "Emerald Green", color: "#10B981" },
  { name: "Purple Void", color: "#8B5CF6" },
  { name: "Electric Blue", color: "#3B82F6" },
  { name: "Crimson Red", color: "#EF4444" },
  { name: "Neon Pink", color: "#EC4899" },
  { name: "Gold Amber", color: "#F59E0B" },
];

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">(authModalMode);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FF5500");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep internal mode synced with authModalMode prop when opened
  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Por favor ingresa un nombre de usuario.");
      return;
    }

    if (!password) {
      setError("Por favor ingresa tu contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const res = await login(username.trim(), password);
        if (!res.success) {
          setError(res.error || "Usuario o contraseña inválidos.");
        } else {
          closeAuthModal();
        }
      } else {
        const res = await register(
          username.trim(),
          password,
          displayName.trim() || username.trim(),
          selectedColor
        );
        if (!res.success) {
          setError(res.error || "No se pudo registrar la cuenta.");
        } else {
          closeAuthModal();
        }
      }
    } catch (err: any) {
      setError(err.message || "Error inesperado al conectar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#141518] border border-[#282a32] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF5500] via-[#ff7a33] to-[#FF5500]" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8d939e] hover:text-white hover:bg-[#282a32] transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
              {mode === "login" ? <LogIn size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-white">
                {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta de Jugador"}
              </h2>
              <p className="text-xs text-[#8d939e]">
                {mode === "login"
                  ? "Accede a tu perfil y sincroniza tus stats"
                  : "Regístrate para participar en el torneo"}
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-[#0c0d0f] p-1 rounded-lg border border-[#282a32] mb-5">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                mode === "login"
                  ? "bg-[#282a32] text-white shadow-sm"
                  : "text-[#8d939e] hover:text-white"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                mode === "register"
                  ? "bg-[#282a32] text-white shadow-sm"
                  : "text-[#8d939e] hover:text-white"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d939e] mb-1.5">
                Usuario (Login)
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d939e]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. coldzera, s1mple"
                  autoComplete="username"
                  className="w-full bg-[#0c0d0f] border border-[#282a32] focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] text-white pl-10 pr-4 py-2.5 rounded-lg text-sm transition outline-none"
                />
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d939e] mb-1.5">
                  Tag / Nombre Visible en Torneo (Opcional)
                </label>
                <div className="relative">
                  <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d939e]" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ej. Marcelo 'coldzera' David"
                    className="w-full bg-[#0c0d0f] border border-[#282a32] focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] text-white pl-10 pr-4 py-2.5 rounded-lg text-sm transition outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d939e] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d939e]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-[#0c0d0f] border border-[#282a32] focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] text-white pl-10 pr-4 py-2.5 rounded-lg text-sm transition outline-none"
                />
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d939e] mb-2">
                  Color de Avatar
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {AVATAR_COLORS.map((item) => (
                    <button
                      key={item.color}
                      type="button"
                      onClick={() => setSelectedColor(item.color)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        selectedColor === item.color
                          ? "ring-2 ring-white scale-110"
                          : "opacity-75 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: item.color }}
                      title={item.name}
                    >
                      {selectedColor === item.color && <Check size={14} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-[#FF5500] hover:bg-[#ff6b1a] active:bg-[#e04b00] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-[#FF5500]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === "login" ? (
                <>
                  <LogIn size={16} />
                  <span>ENTRAR A MI CUENTA</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>CREAR CUENTA</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-4 text-center text-[11px] text-[#8d939e]">
            {mode === "login" ? (
              <>
                ¿Aún no tenés cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="text-[#FF5500] font-bold hover:underline"
                >
                  Registrate acá
                </button>
              </>
            ) : (
              <>
                ¿Ya tenés cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-[#FF5500] font-bold hover:underline"
                >
                  Iniciá sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
