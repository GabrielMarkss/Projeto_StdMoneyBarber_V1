export interface Agendamento {
  id?: number;
  usuarioId: number;
  barbeiro?: string | null;
  servicos: number[];
  data: string; // Formato: "YYYY-MM-DD"
  horario: string; // Formato: "HH:mm"
  subtotal: number;
  desconto: number;
  total: number;
  cupomNome?: string | null;
}
