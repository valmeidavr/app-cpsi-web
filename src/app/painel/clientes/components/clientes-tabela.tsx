"use client";
//Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

//Icone
import { Search, Plus, Edit, Eye, Loader2, EyeOff } from "lucide-react";

//React
import Link from "next/link";
import { useState } from "react";

//Type
import { Cliente } from "@/app/types/Cliente";

//hook
import { useClientes } from "../hooks/useClientes";

//Helpers
import { formatCPF, formatTelefone } from "@/app/helpers/format";

const ClienteTabela = () => {
  const {
    clientList,
    loading,
    loadingStatus,
    searchTerm,
    setSearchTerm,
    atualizarStatusCliente,
  } = useClientes();
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  const handleViewClient = (client: Cliente) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Pesquisar cliente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />

        <Button className="ml-auto" asChild>
          <Link href="/painel/clientes/novo">
            <Plus className=" h-4 w-4" />
            Novo
          </Link>
        </Button>
      </div>

      {/* Carregando... */}
      {loading && (
        <div className="flex justify-center items-center w-full h-full absolute inset-0 z-10 bg-white bg-opacity-50">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando...
        </div>
      )}

      {/* Tabela de clientes */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientList.map((client) => (
            <TableRow
              key={client.id}
              className={
                client.status === "Inativo"
                  ? "bg-red-100 border-l-4 border-red-500 line-through"
                  : ""
              }
            >
              <TableCell>{client.id}</TableCell>
              <TableCell>{client.nome}</TableCell>
              <TableCell className="white-space: nowrap;">
                {formatCPF(client.cpf)}
              </TableCell>
              <TableCell className="white-space: nowrap;">
                <a
                  href={`https://wa.me/55${client.telefone1.replace(
                    /\D/g,
                    ""
                  )}`}
                >
                  {formatTelefone(client.telefone1)}
                </a>
              </TableCell>
              <TableCell className="white-space: nowrap;">
                <a href={`mailto:${client.email}`}>{client.email}</a>
              </TableCell>
              <TableCell>
                {client.status === "Inativo" ? (
                  <span className="text-red-500 font-semibold">Inativo</span>
                ) : (
                  <span className="text-green-500 font-semibold">Ativo</span>
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="mr-2" asChild>
                  <Link href={`clientes/editar/${client.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewClient(client)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => atualizarStatusCliente(+client.id)}
                >
                  {loadingStatus === +client.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal de detalhes */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="p-6 bg-white rounded-lg shadow-lg max-w-lg mx-auto">
          {/* Header */}
          <DialogHeader className="bg-primary p-4 rounded-t-lg">
            <DialogTitle className="text-white font-semibold text-base">
              Detalhes do Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="mx-1 text-">
            {selectedClient && (
              <div className="space-y-4 mt-4">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Nome:</span>
                  <span className="text-gray-900">{selectedClient.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">CPF:</span>
                  <span className="text-gray-900">
                    {formatCPF(selectedClient.cpf) || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Telefone:</span>
                  <span className="text-gray-900">
                    {formatTelefone(selectedClient.telefone1) ||
                      "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">
                    Segundo Telefone:
                  </span>
                  <span className="text-gray-900">
                    {(selectedClient.telefone2 &&
                      formatTelefone(selectedClient.telefone2)) ||
                      "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Email:</span>
                  <span className="text-gray-900">
                    {selectedClient.email || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Status:</span>
                  <span
                    className={`${
                      selectedClient.status === "Ativo"
                        ? "text-green-500"
                        : "text-red-500"
                    } font-semibold`}
                  >
                    {selectedClient.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Sexo:</span>
                  <span className="text-gray-900">
                    {selectedClient.sexo || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Cep:</span>
                  <span className="text-gray-900">
                    {selectedClient.cep || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Logradouro:</span>
                  <span className="text-gray-900">
                    {selectedClient.logradouro || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Bairro:</span>
                  <span className="text-gray-900">
                    {selectedClient.bairro || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Número:</span>
                  <span className="text-gray-900">
                    {selectedClient.numero || "Não informado"}
                  </span>
                </div>{" "}
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">Cidade:</span>
                  <span className="text-gray-900">
                    {selectedClient.cidade || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">UF:</span>
                  <span className="text-gray-900">
                    {selectedClient.uf || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-700">
                    Data Nascimento:
                  </span>
                  <span className="text-gray-900">
                    {selectedClient.dtnascimento || "Não informado"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClienteTabela;
