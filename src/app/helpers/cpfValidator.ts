/**
 * Validador de CPF com algoritmo de dígitos verificadores
 * Implementa a validação matemática completa do CPF brasileiro
 */

export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }
  
  // Calcula o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  const resto = soma % 11;
  const primeiroDigito = resto < 2 ? 0 : 11 - resto;
  
  // Verifica o primeiro dígito
  if (parseInt(cpfLimpo.charAt(9)) !== primeiroDigito) {
    return false;
  }
  
  // Calcula o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  const resto2 = soma % 11;
  const segundoDigito = resto2 < 2 ? 0 : 11 - resto2;
  
  // Verifica o segundo dígito
  if (parseInt(cpfLimpo.charAt(10)) !== segundoDigito) {
    return false;
  }
  
  return true;
}

/**
 * Formata CPF e valida ao mesmo tempo
 */
export function formatarEValidarCPF(cpf: string): { formatado: string; valido: boolean } {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const formatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const valido = validarCPF(cpfLimpo);
  
  return { formatado, valido };
}

/**
 * Gera um CPF válido para testes (não é um CPF real)
 */
export function gerarCPFValido(): string {
  // Gera os primeiros 9 dígitos aleatoriamente
  let cpf = '';
  for (let i = 0; i < 9; i++) {
    cpf += Math.floor(Math.random() * 10);
  }
  
  // Calcula o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  const resto = soma % 11;
  const primeiroDigito = resto < 2 ? 0 : 11 - resto;
  cpf += primeiroDigito;
  
  // Calcula o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  const resto2 = soma % 11;
  const segundoDigito = resto2 < 2 ? 0 : 11 - resto2;
  cpf += segundoDigito;
  
  // Formata o CPF
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
