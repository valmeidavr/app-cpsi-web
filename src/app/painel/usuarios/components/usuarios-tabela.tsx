"use client";

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
import { Edit, Eye, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useUsuarios } from "../hooks/useUsuarios";
import { Badge } from "@/components/ui/badge";

const UsuariosTabela = () => {
  const { loading, usuarioList } = useUsuarios();
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Pesquisar cliente"
          // value={searchTerm}
          // onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />

        <Button className="ml-auto" asChild>
          <Link href="/painel/usuarios/novo">
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Nível de Acesso</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarioList.map(
            (usuario) => (
              (
                <TableRow key={usuario.id}>
                  <TableCell>{usuario.id}</TableCell>
                  <TableCell>{usuario.nome}</TableCell>
                  <TableCell className="white-space: nowrap;">
                    <a href={`mailto:${usuario.email}`}>{usuario.email}</a>
                  </TableCell>
                  <TableCell className="white-space: nowrap;">
                    {usuario.grupos.map((g) => (
                      <div className="flex gap-2 align-middle items-center justify-between space-y-2" key={g.grupo.id}>
                        <h2 >{g.grupo.sistema.nome}:</h2>
                        <Badge >{g.grupo.nome}</Badge>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-2"
                      asChild
                    >
                      <Link href={`usuarios/editar/${usuario.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )
          )}
        </TableBody>
      </Table>
      {/* Modal de detalhes */}
    </div>
  );
};

export default UsuariosTabela;
