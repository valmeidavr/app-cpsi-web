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
export const limparRG = (cpf: string): string => {
  return cpf.replace(/\D/g, "").slice(0, 11);
};
export const formatarTelefone = (telefone: string): string => {
  const numeros = telefone.replace(/\D/g, "");
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
      7
    )}`;
  } else if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(
      6
    )}`;
  } else {
    return numeros;
  }
};
export const formatarCPF = (cpf: string): string => {
  const numeros = cpf.replace(/\D/g, "");
  return numeros
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};