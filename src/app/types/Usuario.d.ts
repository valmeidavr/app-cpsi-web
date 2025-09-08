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
  id: number;
  nome: string;
  nivel?: string;
};
export type Grupo = {
  id: number;
  nome: string;
  sistema: Sistema;
};
export type Usuario = {
  id?: number;
  login: string;
  nome: string;
  email: string;
  status?: string;
  sistemas?: Sistema[];
  grupos?: string[];
};