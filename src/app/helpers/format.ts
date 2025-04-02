export const formatTelefone = (telefone: string) => {
  return telefone
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
};
export const formatCPF = (cpf: string) => {
  return cpf
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};


// Helper function to format phone number
export  const formatTelefoneInput = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo que não for número
    .replace(/^(\d{2})(\d)/, "($1) $2") // Adiciona parênteses no DDD
    .replace(/(\d{4,5})(\d{4})$/, "$1-$2") // Adiciona o traço
    .slice(0, 15); // Limita o tamanho máximo
};
export const formatCPFInput = (value: string) => {
  let cpf = value.replace(/\D/g, ""); // Remove tudo que não for número

  // Aplica a máscara XXX.XXX.XXX-XX
  if (cpf.length > 3) {
    cpf = cpf.replace(/^(\d{3})/, "$1.");
  }
  if (cpf.length > 6) {
    cpf = cpf.replace(/^(\d{3})\.(\d{3})/, "$1.$2.");
  }
  if (cpf.length > 9) {
    cpf = cpf.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, "$1.$2.$3-");
  }

  return cpf.slice(0, 14); // Garante que não passe de 14 caracteres
};
export const formatRGInput = (value: string) => {
  // Remove qualquer caractere não numérico
  let rawValue = value.replace(/\D/g, "");

  // Aplica a máscara do RG no formato XX.XXX.XXX-X
  if (rawValue.length <= 2) {
    return rawValue;
  } else if (rawValue.length <= 5) {
    return `${rawValue.slice(0, 2)}.${rawValue.slice(2)}`;
  } else if (rawValue.length <= 8) {
    return `${rawValue.slice(0, 2)}.${rawValue.slice(2, 5)}.${rawValue.slice(
      5
    )}`;
  } else {
    return `${rawValue.slice(0, 2)}.${rawValue.slice(2, 5)}.${rawValue.slice(
      5,
      8
    )}-${rawValue.slice(8, 9)}`;
  }
};