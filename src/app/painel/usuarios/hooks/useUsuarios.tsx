"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getUsuarios } from "@/app/api/usuarios/action";
import { Usuario } from "@/app/types/Usuario";

const LIMIT = 10;

export function useUsuarios() {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status");
  const message = searchParams.get("message");

  const [usuarioList, setUsuarioList] = useState<Usuario[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");


  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const { data } = await getUsuarios(currentPage, LIMIT, searchTerm);
    
      setUsuarioList(data);
      setTotal(total);
      setTotalPages(totalPages);
    } catch (error) {
      console.error("Erro ao carregar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, [currentPage, searchTerm]);

  return {
    usuarioList,
    totalPages,
    total,
    loading,
    searchTerm,
    setSearchTerm,
    loadUsuarios,
  };
}
