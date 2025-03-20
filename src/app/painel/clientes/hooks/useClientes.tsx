"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Cliente } from "@/app/types/Cliente";
import { getClientes, handleClienteStatus } from "@/app/api/clientes/action";
import { toast } from "sonner";

const LIMIT = 10;

export function useClientes() {
  const router = useRouter();
  
  // 🔹 Estado para armazenar os parâmetros da URL
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  // 🛠️ Obtendo os parâmetros da URL no client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);

  // 🔹 Aplicando `useMemo` para evitar re-renderizações desnecessárias
  const currentPage = useMemo(() => Number(searchParams?.get("page")) || 1, [searchParams]);
  const status = useMemo(() => searchParams?.get("status") || "", [searchParams]);
  const message = useMemo(() => searchParams?.get("message") || "", [searchParams]);

  const [clientList, setClientList] = useState<Cliente[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loadingStatus, setLoadingStatus] = useState<number | null>(null);

  const loadClientes = async () => {
    if (!searchParams) return; // ⚠️ Evita erro enquanto `searchParams` é `null`
    try {
      const { data, total, totalPages } = await getClientes(currentPage, LIMIT, searchTerm);
      setClientList(data);
      setTotal(total);
      setTotalPages(totalPages);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusCliente = async (clienteId: number) => {
    setLoadingStatus(clienteId);
    try {
      await handleClienteStatus(clienteId);
      const updatedClientList = clientList.map((client) =>
        +client.id === clienteId
          ? {
              ...client,
              status: client.status === "Ativo" ? "Inativo" : "Ativo",
            }
          : client
      );
      setClientList(updatedClientList);
      toast.success("Usuário atualizado com sucesso!", {
        style: {
          backgroundColor: "green",
          color: "white",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
      });
      loadClientes();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    } finally {
      setLoadingStatus(null);
    }
  };

  useEffect(() => {
    loadClientes();
  }, [currentPage, searchTerm, searchParams]);

  return {
    clientList,
    totalPages,
    total,
    loading,
    loadingStatus,
    searchTerm,
    setSearchTerm,
    atualizarStatusCliente,
    loadClientes,
  };
}
