"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Key, User } from "lucide-react";
import { useState, useEffect } from "react";
import { getCookie, delCookie } from "@/util/cookies";
import { getPayload } from "@/util/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const [userName, setUserName] = useState<string>("Usuário");
  const [userEmail, setUserEmail] = useState<string>("usuario@exemplo.com");
  const router = useRouter();

  useEffect(() => {
    try {
      const accessToken = getCookie("accessToken"); 

      if (accessToken) {
        const payload = getPayload(accessToken); 

        setUserName(payload?.usuario?.nome || "Usuário");
        setUserEmail(payload?.usuario?.email || "usuario@exemplo.com");
      }
    } catch (error) {
      console.error("Erro ao obter dados do usuário:", error);
    }
  }, []);

  // 🔹 Função para Logout
  const handleLogout = () => {
    delCookie(); // Remove os cookies
    router.push("/"); // Redireciona para a página de login
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      <div className="flex items-center">
        {/* <h1 className="text-2xl font-bold text-gray-800">GRUPO AAP-VR</h1> */}
      </div>
      <div className="flex items-center space-x-4">
        {/* <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button> */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                {/* <AvatarImage src="/avatars/01.png" alt="@usuario" /> */}
                <AvatarFallback>
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <Link href="/painel/perfil">Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
