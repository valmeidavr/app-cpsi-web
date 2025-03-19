"use client";
import { getClienteById } from "@/app/api/clientes/action";
import FormUpdateCliente from "./components/form-update-cliente";
import { useEffect, useState } from "react";
import { Cliente } from "@/app/types/Cliente";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Loader2 } from "lucide-react";

export default function CustomerUpdateForm() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      const clienteId = Array.isArray(params.id) ? params.id[0] : params.id;
      loadClientes(clienteId);
    }
  }, [params]);

  const loadClientes = async (id: string) => {
    try {
      setLoading(true);
      const clienteData = await getClienteById(Number(id));
      setCliente(clienteData);
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Clientes", href: "/painel/clientes" },
          { label: "Editar Cliente" }, // Último item sem link
        ]}
      />

      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
        </div>
      ) : (
        cliente && <FormUpdateCliente cliente={cliente} />
      )}
    </div>
  );
}
