"use client";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ClienteTabela from "./components/clientes-tabela";
import { getClientes } from "@/app/api/clientes/action";
import { useEffect, useState } from "react";
import { Cliente } from "@/app/types/Cliente";

export default function Clientes() {
  const [loading, setLoading] = useState<boolean>(false);
  const [clientList, setClientList] = useState<Cliente[]>([]);
  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const { data } = await getClientes();
      setClientList(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Clientes" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Clientes</h1>

      <ClienteTabela clientes={clientList} isLoading={loading} />
    </div>
  );
}
