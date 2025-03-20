"use client";
import { useEffect, useState } from "react";
import { getUsuarios } from "@/app/api/usuarios/action";
import { Sistema, Usuario } from "@/app/types/Usuario";
import { http } from "@/util/http";

export function useUsuarios() {
  const [loading, setLoading] = useState<boolean>(false);
  const [usuarioList, setUsuarioList] = useState<Usuario[]>([]);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const response = await http.get("http://localhost:3000/users");
      const usuarios = response.data.data;
      console.log("usuarios:", usuarios);
      setUsuarioList(Array.isArray(usuarios) ? usuarios : []);
    } catch (error) {
      console.error("Erro ao carregar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
    async function fetchSistemas() {
      try {
        const { data } = await http.get("http://localhost:3000/sistemas");
        console.log("sistemas:", data);
        setSistemas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar sistemas:", error);
      }
    }
    fetchSistemas();
  }, []);

  return {
    usuarioList,
    loading,
    loadUsuarios,
    sistemas,
    setSistemas,
  };
}
