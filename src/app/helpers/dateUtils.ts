
export function localDateToUTCISO(date: Date, timeString?: string): string {
  if (timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    // Construir string ISO diretamente sem usar construtor Date que aplica timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hoursStr}:${minutesStr}:00.000Z`;
  }
  
  // Para datas sem horário
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}T00:00:00.000Z`;
}
export function utcISOToLocalDate(utcISOString: string): Date {
  return new Date(utcISOString);
}
export function extractTimeFromUTCISO(utcISOString: string): string {
  const date = new Date(utcISOString);
  return date.toTimeString().slice(0, 5);
}
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
export function getCurrentUTCISO(): string {
  return new Date().toISOString();
}
export function getDateOnlyUTCISO(date?: Date): string {
  const targetDate = date || new Date();
  const utcDate = new Date(
    targetDate.getTime() - targetDate.getTimezoneOffset() * 60000
  );
  return utcDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
}
export function isValidISOString(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
export function toMySQLDateTime(date: Date): string {
  const utcDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return utcDate.toISOString().slice(0, 19).replace('T', ' ');
}