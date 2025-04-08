export type SistemaComGrupos = {
  id: number;
  nome: string;
  grupos: {
    id: number;
    nome: string;
    sistemaId: number;
  }[];
};

export type Sistema = {
  nome: string;
};

export type Grupo = {
  id: number;
  nome: string;
  sistema: Sistema;
};

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  grupos: { grupo: Grupo }[];
};

