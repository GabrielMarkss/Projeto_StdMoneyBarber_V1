import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Cupom } from '../models/cupom.model'

import { UsuarioService } from '../service/usuario.service';
import { NotificacaoService } from '../service/notificacao.service';
import { ServicoService } from '../service/servico.service';
import { AgendamentoService } from '../service/agendamento.service';

import { Notificacao } from '../models/Notificacao.model';
import { Servico } from '../models/servico.model';
import { Agendamento } from '../models/agendamento.model';

@Component({
  selector: 'app-agendamento-ezequiel',
  templateUrl: './agendamento-ezequiel.component.html',
  styleUrls: ['./agendamento-ezequiel.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class AgendamentoEzequielComponent implements OnInit {
  // ==== PROPRIEDADES / VARIÁVEIS ====
  dataHoje: string = '';

  menuAberto = false;
  mostrarNotificacoes = false;
  mostrarFormulario = false;
  menuTimeout: any;
  notificacaoTimeout: any;
  notificacoes: Notificacao[] = [];
  nova: Notificacao = { titulo: '', descricao: '', imagemUrl: '' };
  imagemSelecionada: File | null = null;

  servicos: Servico[] = [];
  servicosSelecionados: number[] = [];

  barbeiros: string[] = ['João', 'Pedro', 'Lucas'];
  barbeiroSelecionado: any = null;

  // ---- CUPOM ----
  cuponsDisponiveis: Cupom[] = [
    {
      id: 1,
      codigo: 'FIDELIDADE10',
      nome: 'Cupom de serviço',
      descricao: 'Este cupom de fidelidade te dá o direito a um serviço gratuito...',
      desconto: 10,
      imagem: 'assets/cupom.png'
    },
    {
      id: 2,
      codigo: 'DESCONTO20',
      nome: 'Cupom de serviço',
      descricao: 'Este cupom de fidelidade te dá o direito a um serviço gratuito...',
      desconto: 20,
      imagem: 'assets/cupom.png'
    }
  ];

  codigoCupom: string = '';          // <- conteúdo do input
  cupomSelecionadoId: string = '';

  valorTotal: number = 0.0;
  descontoAplicado: number = 0.0;
  valorFinal: number = 0.0;

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

  selecionarTodos: boolean = false;
  horariosSelecionadosParaBloqueio = new Set<number>();
  horariosSelecionadosParaDesbloqueio = new Set<number>();
  horarioSelecionadoCliente: Agendamento | null = null;

  periodos: ('manha' | 'tarde' | 'noite')[] = ['manha', 'tarde', 'noite'];

  // RESUMO AGENDAMENTO
  resumo = {
    barbeiro: 'Ezequiel',
    servicos: [] as Servico[],
    dataHora: '',
    subtotal: 0,
    desconto: 0,
    total: 0,
    pagamento: '',
    cupomNome: ''
  };

  // Forma de pagamento
  formasPagamento = ['Crédito', 'Débito', 'Pix', 'Dinheiro'];
  formaPagamentoSelecionada = 'Pix';

  // POPUPS
  mostrarPopupCupom = false;
  mostrarPopupPagamento = false;
  mostrarPopupCartao = false;

  cartao = {
    nome: '',
    numero: '',
    validade: '',
    cvv: ''
  };

  // ==== CONSTRUTOR ====
  constructor(
    public usuarioService: UsuarioService,
    private notificacaoService: NotificacaoService,
    private servicoService: ServicoService,
    private agendamentoService: AgendamentoService,
    private fb: FormBuilder
  ) { }

  // ==== CICLO DE VIDA ====
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
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez',
    ];
    this.dataHoje = `${dias[data.getDay()]}, ${data.getDate()} ${meses[data.getMonth()]} ${data.getFullYear()}`;

    // Definir dia selecionado para filtro de horários
    const hojeNum = data.getDay(); // 0=Domingo
    if (hojeNum === 0) {
      this.diaSelecionado = 'SEG'; // domingo abre segunda
    } else {
      const mappingDiaNumeroParaSigla = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
      this.diaSelecionado = mappingDiaNumeroParaSigla[hojeNum];
    }

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

  // ==== MENU ====
  abrirMenu() {
    clearTimeout(this.menuTimeout);
    this.menuAberto = true;
  }

  fecharMenu() {
    this.menuTimeout = setTimeout(() => (this.menuAberto = false), 150);
  }

  // ==== NOTIFICAÇÕES ====
  abrirNotificacao() {
    clearTimeout(this.notificacaoTimeout);
    this.mostrarNotificacoes = true;
  }

  fecharNotificacao() {
    this.notificacaoTimeout = setTimeout(() => (this.mostrarNotificacoes = false), 150);
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
      this.notificacaoService.atualizar(this.nova.id, this.nova).subscribe(() => {
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
    this.notificacaoService.listar().subscribe((res) => (this.notificacoes = res));
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

  // ==== SERVIÇOS ====
  carregarServicos() {
    this.servicoService.listar().subscribe((res) => (this.servicos = res));
  }

  toggleServico(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.servicosSelecionados.push(id);
    else this.servicosSelecionados = this.servicosSelecionados.filter((s) => s !== id);
    this.atualizarValores();
  }

  onCupomChange() {
    this.atualizarValores();
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

  // ==== DIAS E HORÁRIOS ====
  selecionarDia(dia: string) {
    this.diaSelecionado = dia;
    this.carregarHorarios();
  }

  carregarHorarios() {
    const dia = this.diasSemana.find((d) => d.sigla === this.diaSelecionado);
    if (!dia) return;
    this.agendamentoService.listar().subscribe((res) => {
      this.horarios = res
        .filter((h) => h.diaSemana === dia.backend)
        .sort((a, b) => a.horario.localeCompare(b.horario));
      this.horariosSelecionadosParaBloqueio.clear();
      this.horariosSelecionadosParaDesbloqueio.clear();
      this.selecionarTodos = false;
    });
  }

  // ==== MODO APAGAR HORÁRIO ====
  ativarModoApagar(): void {
    this.modoApagarHorario = !this.modoApagarHorario;
    this.horariosSelecionadosParaApagar.clear();
    this.selecionarTodos = false;
  }

  apagarHorariosSelecionados(): void {
    const todosSelecionados = [
      ...this.horariosSelecionadosParaBloqueio,
      ...this.horariosSelecionadosParaDesbloqueio,
    ];

    if (todosSelecionados.length === 0) {
      alert('Nenhum horário selecionado para apagar.');
      return;
    }

    if (!confirm('Tem certeza que deseja apagar os horários selecionados?')) return;

    this.agendamentoService.deletarHorarios(todosSelecionados).subscribe({
      next: () => {
        alert('Horários apagados com sucesso!');
        this.carregarHorarios();
      },
      error: (err) => {
        alert('Erro ao apagar horários: ' + (err.error || err.message));
        this.carregarHorarios();
      }
    });

    this.horariosSelecionadosParaBloqueio.clear();
    this.horariosSelecionadosParaDesbloqueio.clear();
    this.selecionarTodos = false;
  }

  // ==== SELEÇÃO DE HORÁRIOS PARA BLOQUEIO/DESBLOQUEIO ====
  clicarHorario(h: Agendamento) {
    if (this.usuarioService.usuarioEhAdmin()) {
      if (!h.bloqueado) {
        if (this.horariosSelecionadosParaBloqueio.has(h.id!)) {
          this.horariosSelecionadosParaBloqueio.delete(h.id!);
        } else {
          this.horariosSelecionadosParaBloqueio.add(h.id!);
          this.horariosSelecionadosParaDesbloqueio.delete(h.id!);
        }
      } else {
        if (this.horariosSelecionadosParaDesbloqueio.has(h.id!)) {
          this.horariosSelecionadosParaDesbloqueio.delete(h.id!);
        } else {
          this.horariosSelecionadosParaDesbloqueio.add(h.id!);
          this.horariosSelecionadosParaBloqueio.delete(h.id!);
        }
      }
    }
  }

  // ==== EXECUTAR BLOQUEIO/DESBLOQUEIO ====
  executarAcaoBloqueio() {
    if (this.horariosSelecionadosParaBloqueio.size > 0) {
      if (!confirm('Confirma o bloqueio dos horários selecionados?')) return;
      const ids = Array.from(this.horariosSelecionadosParaBloqueio);
      this.agendamentoService.bloquearHorarios(ids).subscribe({
        next: () => {
          this.carregarHorarios();
          this.horariosSelecionadosParaBloqueio.clear();
          this.horariosSelecionadosParaDesbloqueio.clear();
          this.selecionarTodos = false;
        },
        error: (err) => {
          alert('Erro ao bloquear horários: ' + (err.error || err.message));
          this.carregarHorarios();
        },
      });
    } else if (this.horariosSelecionadosParaDesbloqueio.size > 0) {
      if (!confirm('Confirma o desbloqueio dos horários selecionados?')) return;
      const ids = Array.from(this.horariosSelecionadosParaDesbloqueio);
      this.agendamentoService.desbloquearHorarios(ids).subscribe({
        next: () => {
          this.carregarHorarios();
          this.horariosSelecionadosParaDesbloqueio.clear();
          this.horariosSelecionadosParaBloqueio.clear();
          this.selecionarTodos = false;
        },
        error: (err) => {
          alert('Erro ao desbloquear horários: ' + (err.error || err.message));
          this.carregarHorarios();
        },
      });
    } else {
      alert('Nenhum horário selecionado para bloquear ou desbloquear.');
    }
  }

  toggleSelecionarTodos() {
    this.horariosSelecionadosParaBloqueio.clear();
    this.horariosSelecionadosParaDesbloqueio.clear();

    if (this.selecionarTodos) {
      this.horarios.forEach(h => {
        if (!h.bloqueado) this.horariosSelecionadosParaBloqueio.add(h.id!);
        else this.horariosSelecionadosParaDesbloqueio.add(h.id!);
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

  desbloquearHorariosSelecionados() {
    if (this.horariosSelecionadosParaDesbloqueio.size === 0) return;
    const ids = Array.from(this.horariosSelecionadosParaDesbloqueio);
    if (!confirm('Confirma o desbloqueio dos horários selecionados?')) return;
    this.agendamentoService.desbloquearHorarios(ids).subscribe({
      next: () => {
        this.carregarHorarios();
        this.horariosSelecionadosParaDesbloqueio.clear();
        this.selecionarTodos = false;
      },
      error: (err) => {
        alert('Erro ao desbloquear horários: ' + (err.error || err.message));
        this.carregarHorarios();
      },
    });
  }

  // ==== FORMULÁRIO DE HORÁRIO ====
  private formatarHoraParaBackend(horario: string): string {
    if (!horario) return '00:00:00';
    if (horario.length === 5) return horario + ':00';
    return horario;
  }

  criarHorario() {
    if (!this.novoHorario || !this.diaSelecionado) return;

    const horaFormatada = this.formatarHoraParaBackend(this.novoHorario);

    const diasUteis = this.diasSemana.filter(d => d.sigla !== 'DOM').map(d => d.sigla);

    this.agendamentoService.listar().subscribe(todosHorarios => {
      const horariosParaCriar = diasUteis
        .filter(diaSigla => {
          const diaBackend = this.diasSemana.find(d => d.sigla === diaSigla)?.backend || 'MONDAY';
          return !todosHorarios.some(h => h.diaSemana === diaBackend && h.horario === horaFormatada);
        })
        .map(diaSigla => {
          return {
            diaSemana: this.diasSemana.find(d => d.sigla === diaSigla)?.backend || 'MONDAY',
            horario: horaFormatada,
            bloqueado: false,
          };
        });

      if (horariosParaCriar.length === 0) {
        alert('Este horário já existe em todos os dias disponíveis.');
        this.cancelarFormularioHorario();
        return;
      }

      horariosParaCriar.forEach(horario => {
        this.agendamentoService.criar(horario).subscribe(() => {
        });
      });

      setTimeout(() => this.carregarHorarios(), 500);

      this.cancelarFormularioHorario();
    });
  }


  editarHorario() {
    if (!this.horarioEditando || !this.novoHorario) return;

    const atualizado: Agendamento = {
      ...this.horarioEditando,
      horario: this.formatarHoraParaBackend(this.novoHorario),
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

  // ==== FILTROS DE HORÁRIOS POR PERÍODO ====
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

  // RESUMO AGENGAMENTO
  abrirPopupCupom() {
    this.mostrarPopupCupom = true;
  }

  // Selecionar cupom no pop-up
  selecionarCupomPopup(cupom: Cupom | null) {
    if (cupom) {
      this.cupomSelecionadoId = String(cupom.id);
      this.resumo.cupomNome = cupom.nome;
    } else {
      this.cupomSelecionadoId = '';
      this.resumo.cupomNome = '';
    }
    this.mostrarPopupCupom = false;
    this.atualizarValores();
  }


  // Abrir pop-up de forma de pagamento
  abrirPopupPagamento() {
    this.mostrarPopupPagamento = true;
  }

  fecharPopupPagamento(event: MouseEvent) {
    // Fecha o popup
    this.mostrarPopupPagamento = false;
  }
  fecharPopupCupom(event: MouseEvent) {
    this.mostrarPopupCupom = false;
  }

  // Selecionar forma de pagamento no pop-up
  selecionarFormaPagamento(forma: string) {
    this.formaPagamentoSelecionada = forma;
    this.resumo.pagamento = forma;
    this.mostrarPopupPagamento = false;
  }

  atualizarValores() {
    const selecionados = this.servicos.filter(s => this.servicosSelecionados.includes(s.id!));
    this.resumo.servicos = selecionados;

    this.valorTotal = selecionados.reduce((acc, s) => acc + (s.preco || 0), 0);
    this.resumo.subtotal = this.valorTotal;

    const cupom = this.cuponsDisponiveis.find(c => c.id === +this.cupomSelecionadoId);
    this.descontoAplicado = cupom ? (this.valorTotal * cupom.desconto) / 100 : 0;
    this.resumo.desconto = this.descontoAplicado;

    this.valorFinal = this.valorTotal - this.descontoAplicado;
    this.resumo.total = this.valorFinal;
  }

  // Quando o cliente clicar em um horário para selecionar
  selecionarHorarioCliente(horario: Agendamento) {
    this.horarioSelecionadoCliente = horario; // <- ESSA LINHA FALTAVA

    const hoje = new Date();
    const diaMap: { [key: string]: number } = {
      'DOM': 0, 'SEG': 1, 'TER': 2, 'QUA': 3, 'QUI': 4, 'SEX': 5, 'SAB': 6,
    };

    const diasExtenso = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const diaSemanaNumero = diaMap[this.diaSelecionado];

    const dataSelecionada = new Date(hoje);
    const distancia = (diaSemanaNumero + 7 - hoje.getDay()) % 7;
    dataSelecionada.setDate(hoje.getDate() + distancia);

    const dia = String(dataSelecionada.getDate()).padStart(2, '0');
    const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
    const diaExtenso = diasExtenso[dataSelecionada.getDay()];
    const hora = this.formatarHorario(horario.horario);

    this.resumo.dataHora = `${diaExtenso}, ${dia}/${mes} às ${hora}`;
  }

  confirmar() {
    const agendamentoFinal = {
      barbeiro: this.resumo.barbeiro,
      servicos: this.resumo.servicos.map(s => s.id),
      dataHora: this.resumo.dataHora,
      formaPagamento: this.formaPagamentoSelecionada,
      cupom: this.cupomSelecionadoId || null,
      subtotal: this.resumo.subtotal,
      desconto: this.resumo.desconto,
      total: this.resumo.total,
    };

    console.log('Agendamento final:', agendamentoFinal);
    alert('Agendamento confirmado com sucesso!');
  }

  obterNomesServicos(): string {
    return this.resumo.servicos.map(s => s.nome).join(', ');
  }

  getImagemFormaPagamento(): string {
    switch (this.formaPagamentoSelecionada) {
      case 'Pix':
        return 'assets/pix.png';
      case 'Crédito':
        return 'assets/mastercard.png';
      case 'Débito':
        return 'assets/debito.png'; // Coloque a imagem correspondente
      case 'Dinheiro':
        return 'assets/dinheiro.png'; // Coloque a imagem correspondente
      default:
        return 'assets/default.png';
    }
  }
  getIconeForma(forma: string): string {
    const nomeSemAcento = forma
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // remove acentos

    const mapaNomes: { [key: string]: string } = {
      'credito': 'mastercard',
      // outros casos especiais se precisar
    };

    const arquivo = mapaNomes[nomeSemAcento] || nomeSemAcento;

    return `assets/${arquivo}.png`;
  }


  abrirPopupCartao() {
    this.mostrarPopupCartao = true;
  }

  salvarCartao() {
    // Aqui você pode adicionar lógica para salvar o cartão
    console.log('Cartão salvo:', this.cartao);
    this.mostrarPopupCartao = false;
  }

  formatarNumeroCartao(event: any) {
    let valor = event.target.value.replace(/\D/g, '');
    valor = valor.replace(/(.{4})/g, '$1 ').trim();
    this.cartao.numero = valor;
  }

  resgatarCupom() {
    const code = (this.codigoCupom || '').trim().toUpperCase();
    if (!code) {
      alert('Digite o código do cupom.');
      return;
    }

    const cupom = this.cuponsDisponiveis.find(
      c => (c.codigo || '').toUpperCase() === code
    );

    if (!cupom) {
      alert('Cupom inválido ou não encontrado.');
      return;
    }

    this.selecionarCupomPopup(cupom);
    this.codigoCupom = '';
  }
}
