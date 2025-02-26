"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Plus, Edit, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

// Definir o tipo para Cliente
interface Client {
  id: number
  name: string
  cpf: string
  phone: string
  email: string
}

// Mock data para demonstração (agora tipado corretamente)
const mockClients: Client[] = [
    { id: 1, name: "João Silva", cpf: "123.456.789-00", phone: "(11) 98765-4321", email: "joao@example.com" },
    { id: 2, name: "Maria Santos", cpf: "987.654.321-00", phone: "(21) 91234-5678", email: "maria@example.com" },
    { id: 3, name: "Carlos Pereira", cpf: "456.789.123-00", phone: "(31) 99876-5432", email: "carlos@example.com" },
    { id: 4, name: "Ana Oliveira", cpf: "321.654.987-00", phone: "(41) 98711-2233", email: "ana@example.com" },
    { id: 5, name: "Fernando Costa", cpf: "654.321.987-00", phone: "(51) 93456-7890", email: "fernando@example.com" },
    { id: 6, name: "Beatriz Lima", cpf: "741.852.963-00", phone: "(61) 91234-5678", email: "beatriz@example.com" },
    { id: 7, name: "Gabriel Souza", cpf: "852.963.741-00", phone: "(71) 97654-3210", email: "gabriel@example.com" },
    { id: 8, name: "Juliana Mendes", cpf: "963.741.852-00", phone: "(81) 91122-3344", email: "juliana@example.com" },
    { id: 9, name: "Ricardo Alves", cpf: "159.753.852-00", phone: "(91) 90011-2233", email: "ricardo@example.com" },
    { id: 10, name: "Camila Rocha", cpf: "357.951.456-00", phone: "(11) 99887-7766", email: "camila@example.com" }
  ];
  

export default function ClientList() {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null) // Agora tipado corretamente

  const handleSearch = () => {
    console.log("Searching for:", searchTerm)
  }

  // Tipando o parâmetro 'client' para evitar o erro
  const handleViewClient = (client: Client) => {
    setSelectedClient(client)
    setIsViewModalOpen(true)
  }

  return (
    <div className="container mx-auto">

       <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Clientes" }, // Último item sem link
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Clientes</h1>

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
          <Button className="ml-auto">
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
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
          {mockClients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.id}</TableCell>
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.cpf}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleViewClient(client)}>
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
                <strong>Nome:</strong> {selectedClient.name}
              </p>
              <p>
                <strong>CPF:</strong> {selectedClient.cpf}
              </p>
              <p>
                <strong>Telefone:</strong> {selectedClient.phone}
              </p>
              <p>
                <strong>Email:</strong> {selectedClient.email}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
