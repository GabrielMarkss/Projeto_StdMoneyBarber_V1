import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { UsuarioService } from '../service/usuario.service';
import { NotificacaoService } from '../service/notificacao.service';
import { ServicoService } from '../service/servico.service';
import { AgendamentoService } from '../service/agendamento.service';

import { Notificacao } from '../models/Notificacao.model';
import { Servico } from '../models/servico.model';
import { Agendamento } from '../models/agendamento.model';

@Component({
  selector: 'app-agendamento-felipe',
  templateUrl: './agendamento-felipe.component.html',
  styleUrls: ['./agendamento-felipe.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class AgendamentoFelipeComponent implements OnInit {
  dataHoje: string = '';

  // NAVBAR - notificações
  menuAberto = false;
  mostrarNotificacoes = false;
  mostrarFormulario = false;
  menuTimeout: any;
  notificacaoTimeout: any;
  notificacoes: Notificacao[] = [];
  nova: Notificacao = {
    titulo: '',
    descricao: '',
    imagemUrl: '',
  };
  imagemSelecionada: File | null = null;

  // SERVIÇOS
  servicos: Servico[] = [];
  servicosSelecionados: number[] = [];

  // BARBEIROS
  barbeiros: string[] = ['João', 'Pedro', 'Lucas'];
  barbeiroSelecionado: any = null;

  // CUPOM E VALORES
  cuponsDisponiveis = [
    { id: 1, nome: 'Fidelidade10', desconto: 10 },
    { id: 2, nome: 'Desconto20', desconto: 20 },
  ];
  cupomSelecionadoId: string = '';
  valorTotal: number = 0.0;
  descontoAplicado: number = 0.0;
  valorFinal: number = 0.0;

  // HORÁRIOS
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
  horarios: Agendamento[] = [];
  mostrarFormularioHorario = false;
  modoEdicao = false;
  horarioEditando: Agendamento | null = null;
  novoHorario: string = '';
  modoApagarHorario = false;
  horariosSelecionadosParaApagar = new Set<number>();

  // NOVOS campos para bloqueio
  selecionarTodos: boolean = false;
  horariosSelecionadosParaBloqueio = new Set<number>();

  constructor(
    public usuarioService: UsuarioService,
    private notificacaoService: NotificacaoService,
    private servicoService: ServicoService,
    private agendamentoService: AgendamentoService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const data = new Date();
    const dias = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
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
      this.usuarioService.getUsuarioLogado().subscribe({
        next: (user) => (this.usuarioService.nomeUsuario = user.nome),
        error: () => (this.usuarioService.nomeUsuario = ''),
      });
    }

    this.listarNotificacoes();
    this.carregarServicos();
    this.carregarHorarios();
  }

  abrirMenu() {
    clearTimeout(this.menuTimeout);
    this.menuAberto = true;
  }

  fecharMenu() {
    this.menuTimeout = setTimeout(() => (this.menuAberto = false), 150);
  }

  abrirNotificacao() {
    clearTimeout(this.notificacaoTimeout);
    this.mostrarNotificacoes = true;
  }

  fecharNotificacao() {
    this.notificacaoTimeout = setTimeout(
      () => (this.mostrarNotificacoes = false),
      150
    );
  }

  abrirFormularioNotificacao() {
    this.mostrarFormulario = true;
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.nova = { titulo: '', descricao: '', imagemUrl: '' };
    this.imagemSelecionada = null;
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
      this.notificacaoService
        .atualizar(this.nova.id, this.nova)
        .subscribe(() => {
          this.cancelarFormulario();
          this.listarNotificacoes();
        });
    } else {
      this.notificacaoService.criar(this.nova).subscribe(() => {
        this.cancelarFormulario();
        this.listarNotificacoes();
      });
    }
  }

  listarNotificacoes() {
    this.notificacaoService
      .listar()
      .subscribe((res) => (this.notificacoes = res));
  }

  editarNotificacao(n: Notificacao) {
    this.nova = { ...n };
    this.mostrarFormulario = true;
  }

  confirmarRemocao(notificacao: Notificacao) {
    if (!confirm('Você deseja remover esta notificação?')) return;
    const isAdmin = this.usuarioService.usuarioEhAdmin();
    this.notificacaoService.deletar(notificacao.id!, true, isAdmin).subscribe({
      next: () => this.listarNotificacoes(),
      error: (err) => alert(err.error || 'Erro ao remover notificação'),
    });
  }

  carregarServicos() {
    this.servicoService.listar().subscribe((res) => (this.servicos = res));
  }

  toggleServico(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.servicosSelecionados.push(id);
    else
      this.servicosSelecionados = this.servicosSelecionados.filter(
        (s) => s !== id
      );
    this.atualizarValores();
  }

  onCupomChange() {
    this.atualizarValores();
  }

  atualizarValores() {
    this.valorTotal = this.servicos
      .filter((s) => this.servicosSelecionados.includes(s.id!))
      .reduce((total, s) => total + (s.preco || 0), 0);
    const cupom = this.cuponsDisponiveis.find(
      (c) => c.id === Number(this.cupomSelecionadoId)
    );
    this.descontoAplicado = cupom
      ? (this.valorTotal * cupom.desconto) / 100
      : 0;
    this.valorFinal = this.valorTotal - this.descontoAplicado;
  }

  confirmarAgendamento() {
    const agendamento = {
      servicosSelecionados: this.servicosSelecionados,
      barbeiro: this.barbeiroSelecionado,
      cupomId: this.cupomSelecionadoId,
      valorTotal: this.valorTotal,
      desconto: this.descontoAplicado,
      valorFinal: this.valorFinal,
    };
    console.log('Agendamento confirmado:', agendamento);
    alert('Agendamento confirmado com sucesso!');
  }

  selecionarDia(dia: string) {
    this.diaSelecionado = dia;
    this.carregarHorarios();
  }

  carregarHorarios() {
    const dia = this.diasSemana.find((d) => d.sigla === this.diaSelecionado);
    if (!dia) return;
    this.agendamentoService.listarPorDia(dia.backend).subscribe((res) => {
      this.horarios = res.sort((a, b) => a.horario.localeCompare(b.horario));
      // Limpa seleção para bloqueio ao trocar dia
      this.horariosSelecionadosParaBloqueio.clear();
      this.selecionarTodos = false;
    });
  }

  ativarModoApagar() {
    this.modoApagarHorario = !this.modoApagarHorario;
    if (this.modoApagarHorario) {
      this.horariosSelecionadosParaApagar.clear();
    }
  }

  apagarHorarioSelecionado(h: Agendamento) {
    if (this.horariosSelecionadosParaApagar.has(h.id!)) {
      this.horariosSelecionadosParaApagar.delete(h.id!);
    } else {
      this.horariosSelecionadosParaApagar.add(h.id!);
    }
  }

  confirmarApagarHorarios() {
    if (!this.horariosSelecionadosParaApagar.size) return;
    if (!confirm('Confirma a exclusão dos horários selecionados?')) return;
    const ids = Array.from(this.horariosSelecionadosParaApagar);
    this.agendamentoService.deletarVarios(ids).subscribe(() => {
      this.horariosSelecionadosParaApagar.clear();
      this.carregarHorarios();
    });
  }

  // Clique para bloquear horários — só funciona para admins, não no modo apagar
  clicarHorario(h: Agendamento) {
    if (this.modoApagarHorario) {
      this.apagarHorarioSelecionado(h);
      return;
    }

    if (this.usuarioService.usuarioEhAdmin()) {
      // Só seleciona para bloqueio se não estiver bloqueado
      if (this.horariosSelecionadosParaBloqueio.has(h.id!)) {
        this.horariosSelecionadosParaBloqueio.delete(h.id!);
      } else if (!h.bloqueado) {
        this.horariosSelecionadosParaBloqueio.add(h.id!);
      }
    }
  }

  toggleSelecionarTodos() {
    this.horariosSelecionadosParaBloqueio.clear();

    if (this.selecionarTodos) {
      this.horarios.forEach((h) => {
        if (!h.bloqueado) {
          this.horariosSelecionadosParaBloqueio.add(h.id!);
        }
      });
    }
  }

  bloquearHorariosSelecionados() {
    if (this.horariosSelecionadosParaBloqueio.size === 0) return;

    const ids = Array.from(this.horariosSelecionadosParaBloqueio);

    if (!confirm('Confirma o bloqueio dos horários selecionados?')) return;

    this.agendamentoService.bloquearHorarios(ids).subscribe({
      next: () => {
        this.carregarHorarios();
        this.horariosSelecionadosParaBloqueio.clear();
        this.selecionarTodos = false;
      },
      error: (err) => {
        alert('Erro ao bloquear horários: ' + (err.error || err.message));
        this.carregarHorarios();
      },
    });
  }

  criarHorario() {
    const dia = this.diasSemana.find((d) => d.sigla === this.diaSelecionado);
    if (!dia || !this.novoHorario) return;
    const novo: Agendamento = {
      diaSemana: dia.backend,
      horario: this.novoHorario,
      bloqueado: false,
      disponivel: true,
    };
    this.agendamentoService.criar(novo).subscribe(() => {
      this.novoHorario = '';
      this.mostrarFormularioHorario = false;
      this.carregarHorarios();
    });
  }

  editarHorario() {
    if (!this.horarioEditando || !this.novoHorario) return;

    const atualizado: Agendamento = {
      ...this.horarioEditando,
      horario: this.novoHorario,
    };

    this.agendamentoService.editar(atualizado).subscribe(() => {
      this.cancelarFormularioHorario();
      this.carregarHorarios();
    });
  }

  abrirFormularioHorario() {
    this.modoEdicao = false;
    this.horarioEditando = null;
    this.novoHorario = '';
    this.mostrarFormularioHorario = true;
  }

  abrirFormularioEditarHorario(h: Agendamento) {
    this.modoEdicao = true;
    this.horarioEditando = h;
    this.novoHorario = h.horario;
    this.mostrarFormularioHorario = true;
  }

  cancelarFormularioHorario() {
    this.mostrarFormularioHorario = false;
    this.novoHorario = '';
    this.horarioEditando = null;
    this.modoEdicao = false;
  }

  obterHorariosPorPeriodo(periodo: 'manha' | 'tarde' | 'noite') {
    const filtro = {
      manha: (h: string) => h >= '06:00' && h < '12:00',
      tarde: (h: string) => h >= '12:00' && h < '18:00',
      noite: (h: string) => h >= '18:00' || h < '06:00',
    };
    return this.horarios.filter((h) => filtro[periodo](h.horario));
  }

  formatarHorario(horario: string): string {
    return horario.slice(0, 5);
  }
}
