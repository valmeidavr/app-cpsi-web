"use client";
import { useState, useEffect } from "react";
import Header from "@/app/painel/components/Header";
import Sidebar from "@/app/painel/components/SiderBar";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      
      setIsMobile(mobile);
      
      // Sempre colapsa em mobile, sempre expande em desktop
      if (mobile) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    // Verificação inicial
    if (typeof window !== 'undefined') {
      checkScreenSize();
    }
    
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Overlay */}
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        isMobile={isMobile}
      />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-x-hidden">
        {/* Header - Full Width */}
        <div className="sticky top-0 bg-white shadow-md z-30 w-full">
          <Header />
        </div>
        
        {/* Content */}
        <div className="flex-1 p-2 sm:p-3 md:p-6 overflow-x-hidden">
          <div className="bg-white shadow-lg rounded-lg p-2 sm:p-3 md:p-6 lg:p-8 w-full mx-auto border border-gray-300 overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}