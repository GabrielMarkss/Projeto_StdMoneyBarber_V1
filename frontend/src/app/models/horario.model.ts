export interface Horario {
  id?: number;
  diaSemana: string;
  horario: string;
  bloqueado: boolean;
  barbeiro?: string;
}
