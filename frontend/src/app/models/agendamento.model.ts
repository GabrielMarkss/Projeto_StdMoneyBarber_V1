export interface Agendamento {
  id?: number;
  diaSemana: string;  // ex: "MONDAY"
  horario: string;    // ex: "14:00"
  bloqueado: boolean;
}
