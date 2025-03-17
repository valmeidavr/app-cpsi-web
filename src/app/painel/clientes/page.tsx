"use client";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ClienteTabela from "./components/clientes-tabela";
import Pagination from "@/components/paginacao";
import { useClientes } from "./hooks/useClientes";

export default function Clientes() {
  const { totalPages } = useClientes();

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Clientes" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Clientes</h1>

      <ClienteTabela />
      <section className="flex justify-center mt-4 mb-8">
        <Pagination
          currentPage={1}
          totalPages={totalPages}
          destination="/painel/clientes"
        />
      </section>
    </div>
  );
}
