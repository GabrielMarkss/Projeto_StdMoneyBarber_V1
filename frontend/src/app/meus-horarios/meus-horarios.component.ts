import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../service/usuario.service';
import { NotificacaoService } from '../service/notificacao.service';
import { AgendamentoService } from '../service/agendamento.service';
import { ServicoService } from '../service/servico.service';
import { HorarioService } from '../service/horario.service';
import { Notificacao } from '../models/Notificacao.model';
import { Agendamento } from '../models/agendamento.model';
import { Servico } from '../models/servico.model';
import { Horario } from '../models/horario.model';

@Component({
  selector: 'app-meus-horarios',
  templateUrl: './meus-horarios.component.html',
  styleUrls: ['./meus-horarios.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class MeusHorariosComponent implements OnInit {
  // ======== PROPRIEDADES GERAIS ========
  menuAberto = false;
  mostrarNotificacoes = false;
  mostrarFormulario = false;
  mostrarFormularioEdicao = false;
  menuTimeout: any;
  notificacaoTimeout: any;
  dataHoje: string = '';
  notificacoes: Notificacao[] = [];
  nova: Notificacao = { titulo: '', descricao: '', imagemUrl: '' };
  imagemSelecionada: File | null = null;

  // ======== AGENDAMENTOS ========
  agendamentos: (Agendamento & { servicosNomes?: string })[] = [];
  agendamentoEditando: Agendamento | null = null;

  // ======== SERVIÇOS ========
  servicos: Servico[] = [];
  servicosSelecionados: number[] = [];

  // ======== BARBEIROS E HORARIOS ========
  barbeiros: string[] = ['Felipe', 'Ezequiel', 'Sem Preferência'];
  dataSelecionada: string = '';
  horarios: Horario[] = [];
  barbeiroSelecionado: string = 'Sem Preferência';
  horarioSelecionado: string = '';
  mostrarMenuMobile = false;

  constructor(
    public usuarioService: UsuarioService,
    private notificacaoService: NotificacaoService,
    private agendamentoService: AgendamentoService,
    private servicoService: ServicoService,
    private horarioService: HorarioService,
    private router: Router
  ) {}

  // ======== INICIALIZAÇÃO ========
  ngOnInit(): void {
    this.inicializarDataHoje();
    if (this.usuarioService.isLoggedIn()) {
      const usuarioLogado = this.usuarioService.getUsuarioLogadoSnapshot();
      if (usuarioLogado && usuarioLogado.id) {
        this.usuarioService.nomeUsuario = usuarioLogado.nome;
        this.listarAgendamentos(usuarioLogado.id);
        this.carregarServicos();
      } else {
        this.usuarioService.getUsuarioLogado().subscribe({
          next: (user) => {
            if (user && user.id) {
              this.usuarioService.nomeUsuario = user.nome;
              this.listarAgendamentos(user.id);
              this.carregarServicos();
            } else {
              this.router.navigate(['/login']);
            }
          },
          error: () => this.router.navigate(['/login']),
        });
      }
      this.listarNotificacoes();
    } else {
      this.router.navigate(['/login']);
    }
  }

  inicializarDataHoje(): void {
    const data = new Date();
    const dias = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    const meses = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    this.dataHoje = `${dias[data.getDay()]}, ${data.getDate()} ${
      meses[data.getMonth()]
    } ${data.getFullYear()}`;
    this.dataSelecionada = `${data.getFullYear()}-${String(
      data.getMonth() + 1
    ).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }

  // ======== NAVEGAÇÃO ========
  abrirMenu(): void {
    clearTimeout(this.menuTimeout);
    this.menuAberto = true;
  }

  fecharMenu() {
    this.menuTimeout = setTimeout(() => (this.menuAberto = false), 150);
  }

  abrirMenuMobile() {
    this.mostrarMenuMobile = true;
  }

  fecharMenuMobile(event?: MouseEvent) {
    if (event && event.target) {
      const target = event.target as HTMLElement;
      // Verifica se o clique foi fora do menu-mobile-content
      if (
        target.classList.contains('menu-mobile-popup') &&
        !target.closest('.menu-mobile-content')
      ) {
        this.mostrarMenuMobile = false;
      }
    }
  }

  logout() {
    this.usuarioService.logout();
    this.fecharMenuMobile();
    this.router.navigate(['/']);
  }
  abrirNotificacao(): void {
    clearTimeout(this.notificacaoTimeout);
    this.mostrarNotificacoes = true;
  }

  fecharNotificacao(): void {
    this.notificacaoTimeout = setTimeout(
      () => (this.mostrarNotificacoes = false),
      150
    );
  }

  // ======== NOTIFICAÇÕES ========
  abrirFormularioNotificacao(): void {
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.nova = { titulo: '', descricao: '', imagemUrl: '' };
    this.imagemSelecionada = null;
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imagemSelecionada = file;
      const reader = new FileReader();
      reader.onload = () => (this.nova.imagemUrl = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  salvarNotificacao(): void {
    const action = this.nova.id
      ? this.notificacaoService.atualizar(this.nova.id, this.nova)
      : this.notificacaoService.criar(this.nova);
    action.subscribe({
      next: () => {
        this.cancelarFormulario();
        this.listarNotificacoes();
      },
      error: (err) =>
        alert('Erro ao salvar notificação: ' + (err.error || err.message)),
    });
  }

  listarNotificacoes(): void {
    this.notificacaoService.listar().subscribe({
      next: (res) => (this.notificacoes = res),
      error: (err) =>
        alert('Erro ao carregar notificações: ' + (err.error || err.message)),
    });
  }

  editarNotificacao(n: Notificacao): void {
    this.nova = { ...n };
    this.mostrarFormulario = true;
  }

  confirmarRemocao(notificacao: Notificacao): void {
    if (!confirm('Você deseja remover esta notificação?')) return;
    this.notificacaoService
      .deletar(notificacao.id!, true, this.usuarioService.usuarioEhAdmin())
      .subscribe({
        next: () => this.listarNotificacoes(),
        error: (err) =>
          alert('Erro ao remover notificação: ' + (err.error || err.message)),
      });
  }

  // ======== AGENDAMENTOS ========
  listarAgendamentos(usuarioId: number): void {
    const action = this.usuarioService.usuarioEhAdmin()
      ? this.agendamentoService.listarTodos()
      : this.agendamentoService.listarPorUsuario(usuarioId);
    action.subscribe({
      next: (agendamentos) => {
        this.agendamentos = agendamentos.map((agendamento) => ({
          ...agendamento,
          data: this.formatarData(agendamento.data),
          horario: this.formatarHorario(agendamento.horario),
          servicos: agendamento.servicos,
        }));
        this.carregarNomesServicos();
      },
      error: (err) =>
        alert('Erro ao carregar agendamentos: ' + (err.error || err.message)),
    });
  }

  abrirFormularioEdicao(
    agendamento: Agendamento & { servicosNomes?: string }
  ): void {
    this.agendamentoEditando = { ...agendamento };
    this.servicosSelecionados = agendamento.servicos || [];
    this.barbeiroSelecionado = agendamento.barbeiro || 'Sem Preferência';
    this.horarioSelecionado = agendamento.horario || '';
    this.dataSelecionada = agendamento.data.split('/').reverse().join('-');
    this.carregarHorarios();
    this.mostrarFormularioEdicao = true;
  }

  cancelarFormularioEdicao(): void {
    this.mostrarFormularioEdicao = false;
    this.agendamentoEditando = null;
    this.servicosSelecionados = [];
    this.barbeiroSelecionado = 'Sem Preferência';
    this.horarioSelecionado = '';
    this.dataSelecionada = '';
  }

  salvarEdicao(): void {
    if (!this.agendamentoEditando || !this.agendamentoEditando.id) {
      alert('Erro: Agendamento inválido para edição.');
      return;
    }
    const usuarioLogado = this.usuarioService.getUsuarioLogadoSnapshot();
    if (!usuarioLogado || !usuarioLogado.id) {
      alert('Erro: Usuário não identificado. Por favor, faça login novamente.');
      this.router.navigate(['/login']);
      return;
    }
    if (
      !this.servicosSelecionados.length ||
      !this.dataSelecionada ||
      !this.horarioSelecionado
    ) {
      alert('Por favor, selecione serviços, data e horário.');
      return;
    }
    const agendamentoAtualizado: Agendamento = {
      id: this.agendamentoEditando.id,
      usuarioId: this.agendamentoEditando.usuarioId,
      barbeiro:
        this.barbeiroSelecionado === 'Sem Preferência'
          ? null
          : this.barbeiroSelecionado,
      servicos: this.servicosSelecionados,
      data: this.dataSelecionada,
      horario: this.formatarHoraParaBackend(this.horarioSelecionado),
      subtotal: this.calcularSubtotal(),
      desconto: this.agendamentoEditando.desconto,
      total: this.calcularSubtotal() - this.agendamentoEditando.desconto,
      cupomNome: this.agendamentoEditando.cupomNome,
    };
    this.agendamentoService
      .atualizar(this.agendamentoEditando.id, agendamentoAtualizado)
      .subscribe({
        next: () => {
          alert('Agendamento atualizado com sucesso!');
          this.cancelarFormularioEdicao();
          this.listarAgendamentos(usuarioLogado.id);
        },
        error: (err) =>
          alert(
            'Erro ao atualizar agendamento: ' +
              (err.error?.message || err.message)
          ),
      });
  }

  confirmarRemocaoAgendamento(id: number): void {
    if (!confirm('Você deseja cancelar este agendamento?')) return;
    const usuarioLogado = this.usuarioService.getUsuarioLogadoSnapshot();
    if (!usuarioLogado || !usuarioLogado.id) {
      alert('Erro: Usuário não identificado. Por favor, faça login novamente.');
      this.router.navigate(['/login']);
      return;
    }
    // Find the appointment to get its date and time
    const agendamento = this.agendamentos.find((a) => a.id === id);
    if (!agendamento) {
      alert('Erro: Agendamento não encontrado.');
      return;
    }
    this.agendamentoService.deletar(id).subscribe({
      next: () => {
        // Unblock the corresponding time slot
        this.horarioService
          .listarDisponiveis(
            agendamento.data.split('/').reverse().join('-'),
            agendamento.barbeiro || 'Sem Preferência'
          )
          .subscribe({
            next: (horarios) => {
              const horario = horarios.find(
                (h) => h.horario === agendamento.horario && h.bloqueado
              );
              if (horario && horario.id) {
                this.horarioService
                  .desbloquearHorarios([horario.id])
                  .subscribe({
                    next: () => {
                      alert(
                        'Agendamento cancelado e horário desbloqueado com sucesso!'
                      );
                      this.listarAgendamentos(usuarioLogado.id);
                    },
                    error: (err) =>
                      alert(
                        'Erro ao desbloquear horário: ' +
                          (err.error || err.message)
                      ),
                  });
              } else {
                alert('Agendamento cancelado com sucesso!');
                this.listarAgendamentos(usuarioLogado.id);
              }
            },
            error: (err) =>
              alert(
                'Erro ao verificar horários: ' + (err.error || err.message)
              ),
          });
      },
      error: (err) =>
        alert(
          'Erro ao cancelar agendamento: ' + (err.error?.message || err.message)
        ),
    });
  }
  // ======== SERVIÇOS ========
  carregarServicos(): void {
    this.servicoService.listar().subscribe({
      next: (servicos) => (this.servicos = servicos),
      error: (err) =>
        alert('Erro ao carregar serviços: ' + (err.error || err.message)),
    });
  }

  toggleServico(servicoId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.servicosSelecionados = input.checked
      ? [...this.servicosSelecionados, servicoId]
      : this.servicosSelecionados.filter((id) => id !== servicoId);
  }

  carregarNomesServicos(): void {
    this.servicoService.listar().subscribe({
      next: (servicos) => {
        this.agendamentos = this.agendamentos.map((agendamento) => ({
          ...agendamento,
          servicosNomes: agendamento.servicos
            .map(
              (id) =>
                servicos.find((s) => s.id === id)?.nome ||
                'Serviço desconhecido'
            )
            .filter((nome) => nome !== 'Serviço desconhecido')
            .join(', '),
        }));
      },
      error: (err) => {
        this.agendamentos = this.agendamentos.map((agendamento) => ({
          ...agendamento,
          servicosNomes:
            agendamento.servicos.length > 0
              ? agendamento.servicos.join(', ')
              : 'Nenhum serviço',
        }));
      },
    });
  }

  // ======== HORARIOS ========
  carregarHorarios(): void {
    if (!this.dataSelecionada) return;
    this.horarioService
      .listarDisponiveis(this.dataSelecionada, this.barbeiroSelecionado)
      .subscribe({
        next: (res) => {
          this.horarios = res.sort((a, b) =>
            a.horario.localeCompare(b.horario)
          );
        },
        error: (err) =>
          alert('Erro ao carregar horários: ' + (err.error || err.message)),
      });
  }

  // ======== UTILITÁRIOS ========
  formatarData(data: string): string {
    if (!data) return 'Não informada';
    if (data.includes('-')) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    return data;
  }

  formatarHorario(horario: string): string {
    return horario ? horario.slice(0, 5) : 'Não informado';
  }

  formatarHoraParaBackend(hora: string): string {
    const [h, m] = hora.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
  }

  calcularSubtotal(): number {
    return this.servicos
      .filter((s) => this.servicosSelecionados.includes(s.id!))
      .reduce((acc, s) => acc + (s.preco || 0), 0);
  }

  obterNomesServicos(
    agendamento: Agendamento & { servicosNomes?: string }
  ): string {
    return agendamento.servicosNomes || 'Nenhum serviço';
  }

  corStatus(status: string): string {
    switch (status) {
      case 'PENDENTE':
        return 'orange';
      case 'ATIVO':
        return 'green';
      case 'FINALIZADO':
        return 'blue';
      default:
        return 'black';
    }
  }

  isEditableOrCancelable(
    status: string,
    data: string,
    horario: string
  ): boolean {
    // Admins can cancel/edit at any time if status is PENDENTE or ATIVO
    if (this.usuarioService.usuarioEhAdmin()) {
      return status === 'PENDENTE' || status === 'ATIVO';
    }

    // Regular users can only cancel/edit if more than 60 minutes remain
    const agora = new Date();
    const [dia, mes, ano] = data.split('/').map(Number);
    const [hora, minuto] = horario.split(':').map(Number);
    const dataAgendamento = new Date(ano, mes - 1, dia, hora, minuto);
    if (status === 'PENDENTE' || status === 'ATIVO') {
      const diffMinutes =
        (dataAgendamento.getTime() - agora.getTime()) / (1000 * 60);
      return diffMinutes > 60; // Regular users need at least 60 minutes
    }
    return false;
  }
}
