export interface Agendamento {
  id?: number;
  usuarioId: number;
  barbeiro: string | null;
  servicos: number[];
  data: string;
  horario: string;
  subtotal: number;
  desconto: number;
  total: number;
  cupomNome: string | null;
  status?: 'PENDENTE' | 'ATIVO' | 'FINALIZADO';
  horarioId?: number | null;
}
