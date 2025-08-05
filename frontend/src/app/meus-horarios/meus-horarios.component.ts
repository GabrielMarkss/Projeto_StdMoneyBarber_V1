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
  menuAberto = false;
  mostrarNotificacoes = false;
  mostrarFormulario = false;
  mostrarFormularioEdicao = false;
  menuTimeout: any;
  notificacaoTimeout: any;
  dataHoje: string = '';
  notificacoes: Notificacao[] = [];
  agendamentos: (Agendamento & { servicosNomes?: string })[] = [];
  nova: Notificacao = {
    titulo: '',
    descricao: '',
    imagemUrl: '',
  };
  agendamentoEditando: Agendamento | null = null;
  imagemSelecionada: File | null = null;
  servicos: Servico[] = [];
  barbeiros: string[] = ['Felipe', 'Ezequiel', 'Sem Preferência'];
  diasSemana = [
    { nome: 'DOM', sigla: 'DOM', backend: 'SUNDAY' },
    { nome: 'SEG', sigla: 'SEG', backend: 'MONDAY' },
    { nome: 'TER', sigla: 'TER', backend: 'TUESDAY' },
    { nome: 'QUA', sigla: 'QUA', backend: 'WEDNESDAY' },
    { nome: 'QUI', sigla: 'QUI', backend: 'THURSDAY' },
    { nome: 'SEX', sigla: 'SEX', backend: 'FRIDAY' },
    { nome: 'SAB', sigla: 'SAB', backend: 'SATURDAY' },
  ];
  diaSelecionado = 'SEG';
  horarios: Horario[] = [];
  servicosSelecionados: number[] = [];
  barbeiroSelecionado: string = 'Sem Preferência';
  horarioSelecionado: string = '';
  dataSelecionada: string = '';

  constructor(
    public usuarioService: UsuarioService,
    private notificacaoService: NotificacaoService,
    private agendamentoService: AgendamentoService,
    private servicoService: ServicoService,
    private horarioService: HorarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
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

    if (this.usuarioService.isLoggedIn()) {
      const usuarioLogado = this.usuarioService.getUsuarioLogadoSnapshot();
      if (usuarioLogado && usuarioLogado.id) {
        this.usuarioService.nomeUsuario = usuarioLogado.nome;
        this.listarAgendamentos(usuarioLogado.id);
        this.carregarServicos();
        this.carregarHorarios();
      } else {
        this.usuarioService.getUsuarioLogado().subscribe({
          next: (user) => {
            if (user && user.id) {
              this.usuarioService.nomeUsuario = user.nome;
              this.listarAgendamentos(user.id);
              this.carregarServicos();
              this.carregarHorarios();
            } else {
              console.warn('Usuário retornado sem ID ou nulo:', user);
              this.router.navigate(['/login']);
            }
          },
          error: (err) => {
            console.error('Erro ao carregar usuário:', err);
            this.usuarioService.nomeUsuario = '';
            this.router.navigate(['/login']);
          },
        });
      }
      this.listarNotificacoes();
    } else {
      console.warn('Usuário não está logado. Redirecionando para login.');
      this.router.navigate(['/login']);
    }
  }

  abrirMenu() {
    clearTimeout(this.menuTimeout);
    this.menuAberto = true;
  }

  fecharMenu() {
    this.menuTimeout = setTimeout(() => {
      this.menuAberto = false;
    }, 150);
  }

  abrirNotificacao() {
    clearTimeout(this.notificacaoTimeout);
    this.mostrarNotificacoes = true;
  }

  fecharNotificacao() {
    this.notificacaoTimeout = setTimeout(() => {
      this.mostrarNotificacoes = false;
    }, 150);
  }

  abrirFormularioNotificacao() {
    this.mostrarFormulario = true;
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.nova = { titulo: '', descricao: '', imagemUrl: '' };
    this.imagemSelecionada = null;
  }

  abrirFormularioEdicao(agendamento: Agendamento & { servicosNomes?: string }) {
    this.agendamentoEditando = { ...agendamento };
    this.servicosSelecionados = agendamento.servicos || [];
    this.barbeiroSelecionado = agendamento.barbeiro || 'Sem Preferência';
    this.horarioSelecionado = agendamento.horario || '';
    const [dia, mes, ano] = agendamento.data.split('/');
    this.dataSelecionada = `${dia}/${mes}/${ano}`;
    this.diaSelecionado =
      this.diasSemana.find(
        (d) =>
          d.backend ===
          new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
            .toLocaleString('en-US', { weekday: 'long' })
            .toUpperCase()
      )?.sigla || 'SEG';
    this.carregarHorarios();
    this.mostrarFormularioEdicao = true;
  }

  cancelarFormularioEdicao() {
    this.mostrarFormularioEdicao = false;
    this.agendamentoEditando = null;
    this.servicosSelecionados = [];
    this.barbeiroSelecionado = 'Sem Preferência';
    this.horarioSelecionado = '';
    this.dataSelecionada = '';
  }

  salvarEdicao() {
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
      horario: this.horarioSelecionado,
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
        error: (err) => {
          console.error('Erro ao atualizar agendamento:', err);
          alert(
            'Erro ao atualizar agendamento: ' +
              (err.error?.message || err.message)
          );
        },
      });
  }

  confirmarRemocaoAgendamento(id: number) {
    if (!confirm('Você deseja cancelar este agendamento?')) return;
    const usuarioLogado = this.usuarioService.getUsuarioLogadoSnapshot();
    if (!usuarioLogado || !usuarioLogado.id) {
      alert('Erro: Usuário não identificado. Por favor, faça login novamente.');
      this.router.navigate(['/login']);
      return;
    }

    this.agendamentoService.deletar(id).subscribe({
      next: () => {
        alert('Agendamento cancelado com sucesso!');
        this.listarAgendamentos(usuarioLogado.id);
      },
      error: (err) => {
        console.error('Erro ao cancelar agendamento:', err);
        alert(
          'Erro ao cancelar agendamento: ' + (err.error?.message || err.message)
        );
      },
    });
  }

  toggleServico(servicoId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.servicosSelecionados = [...this.servicosSelecionados, servicoId];
    } else {
      this.servicosSelecionados = this.servicosSelecionados.filter(
        (id) => id !== servicoId
      );
    }
  }

  selecionarDia(dia: string) {
    this.diaSelecionado = dia;
    this.horarioSelecionado = '';
    this.carregarHorarios();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagemSelecionada = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.nova.imagemUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  salvarNotificacao() {
    if (this.nova.id) {
      this.notificacaoService.atualizar(this.nova.id, this.nova).subscribe({
        next: () => {
          this.cancelarFormulario();
          this.listarNotificacoes();
        },
        error: (err) =>
          alert('Erro ao atualizar notificação: ' + (err.error || err.message)),
      });
    } else {
      this.notificacaoService.criar(this.nova).subscribe({
        next: () => {
          this.cancelarFormulario();
          this.listarNotificacoes();
        },
        error: (err) =>
          alert('Erro ao criar notificação: ' + (err.error || err.message)),
      });
    }
  }

  listarNotificacoes() {
    this.notificacaoService.listar().subscribe({
      next: (res) => {
        this.notificacoes = res;
      },
      error: (err) => {
        console.error('Erro ao carregar notificações:', err);
        alert('Erro ao carregar notificações: ' + (err.error || err.message));
      },
    });
  }

  confirmarRemocao(notificacao: Notificacao) {
    if (!confirm('Você deseja remover esta notificação?')) return;
    const isAdmin = this.usuarioService.usuarioEhAdmin();
    this.notificacaoService.deletar(notificacao.id!, true, isAdmin).subscribe({
      next: () => this.listarNotificacoes(),
      error: (err) =>
        alert('Erro ao remover notificação: ' + (err.error || err.message)),
    });
  }

  editarNotificacao(n: Notificacao) {
    this.nova = { ...n };
    this.mostrarFormulario = true;
  }

  listarAgendamentos(usuarioId: number) {
    if (this.usuarioService.usuarioEhAdmin()) {
      this.agendamentoService.listarTodos().subscribe({
        next: (agendamentos) => {
          this.agendamentos = agendamentos.map((agendamento) => ({
            ...agendamento,
            data: this.formatarData(agendamento.data),
            horario: this.formatarHorario(agendamento.horario),
            servicos: agendamento.servicos,
          }));
          this.carregarNomesServicos();
        },
        error: (err) => {
          console.error('Erro ao carregar agendamentos:', err);
          alert('Erro ao carregar agendamentos: ' + (err.error || err.message));
        },
      });
    } else {
      this.agendamentoService.listarPorUsuario(usuarioId).subscribe({
        next: (agendamentos) => {
          this.agendamentos = agendamentos.map((agendamento) => ({
            ...agendamento,
            data: this.formatarData(agendamento.data),
            horario: this.formatarHorario(agendamento.horario),
            servicos: agendamento.servicos,
          }));
          this.carregarNomesServicos();
        },
        error: (err) => {
          console.error('Erro ao carregar agendamentos:', err);
          alert('Erro ao carregar agendamentos: ' + (err.error || err.message));
        },
      });
    }
  }

  formatarData(data: string): string {
    if (!data) return 'Não informada';
    if (data.includes('-')) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    return data; // Já está no formato DD/MM/YYYY
  }

  formatarHorario(horario: string): string {
    if (!horario) return 'Não informado';
    return horario.slice(0, 5); // Garante o formato HH:mm
  }

  carregarNomesServicos() {
    this.servicoService.listar().subscribe({
      next: (servicos) => {
        this.agendamentos = this.agendamentos.map((agendamento) => ({
          ...agendamento,
          servicosNomes: agendamento.servicos
            .map((id) => {
              const servico = servicos.find((s) => s.id === id);
              return servico ? servico.nome : 'Serviço desconhecido';
            })
            .filter((nome) => nome !== 'Serviço desconhecido')
            .join(', '),
        }));
      },
      error: (err) => {
        console.error('Erro ao carregar nomes dos serviços:', err);
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

  carregarServicos() {
    this.servicoService.listar().subscribe({
      next: (servicos) => {
        this.servicos = servicos;
      },
      error: (err) => {
        console.error('Erro ao carregar serviços:', err);
        alert('Erro ao carregar serviços: ' + (err.error || err.message));
      },
    });
  }

  carregarHorarios() {
    const dia = this.diasSemana.find((d) => d.sigla === this.diaSelecionado);
    if (!dia) return;
    this.horarioService.listar().subscribe({
      next: (res) => {
        this.horarios = res
          .filter((h) => h.diaSemana === dia.backend)
          .sort((a, b) => a.horario.localeCompare(b.horario));
      },
      error: (err) => {
        console.error('Erro ao carregar horários:', err);
        alert('Erro ao carregar horários: ' + (err.error || err.message));
      },
    });
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
}
