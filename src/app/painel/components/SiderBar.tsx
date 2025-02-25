"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  UserPlus,
  Users,
  Menu,
  DockIcon,
  BoxIcon,
  BookXIcon,
  GraduationCap,
  CalendarCheck,
} from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  subItems?: { icon: React.ElementType; label: string; href: string }[];
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      icon: DockIcon,
      label: "Cadastros",
      href: "#",
      subItems: [
        { icon: BoxIcon, label: "Procedimentos", href: "/painel/procedimentos" },
        { icon: BookXIcon, label: "Especialidades", href: "/painel/especialidades" },
        { icon: GraduationCap, label: "Turmas", href: "/painel/turmas" },
        { icon: CalendarCheck, label: "Expedientes", href: "/painel/expedientes" },
        { icon: Users, label: "Clientes", href: "/painel/clientes" },
      ],
    },
    {
      icon: Users,
      label: "Usuários",
      href: "#",
      subItems: [
        { icon: UserPlus, label: "Novo Usuário", href: "/painel/usuarios/novo" },
        { icon: Users, label: "Gerenciar Usuários", href: "/painel/usuarios" },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (collapsed) {
      return (
        <Popover key={index}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-center py-2 px-3 hover:bg-gray-800 transition-colors hover:text-white text-white"
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" className="w-56 p-0 bg-gray-900 border-gray-800">
            <div className="py-2">
              <Button
                variant="ghost"
                className="w-full justify-start py-2 px-3 text-left hover:bg-gray-800 transition-colors hover:text-white text-white"
              >
                <span>{item.label}</span>
              </Button>
              {item.subItems && (
                <div className="ml-3 mt-1 space-y-1">
                  {item.subItems.map((subItem, subIndex) => (
                    <Link key={subIndex} href={subItem.href} passHref>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start py-1 px-3 text-sm hover:bg-gray-800 transition-colors hover:text-white text-white",
                          pathname === subItem.href && "bg-gray-700"
                        )}
                      >
                        <subItem.icon className="h-4 w-4 mr-2" />
                        <span>{subItem.label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <div key={index} className="mb-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start py-2 px-3 text-left hover:bg-gray-800 transition-colors hover:text-white text-white",
            pathname === item.href && "bg-gray-800"
          )}
          onClick={() => setActiveItem(activeItem === item.label ? null : item.label)}
        >
          <item.icon className="h-5 w-5 mr-2" />
          <span>{item.label}</span>
          {item.subItems && (
            <ChevronRight
              className={cn("h-4 w-4 ml-auto transition-transform", activeItem === item.label && "rotate-90")}
            />
          )}
        </Button>
        {activeItem === item.label && item.subItems && (
          <div className="ml-6 mt-1 space-y-1">
            {item.subItems.map((subItem, subIndex) => (
              <Link key={subIndex} href={subItem.href} passHref>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start py-1 px-3 text-sm hover:bg-gray-800 transition-colors hover:text-white text-white",
                    pathname === subItem.href && "bg-gray-700"
                  )}
                >
                  <subItem.icon className="h-4 w-4 mr-2" />
                  <span>{subItem.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gray-900 text-gray-100 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed ? (
          <Link href="/painel" className="flex items-center">
            <Image src="/logotipo.svg" alt="Grupo AAP-VR" width={40} height={40} className="mr-2" />
            <span className="text-ml font-bold">AAP-VR / CPSI</span>
          </Link>
        ) : (
          <div className="w-8 h-8" /> // Placeholder para manter o espaçamento
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-gray-800 hover:text-white text-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-grow">
        <div className="px-3 py-2">{menuItems.map((item, index) => renderMenuItem(item, index))}</div>
      </ScrollArea>
    </div>
  );
}
