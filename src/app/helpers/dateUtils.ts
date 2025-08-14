/**
 * Utilitários para padronizar o tratamento de datas e horários
 * Garante que todas as datas sejam salvas e exibidas no formato UTC correto
 */

/**
 * Converte uma data local para UTC ISO string
 * @param date - Data local
 * @param timeString - String de horário no formato "HH:MM"
 * @returns String ISO UTC
 */
export function localDateToUTCISO(date: Date, timeString?: string): string {
  if (timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      0,
      0
    );
    
    // Converte para UTC
    const utcDate = new Date(
      localDate.getTime() - localDate.getTimezoneOffset() * 60000
    );
    
    return utcDate.toISOString();
  }
  
  // Se não houver horário, apenas converte a data para UTC
  const utcDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  
  return utcDate.toISOString();
}

/**
 * Converte uma data UTC ISO string para data local
 * @param utcISOString - String ISO UTC
 * @returns Data local
 */
export function utcISOToLocalDate(utcISOString: string): Date {
  return new Date(utcISOString);
}

/**
 * Extrai apenas o horário (HH:MM) de uma data UTC ISO
 * @param utcISOString - String ISO UTC
 * @returns String de horário no formato "HH:MM"
 */
export function extractTimeFromUTCISO(utcISOString: string): string {
  const date = new Date(utcISOString);
  return date.toTimeString().slice(0, 5);
}

/**
 * Cria uma data UTC ISO a partir de uma data e horário específicos
 * @param year - Ano
 * @param month - Mês (1-12)
 * @param day - Dia (1-31)
 * @param hours - Horas (0-23)
 * @param minutes - Minutos (0-59)
 * @returns String ISO UTC
 */
export function createUTCISO(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
): string {
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const utcDate = new Date(
    localDate.getTime() - localDate.getTimezoneOffset() * 60000
  );
  return utcDate.toISOString();
}

/**
 * Formata uma data UTC ISO para exibição local
 * @param utcISOString - String ISO UTC
 * @param format - Formato desejado ('short', 'long', 'time')
 * @returns String formatada
 */
export function formatUTCISOForDisplay(
  utcISOString: string,
  format: 'short' | 'long' | 'time' = 'short'
): string {
  const date = new Date(utcISOString);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('pt-BR');
    case 'long':
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return date.toLocaleDateString('pt-BR');
  }
}

/**
 * Obtém a data atual em UTC ISO
 * @returns String ISO UTC da data atual
 */
export function getCurrentUTCISO(): string {
  return new Date().toISOString();
}

/**
 * Obtém apenas a data (sem horário) em UTC ISO
 * @param date - Data opcional, se não fornecida usa a data atual
 * @returns String ISO UTC apenas com a data
 */
export function getDateOnlyUTCISO(date?: Date): string {
  const targetDate = date || new Date();
  const utcDate = new Date(
    targetDate.getTime() - targetDate.getTimezoneOffset() * 60000
  );
  return utcDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
}

/**
 * Valida se uma string é uma data ISO válida
 * @param dateString - String para validar
 * @returns true se for uma data ISO válida
 */
export function isValidISOString(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Converte uma data para o formato MySQL datetime
 * @param date - Data para converter
 * @returns String no formato MySQL datetime
 */
export function toMySQLDateTime(date: Date): string {
  const utcDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return utcDate.toISOString().slice(0, 19).replace('T', ' ');
}
