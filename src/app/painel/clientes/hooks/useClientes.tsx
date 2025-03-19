"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Cliente } from "@/app/types/Cliente";
import { getClientes, handleClienteStatus } from "@/app/api/clientes/action";
import { toast } from "sonner";

const LIMIT = 10;

export function useClientes() {
  const router = useRouter();
  const urlParams = new URLSearchParams(window.location.search); // Obtendo parâmetros da URL manualmente

  // 🛠️ Aplicando `useMemo` para evitar re-renderizações desnecessárias
  const currentPage = useMemo(() => Number(urlParams.get("page")) || 1, [urlParams]);
  const status = useMemo(() => urlParams.get("status"), [urlParams]);
  const message = useMemo(() => urlParams.get("message"), [urlParams]);

  const [clientList, setClientList] = useState<Cliente[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loadingStatus, setLoadingStatus] = useState<number | null>(null);

  const loadClientes = async () => {
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
  }, [currentPage, searchTerm]);

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
