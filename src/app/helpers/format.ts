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
export const formatValor = (valor: number | string) => {
  const numero = typeof valor === "string" ? parseFloat(valor) : valor;

  if (isNaN(numero)) return "R$ 0,00";

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

// Helper function to format phone number
export const formatTelefoneInput = (value: string) => {
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

export function formatDateAsUTC(dateInput: any) {
  const date = new Date(dateInput);

  // getTimezoneOffset() retorna a diferença em minutos entre UTC e o fuso local.
  // Ex: Para UTC-3, retorna 180.
  // Somamos esses minutos de volta à data para "cancelar" a conversão do fuso.
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

  // Agora podemos formatar a data com segurança
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Mês começa em 0
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}