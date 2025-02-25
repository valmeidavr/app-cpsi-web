"use client";

import { useState } from "react";
import Header from "@/app/painel/components/Header";
import Sidebar from "@/app/painel/components/SiderBar"; // Certifique-se do nome correto!

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false); // Estado do Sidebar

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar fixa na esquerda e responsiva */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Container do conteúdo */}
      <div className="flex flex-col flex-1 h-full overflow-y-auto">
        {/* Header fixo no topo */}
        <div className={`fixed top-0 transition-all duration-300 ${collapsed ? "left-16 w-[calc(100%-4rem)]" : "left-64 w-[calc(100%-16rem)]"} bg-white shadow-md z-50`}>
          <Header />
        </div>

        {/* Espaço para evitar sobreposição do Header */}
        <div className="mt-16 flex-1 p-6 flex justify-center items-start">
          <div className="bg-white shadow-lg rounded-lg p-8 w-11/12 max-w-6xl border border-gray-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
