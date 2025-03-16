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
  const params = useParams();

  useEffect(() => {
    if (typeof params?.id === "string") {
      loadClientes(params.id);
    } else if (Array.isArray(params?.id)) {
      loadClientes(params.id[0]);
    }
  }, [params]);
  const loadClientes = async (id: string) => {
    try {
      const clienteData = await getClienteById(Number(id));
      setCliente(clienteData);
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
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
      {cliente ? <FormUpdateCliente cliente={cliente} /> :  <div className="flex justify-center align-middle items-center h-screen"> <Loader2/></div>}
    </div>
  );
}
