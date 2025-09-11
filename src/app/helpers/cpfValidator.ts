
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    return false;
  }
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  const resto = soma % 11;
  const primeiroDigito = resto < 2 ? 0 : 11 - resto;
  if (parseInt(cpfLimpo.charAt(9)) !== primeiroDigito) {
    return false;
  }
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  const resto2 = soma % 11;
  const segundoDigito = resto2 < 2 ? 0 : 11 - resto2;
  if (parseInt(cpfLimpo.charAt(10)) !== segundoDigito) {
    return false;
  }
  return true;
}
export function formatarEValidarCPF(cpf: string): { formatado: string; valido: boolean } {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const formatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const valido = validarCPF(cpfLimpo);
  return { formatado, valido };
}
export function gerarCPFValido(): string {
  let cpf = '';
  for (let i = 0; i < 9; i++) {
    cpf += Math.floor(Math.random() * 10);
  }
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  const resto = soma % 11;
  const primeiroDigito = resto < 2 ? 0 : 11 - resto;
  cpf += primeiroDigito;
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  const resto2 = soma % 11;
  const segundoDigito = resto2 < 2 ? 0 : 11 - resto2;
  cpf += segundoDigito;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}