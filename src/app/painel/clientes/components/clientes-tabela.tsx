"use client";
import { useState } from "react";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Plus, Edit, Eye,Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Cliente } from "@/app/types/Cliente";

interface ClienteTabelaProps {
  clientes: Cliente[];
  isLoading: boolean; // Tipando as props corretamente
}

const ClienteTabela = ({ clientes, isLoading }: ClienteTabelaProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  const handleSearch = () => {
    console.log("Searching for:", searchTerm);
  };

  // Tipando o parâmetro 'client' para evitar o erro
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
        <Button variant="secondary" onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" /> Pesquisar
        </Button>
        <Link href="/painel/clientes/novo" passHref>
          <Button className="ml-auto" asChild>
            <Link href={'clientes/novo'}>
              {" "}
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </Link>
          </Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <div className="flex justify-center items-center w-full h-full absolute inset-0 z-10 bg-white bg-opacity-50">
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </div>
          )}
          {clientes.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.id}</TableCell>
              <TableCell>{client.nome}</TableCell>
              <TableCell>{client.cpf}</TableCell>
              <TableCell>{client.telefone1}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewClient(client)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#">Anterior</PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#">Próximo</PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <p>
                <strong>Nome:</strong> {selectedClient.nome}
              </p>
              <p>
                <strong>CPF:</strong> {selectedClient.cpf}
              </p>
              <p>
                <strong>Telefone:</strong> {selectedClient.telefone1}
              </p>
              <p>
                <strong>Email:</strong> {selectedClient.email}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClienteTabela;
