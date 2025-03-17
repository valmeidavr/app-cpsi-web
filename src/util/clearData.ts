export const limparCEP = (cep: string): string => {
  return cep.replace(/\D/g, "").slice(0, 8);
};


export const limparTelefone = (telefone: string): string => {
  return telefone.replace(/\D/g, "").slice(0, 11); 
};

export const limparDataNascimento = (dtnascimento: string): string => {
  const data = new Date(dtnascimento);
  return !isNaN(data.getTime()) ? data.toISOString().split("T")[0] : ""; 
};

export const limparCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, "").slice(0, 11); 
};