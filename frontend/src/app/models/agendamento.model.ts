export interface Agendamento {
  id?: number;
  diaSemana: string; // "SEGUNDA", "TERCA", etc.
  horario: string; // formato "HH:mm"
  bloqueado: boolean;
  disponivel: boolean;
}
