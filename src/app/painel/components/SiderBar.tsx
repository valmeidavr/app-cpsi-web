"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCookie } from "@/util/cookies";
import menuData from "@/data/menu.json";
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
  LockKeyhole,
  HandshakeIcon,
  TableIcon,
  LockKeyholeIcon,
  HousePlus,
  Wrench,
  DollarSign,
  ClipboardList,
  LayoutList,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

// Mapeia os ícones para serem usados dinamicamente
const iconMap: { [key: string]: React.ElementType } = {
  DockIcon,
  BoxIcon,
  BookXIcon,
  GraduationCap,
  CalendarCheck,
  Users,
  UserPlus,
  LockKeyhole,
  HandshakeIcon,
  TableIcon,
  LockKeyholeIcon,
  HousePlus,
  Wrench,
  DollarSign,
  ClipboardList,
  LayoutList,
};

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  requiredGroups?: string[]; // Adicione essa linha
  subItems?: {
    icon: React.ElementType;
    label: string;
    href: string;
    requiredGroups?: string[]; // Adicione aqui também para os subitens
  }[];
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const pathname = usePathname();
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    const groups = getCookie("userGroups");

    if (groups) {
      try {
        setUserGroups(JSON.parse(groups).map((group: any) => group.nome));
      } catch (e) {
        console.error("Erro ao parsear grupos do usuário", e);
      }
    }
  }, []);

  useEffect(() => {
    // Carrega os itens do menu e converte os ícones para componentes React
    const parsedMenu = menuData.map((item) => ({
      ...item,
      icon: iconMap[item.icon], // Mapeia o ícone principal
      subItems: item.subItems
        ? item.subItems.map((subItem) => ({
            ...subItem,
            icon: iconMap[subItem.icon], // Mapeia os ícones dos subitens
          }))
        : [],
    }));

    setMenuItems(parsedMenu);
  }, []);

  const hasAccess = (requiredGroups?: string[]) => {
    if (!requiredGroups || requiredGroups.length === 0) return true;
    return requiredGroups.some((group) => userGroups.includes(group));
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.requiredGroups && !hasAccess(item.requiredGroups)) return null; // Esconde o item se houver requiredGroups e o usuário não tiver acesso.

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
          <PopoverContent
            side="right"
            className="w-56 p-0 bg-gray-900 border-gray-800"
          >
            <div className="py-2">
              <Button
                variant="ghost"
                className="w-full justify-start py-2 px-3 text-left hover:bg-gray-800 transition-colors hover:text-white text-white"
              >
                <span>{item.label}</span>
              </Button>
              {item.subItems &&
                item.subItems.some(
                  (subItem) =>
                    subItem.requiredGroups && hasAccess(subItem.requiredGroups)
                ) && (
                  <div className="ml-3 mt-1 space-y-1">
                    {item.subItems.map((subItem, subIndex) =>
                      subItem.requiredGroups &&
                      hasAccess(subItem.requiredGroups) ? (
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
                      ) : null
                    )}
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
          onClick={() =>
            setActiveItem(activeItem === item.label ? null : item.label)
          }
        >
          <item.icon className="h-5 w-5 mr-2" />
          <span>{item.label}</span>
          {item.subItems && (
            <ChevronRight
              className={cn(
                "h-4 w-4 ml-auto transition-transform",
                activeItem === item.label && "rotate-90"
              )}
            />
          )}
        </Button>
        {activeItem === item.label &&
          item.subItems &&
          item.subItems.some(
            (subItem) =>
              subItem.requiredGroups && hasAccess(subItem.requiredGroups)
          ) && (
            <div className="ml-6 mt-1 space-y-1">
              {item.subItems.map((subItem, subIndex) =>
                subItem.requiredGroups && hasAccess(subItem.requiredGroups) ? (
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
                ) : null
              )}
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
            <Image
              src="/logotipo.svg"
              alt="Grupo AAP-VR"
              width={40}
              height={40}
              className="mr-5"
            />
            <span className="text-ml font-bold">AAP-VR / CPSI</span>
          </Link>
        ) : (
          <div className=" h-8" /> // Placeholder para manter o espaçamento
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
        <div className="px-3 py-2">
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </div>
      </ScrollArea>
    </div>
  );
}
