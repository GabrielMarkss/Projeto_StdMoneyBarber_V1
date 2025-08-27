import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Cupom } from '../models/cupom.model';
import { UsuarioService } from '../service/usuario.service';
import { NotificacaoService } from '../service/notificacao.service';
import { ServicoService } from '../service/servico.service';
import { HorarioService } from '../service/horario.service';
import { AgendamentoService } from '../service/agendamento.service';
import { Notificacao } from '../models/Notificacao.model';
import { Servico } from '../models/servico.model';
import { Horario } from '../models/horario.model';
import { Agendamento } from '../models/agendamento.model';

@Component({
  selector: 'app-agendamento',
  templateUrl: './agendamento.component.html',
  styleUrls: ['./agendamento.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
})
export class AgendamentoComponent implements OnInit {
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
  barbeiros: string[] = ['Felipe', 'Ezequiel', 'Sem Preferência'];
  barbeiroSelecionado: string = 'Sem Preferência';
  barbeiroFormulario: string = 'Felipe';
  cuponsDisponiveis: Cupom[] = [
    {
      id: 1,
      codigo: 'FIDELIDADE10',
      nome: 'Cupom de serviço',
      descricao:
        'Este cupom de fidelidade te dá o direito a um serviço gratuito...',
      desconto: 10,
      imagem: 'assets/cupom.png',
    },
    {
      id: 2,
      codigo: 'DESCONTO20',
      nome: 'Cupom de serviço',
      descricao:
        'Este cupom de fidelidade te dá o direito a um serviço gratuito...',
      desconto: 20,
      imagem: 'assets/cupom.png',
    },
  ];
  codigoCupom: string = '';
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
  horarios: Horario[] = [];
  mostrarFormularioHorario = false;
  modoEdicao = false;
  horarioEditando: Horario | null = null;
  novoHorario: string = '';
  selecionarTodos: boolean = false;
  horariosSelecionados = new Set<number>();
  horariosSelecionadosParaBloqueio = new Set<number>();
  horariosSelecionadosParaDesbloqueio = new Set<number>();
  horarioSelecionadoCliente: Horario | null = null;
  periodos: ('manha' | 'tarde' | 'noite')[] = ['manha', 'tarde', 'noite'];
  resumo = {
    barbeiro: 'Sem Preferência',
    servicos: [] as Servico[],
    data: '',
    horario: '',
    subtotal: 0,
    desconto: 0,
    total: 0,
    cupomNome: '',
  };
  mostrarPopupCupom = false;
  mostrarMenuMobile = false;

  constructor(
    public usuarioService: UsuarioService,
    private notificacaoService: NotificacaoService,
    private servicoService: ServicoService,
    private horarioService: HorarioService,
    private agendamentoService: AgendamentoService,
    private route: ActivatedRoute,
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
    const hojeNum = data.getDay();
    this.diaSelecionado =
      hojeNum === 0
        ? 'SEG'
        : ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'][hojeNum];

    // Limpar estados de seleção
    this.horariosSelecionados.clear();
    this.horariosSelecionadosParaBloqueio.clear();
    this.horariosSelecionadosParaDesbloqueio.clear();
    this.horarioSelecionadoCliente = null;
    this.selecionarTodos = false;
    this.resumo.horario = '';
    this.resumo.data = '';

    this.listarNotificacoes();
    this.carregarServicos();

    // Mover carregarHorarios para dentro do subscribe para garantir que barbeiroSelecionado esteja definido
    this.route.queryParamMap.subscribe((params) => {
      const barbeiroParam = params.get('barbeiro')?.toLowerCase();
      this.barbeiroSelecionado =
        barbeiroParam === 'felipe'
          ? 'Felipe'
          : barbeiroParam === 'ezequiel'
          ? 'Ezequiel'
          : 'Sem Preferência';
      this.resumo.barbeiro = this.barbeiroSelecionado;
      console.log(
        'Inicializando com barbeiro:',
        this.barbeiroSelecionado,
        'e dia:',
        this.diaSelecionado
      );
      this.carregarHorarios();
    });

    if (this.usuarioService.isLoggedIn()) {
      this.usuarioService.getUsuarioLogado().subscribe({
        next: (user) => {
          if (user) {
            this.usuarioService.nomeUsuario = user.nome;
          } else {
            console.warn('Usuário não encontrado ao inicializar componente');
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          console.error('Erro ao carregar usuário no ngOnInit:', err);
          this.router.navigate(['/login']);
        },
      });
    }
  }

  onBarbeiroChange() {
    this.resumo.barbeiro = this.barbeiroSelecionado;
    this.carregarHorarios();
    this.atualizarValores();
  }

  isHorarioPassado(horario: Horario): boolean {
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(
      agora.getMinutes()
    ).padStart(2, '0')}`;
    const isHoje =
      this.diasSemana.find((d) => d.sigla === this.diaSelecionado)?.backend ===
      agora.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
    return isHoje && horario.horario < horaAtual;
  }

  abrirMenu() {
    clearTimeout(this.menuTimeout);
    this.menuAberto = true;
  }

  fecharMenu() {
    this.menuTimeout = setTimeout(() => (this.menuAberto = false), 150);
  }

  abrirMenuMobile() {
    this.mostrarMenuMobile = true;
  }

  fecharMenuMobile() {
    this.mostrarMenuMobile = false;
  }

  logout() {
    this.usuarioService.logout();
    this.fecharMenuMobile();
    this.router.navigate(['/']);
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
      error: (err) =>
        alert('Erro ao remover notificação: ' + (err.error || err.message)),
    });
  }

  carregarServicos() {
    this.servicoService.listar().subscribe({
      next: (res) => {
        this.servicos = res;
      },
      error: (err) => {
        console.error('Erro ao carregar serviços:', err);
        alert('Erro ao carregar serviços: ' + (err.error || err.message));
      },
    });
  }

  toggleServico(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.servicosSelecionados.push(id);
    } else {
      this.servicosSelecionados = this.servicosSelecionados.filter(
        (s) => s !== id
      );
    }
    this.atualizarValores();
  }

  selecionarDia(dia: string) {
    this.diaSelecionado = dia;
    this.horarioSelecionadoCliente = null;
    this.resumo.data = '';
    this.resumo.horario = '';
    this.horariosSelecionados.clear();
    this.horariosSelecionadosParaBloqueio.clear();
    this.horariosSelecionadosParaDesbloqueio.clear();
    this.selecionarTodos = false;
    this.carregarHorarios();
  }

  carregarHorarios() {
    const dia = this.diasSemana.find((d) => d.sigla === this.diaSelecionado);
    if (!dia) return;

    const data = new Date();
    data.setDate(
      data.getDate() +
        ((this.diasSemana.findIndex((d) => d.sigla === this.diaSelecionado) +
          7 -
          data.getDay()) %
          7)
    );

    const dataFormatada = `${data.getFullYear()}-${String(
      data.getMonth() + 1
    ).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

    this.horarioService
      .listarDisponiveis(dataFormatada, this.barbeiroSelecionado)
      .subscribe({
        next: (res: Horario[]) => {
          console.log('Horários recebidos:', res);
          let horariosValidos: Horario[] = res;

          // ---------- SEM PREFERÊNCIA ----------
          if (this.barbeiroSelecionado === 'Sem Preferência') {
            // 1️⃣ Agrupa horários por barbeiro
            const horariosPorBarbeiro: Map<string, Set<string>> = new Map();
            res.forEach((h: Horario) => {
              if (!h.barbeiro) return;
              if (!horariosPorBarbeiro.has(h.barbeiro)) {
                horariosPorBarbeiro.set(h.barbeiro, new Set<string>());
              }
              horariosPorBarbeiro.get(h.barbeiro)!.add(h.horario);
            });

            let horariosComuns: Set<string> = new Set(); // inicializado vazio
            let primeiro = true;

            horariosPorBarbeiro.forEach((horarios: Set<string>) => {
              if (primeiro) {
                horariosComuns = new Set(horarios); // primeiro barbeiro
                primeiro = false;
              } else {
                horariosComuns = new Set(
                  [...horariosComuns].filter((hora) => horarios.has(hora))
                );
              }
            });
            const horariosUnificados: Horario[] = [];
            horariosComuns.forEach((hora: string) => {
              const base = res.find((h: Horario) => h.horario === hora)!;
              horariosUnificados.push({
                id: Date.now() + Math.floor(Math.random() * 1000), // id único
                horario: hora,
                barbeiro: 'Sem Preferência',
                bloqueado: base.bloqueado,
                diaSemana: base.diaSemana,
              });
            });

            // 4️⃣ Ordena
            horariosValidos = horariosUnificados.sort((a, b) =>
              a.horario.localeCompare(b.horario)
            );
          } else {
            // ---------- BARBEIRO ESPECÍFICO ----------
            horariosValidos = res.sort((a, b) =>
              a.horario.localeCompare(b.horario)
            );
          }

          // Atualiza variáveis do componente
          this.horarios = horariosValidos;
          this.horariosSelecionados.clear();
          this.horariosSelecionadosParaBloqueio.clear();
          this.horariosSelecionadosParaDesbloqueio.clear();
          this.horarioSelecionadoCliente = null;
          this.selecionarTodos = false;

          console.log('Horários carregados:', this.horarios);
        },
        error: (err) => {
          console.error('Erro ao carregar horários:', err);
          alert('Erro ao carregar horários: ' + (err.error || err.message));
        },
      });
  }

  apagarHorariosSelecionados(): void {
    const todosSelecionados = Array.from(this.horariosSelecionados);
    if (todosSelecionados.length === 0) {
      alert('Nenhum horário selecionado para apagar.');
      return;
    }
    if (!confirm('Tem certeza que deseja apagar os horários selecionados?'))
      return;
    this.horarioService.deletarHorarios(todosSelecionados).subscribe({
      next: () => {
        alert('Horários apagados com sucesso!');
        this.carregarHorarios();
      },
      error: (err) => {
        alert('Erro ao apagar horários: ' + (err.error || err.message));
        this.carregarHorarios();
      },
    });
    this.horariosSelecionados.clear();
    this.selecionarTodos = false;
  }

  clicarHorario(h: Horario) {
    if (this.usuarioService.usuarioEhAdmin()) {
      if (!h.id) {
        console.error('Horário sem ID válido:', h);
        return;
      }
      console.log('Horário clicado:', h);
      if (this.horariosSelecionados.has(h.id)) {
        this.horariosSelecionados.delete(h.id);
        this.horariosSelecionadosParaBloqueio.delete(h.id);
        this.horariosSelecionadosParaDesbloqueio.delete(h.id);
      } else {
        this.horariosSelecionados.add(h.id);
        if (!h.bloqueado) {
          this.horariosSelecionadosParaBloqueio.add(h.id);
          console.log('Horário marcado para bloqueio:', h.id);
        } else {
          this.horariosSelecionadosParaDesbloqueio.add(h.id);
          console.log('Horário marcado para desbloqueio:', h.id);
        }
      }
      console.log('Conjuntos após seleção:', {
        selecionados: Array.from(this.horariosSelecionados),
        paraBloqueio: Array.from(this.horariosSelecionadosParaBloqueio),
        paraDesbloqueio: Array.from(this.horariosSelecionadosParaDesbloqueio),
      });
      this.selecionarTodos =
        this.horariosSelecionados.size ===
        this.horarios.filter((h) => h.id != null).length;
    } else {
      this.selecionarHorarioCliente(h);
      console.log(
        'Horário selecionado pelo cliente:',
        this.horarioSelecionadoCliente
      );
    }
  }

  toggleSelecionarTodos() {
    this.horariosSelecionados.clear();
    this.horariosSelecionadosParaBloqueio.clear();
    this.horariosSelecionadosParaDesbloqueio.clear();
    if (this.selecionarTodos) {
      this.horarios.forEach((h) => {
        if (h.id) {
          this.horariosSelecionados.add(h.id);
          if (!h.bloqueado) {
            this.horariosSelecionadosParaBloqueio.add(h.id);
          } else {
            this.horariosSelecionadosParaDesbloqueio.add(h.id);
          }
        }
      });
    }
  }

  bloquearHorariosSelecionados() {
    if (this.horariosSelecionadosParaBloqueio.size === 0) {
      alert('Nenhum horário selecionado para bloquear.');
      return;
    }
    const ids = Array.from(this.horariosSelecionadosParaBloqueio);
    if (!confirm('Confirma o bloqueio dos horários selecionados?')) return;
    this.horarioService.bloquearHorarios(ids).subscribe({
      next: () => {
        this.carregarHorarios();
        this.horariosSelecionados.clear();
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
    if (this.horariosSelecionadosParaDesbloqueio.size === 0) {
      alert('Nenhum horário selecionado para desbloquear.');
      return;
    }
    const ids = Array.from(this.horariosSelecionadosParaDesbloqueio);
    if (!confirm('Confirma o desbloqueio dos horários selecionados?')) return;
    this.horarioService.desbloquearHorarios(ids).subscribe({
      next: () => {
        this.carregarHorarios();
        this.horariosSelecionados.clear();
        this.horariosSelecionadosParaDesbloqueio.clear();
        this.selecionarTodos = false;
      },
      error: (err) => {
        alert('Erro ao desbloquear horários: ' + (err.error || err.message));
        this.carregarHorarios();
      },
    });
  }

  criarHorario() {
    if (!this.novoHorario || !this.barbeiroFormulario) {
      alert('Por favor, selecione um horário e um barbeiro.');
      return;
    }
    const horaFormatada = this.formatarHoraParaBackend(this.novoHorario);
    const horario: Horario = {
      horario: horaFormatada,
      barbeiro: this.barbeiroFormulario,
      bloqueado: false,
      diaSemana: 'MONDAY', // O backend criará para todos os dias úteis
    };
    this.horarioService.criar(horario).subscribe({
      next: (res) => {
        console.log('Horários criados:', res);
        if (res.length === 0) {
          alert(
            'Este horário já existe para o barbeiro em todos os dias disponíveis.'
          );
        } else {
          alert('Horários criados com sucesso!');
        }
        this.carregarHorarios();
        this.cancelarFormularioHorario();
      },
      error: (err) => {
        console.error('Erro ao criar horário:', err);
        alert('Erro ao criar horário: ' + (err.error || err.message));
        this.cancelarFormularioHorario();
      },
    });
  }

  editarHorario() {
    if (
      !this.horarioEditando ||
      !this.novoHorario ||
      !this.barbeiroFormulario
    ) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    const atualizado: Horario = {
      ...this.horarioEditando,
      horario: this.formatarHoraParaBackend(this.novoHorario),
      barbeiro: this.barbeiroFormulario,
    };
    this.horarioService.editar(atualizado).subscribe({
      next: () => {
        this.cancelarFormularioHorario();
        this.carregarHorarios();
      },
      error: (err) => {
        alert('Erro ao editar horário: ' + (err.error || err.message));
      },
    });
  }

  abrirFormularioHorario() {
    this.modoEdicao = false;
    this.horarioEditando = null;
    this.novoHorario = '';
    this.barbeiroFormulario = 'Felipe';
    this.mostrarFormularioHorario = true;
  }

  abrirFormularioEditarHorario(h: Horario) {
    this.modoEdicao = true;
    this.horarioEditando = h;
    this.novoHorario = h.horario;
    this.barbeiroFormulario = h.barbeiro || 'Felipe';
    this.mostrarFormularioHorario = true;
  }

  cancelarFormularioHorario() {
    this.mostrarFormularioHorario = false;
    this.novoHorario = '';
    this.horarioEditando = null;
    this.modoEdicao = false;
    this.barbeiroFormulario = 'Felipe';
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

  abrirPopupCupom() {
    this.mostrarPopupCupom = true;
  }

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

  resgatarCupom() {
    const code = (this.codigoCupom || '').trim().toUpperCase();
    if (!code) {
      alert('Digite o código do cupom.');
      return;
    }
    const cupom = this.cuponsDisponiveis.find(
      (c) => (c.codigo || '').toUpperCase() === code
    );
    if (!cupom) {
      alert('Cupom inválido ou não encontrado.');
      return;
    }
    this.selecionarCupomPopup(cupom);
    this.codigoCupom = '';
  }

  fecharPopupCupom(event: MouseEvent) {
    this.mostrarPopupCupom = false;
  }

  atualizarValores() {
    const selecionados = this.servicos.filter((s) =>
      this.servicosSelecionados.includes(s.id!)
    );
    this.resumo.servicos = selecionados;
    this.valorTotal = selecionados.reduce((acc, s) => acc + (s.preco || 0), 0);
    this.resumo.subtotal = this.valorTotal;
    const cupom = this.cuponsDisponiveis.find(
      (c) => c.id === +this.cupomSelecionadoId
    );
    this.descontoAplicado = cupom
      ? (this.valorTotal * cupom.desconto) / 100
      : 0;
    this.resumo.desconto = this.descontoAplicado;
    this.valorFinal = this.valorTotal - this.descontoAplicado;
    this.resumo.total = this.valorFinal;
    this.resumo.barbeiro = this.barbeiroSelecionado;
  }

  selecionarHorarioCliente(horario: Horario) {
    if (horario.bloqueado) {
      alert('Este horário não está disponível.');
      return;
    }
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(
      agora.getMinutes()
    ).padStart(2, '0')}`;
    const diaMap: { [key: string]: number } = {
      DOM: 0,
      SEG: 1,
      TER: 2,
      QUA: 3,
      QUI: 4,
      SEX: 5,
      SAB: 6,
    };
    const diaSemanaNumero = diaMap[this.diaSelecionado];
    const isHoje = diaSemanaNumero === agora.getDay();

    if (isHoje && horario.horario < horaAtual) {
      alert('Este horário já passou e não está disponível.');
      return;
    }

    this.horarioSelecionadoCliente = horario;
    const dataSelecionada = new Date(agora);
    const distancia = (diaSemanaNumero + 7 - agora.getDay()) % 7;
    dataSelecionada.setDate(agora.getDate() + distancia);
    const dia = String(dataSelecionada.getDate()).padStart(2, '0');
    const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
    const ano = dataSelecionada.getFullYear();
    const hora = this.formatarHorario(horario.horario);
    this.resumo.data = `${dia}/${mes}/${ano}`;
    this.resumo.horario = hora;

    // Use the barber assigned to the time slot (Felipe, Ezequiel, or Sem Preferência)
    this.resumo.barbeiro = horario.barbeiro || 'Sem Preferência';
    this.atualizarValores();
  }

  confirmar() {
    const usuarioLogado = this.usuarioService.getUsuarioLogadoSnapshot();
    if (!usuarioLogado || !usuarioLogado.id) {
      console.error('Usuário não logado ou ID ausente');
      alert('Erro: Usuário não identificado. Por favor, faça login novamente.');
      this.router.navigate(['/login']);
      return;
    }

    if (
      !this.horarioSelecionadoCliente ||
      !this.resumo.data ||
      !this.resumo.horario ||
      !this.resumo.servicos.length
    ) {
      console.error('Dados incompletos:', {
        horario: this.horarioSelecionadoCliente,
        data: this.resumo.data,
        servicos: this.resumo.servicos,
      });
      alert('Por favor, selecione um horário, data e pelo menos um serviço.');
      return;
    }

    const [dia, mes, ano] = this.resumo.data.split('/').map(Number);
    const dataFormatada = `${ano}-${String(mes).padStart(2, '0')}-${String(
      dia
    ).padStart(2, '0')}`;
    const horarioFormatado = this.formatarHoraParaBackend(this.resumo.horario);

    const agora = new Date();
    const dataAgendamento = new Date(`${dataFormatada}T${horarioFormatado}`);

    if (dataAgendamento <= agora) {
      console.error('Tentativa de agendar horário passado ou atual:', {
        data: dataFormatada,
        horario: horarioFormatado,
      });
      alert('Não é possível agendar em horários passados ou atuais.');
      return;
    }

    const agendamento: Agendamento = {
      usuarioId: usuarioLogado.id,
      barbeiro:
        this.resumo.barbeiro === 'Sem Preferência'
          ? null
          : this.resumo.barbeiro,
      servicos: this.resumo.servicos
        .map((s) => s.id!)
        .filter((id) => id !== undefined),
      data: dataFormatada,
      horario: horarioFormatado,
      subtotal: this.resumo.subtotal,
      desconto: this.resumo.desconto,
      total: this.resumo.total,
      cupomNome: this.resumo.cupomNome || null,
      status: 'PENDENTE',
    };

    console.log('Payload enviado:', JSON.stringify(agendamento, null, 2));
    this.agendamentoService.criar(agendamento).subscribe({
      next: (novoAgendamento) => {
        console.log(
          'Agendamento criado:',
          JSON.stringify(novoAgendamento, null, 2)
        );
        alert('Agendamento confirmado com sucesso!');
        this.carregarHorarios();
        this.resetarFormulario();
        this.router.navigate(['/meus-horarios']);
      },
      error: (err) => {
        console.error('Erro ao criar agendamento:', err);
        const mensagemErro =
          err.error?.message || err.message || 'Erro desconhecido';
        alert(`Erro ao confirmar agendamento: ${mensagemErro}`);
      },
    });
  }

  private formatarHoraParaBackend(hora: string): string {
    const partes = hora.split(':');
    const h = partes[0]?.padStart(2, '0') || '00';
    const m = partes[1]?.padStart(2, '0') || '00';
    return `${h}:${m}:00`;
  }

  resetarFormulario() {
    this.servicosSelecionados = [];
    this.horarioSelecionadoCliente = null;
    this.resumo = {
      barbeiro: this.barbeiroSelecionado,
      servicos: [],
      data: '',
      horario: '',
      subtotal: 0,
      desconto: 0,
      total: 0,
      cupomNome: '',
    };
    this.cupomSelecionadoId = '';
    this.codigoCupom = '';
    this.atualizarValores();
  }

  obterNomesServicos(): string {
    return this.resumo.servicos.length > 0
      ? this.resumo.servicos.map((s) => s.nome).join(', ')
      : 'Nenhum serviço';
  }
}
