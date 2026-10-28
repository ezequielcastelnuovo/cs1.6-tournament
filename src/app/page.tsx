"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import BracketGenerator from "@/components/BracketGenerator";
import MapVeto from "@/components/MapVeto";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"bracket" | "veto">("bracket");

  return (
    <>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1">
        {activeTab === "bracket" ? <BracketGenerator /> : <MapVeto />}
      </main>
    </>
  );
}
