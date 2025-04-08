export type Prestador = {
  id: number;
  status: string;
  nome: string;
  rg: string;
  cpf: string;
  sexo?: string | null;
  dtnascimento?: Date | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  telefone?: string | null;
  celular?: string | null;
  complemento?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  Alocacao: any[]; 
  Turma: any[]; 
  Agenda: any[];
};
