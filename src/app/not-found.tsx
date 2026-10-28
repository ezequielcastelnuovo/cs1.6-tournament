import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#121316] text-white">
      <h2 className="text-4xl font-black text-[#FF5500] mb-2">404</h2>
      <p className="text-lg font-bold uppercase tracking-wider mb-4">
        Página no encontrada
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-[#FF5500] text-white rounded font-bold uppercase text-xs hover:bg-[#ff6b1a] transition-colors"
      >
        Volver al Torneo
      </Link>
    </div>
  );
}

