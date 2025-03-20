export type Usuario = {
  id: number;
  nome: string;
  email: string;
  grupos: Grupo[];
};

export type UsuarioPaginacao = {
  data: Usuario[];
  total: number = 10;
  page: number = 1;
  totalPages: number;
};

export type Grupo = {
  id: number;
  nome: string;
  sistemaId: number;
};

export type Sistema = {
  id: number;
  nome: string;
  grupos: Grupo[];
};
