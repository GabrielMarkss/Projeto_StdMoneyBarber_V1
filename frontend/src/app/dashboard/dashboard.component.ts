import { Component, OnInit, OnDestroy } from '@angular/core';
import { UsuarioService } from '../service/usuario.service';
import { NotificacaoService } from '../service/notificacao.service';
import { CarrosselImagem } from '../service/carrosselImagem.service';
import { ServicoService } from '../service/servico.service';
import { Notificacao } from '../models/Notificacao.model';
import { Servico } from '../models/servico.model';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { FormsModule } from '@angular/forms';
import { CardService } from '../service/card.service';
import { Card } from '../models/card-servico.model';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Barbeiro } from '../models/barbeiro.model';
import { BarbeiroService } from '../service/barbeiro.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GoogleMapsModule,
    FormsModule,
    HttpClientModule,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  menuAberto = false;
  mostrarNotificacoes = false;
  mostrarFormulario = false;
  mostrarFormularioServico = false;

  menuTimeout: any;
  notificacaoTimeout: any;

  dataHoje: string = '';

  // ---------------------- Notificações ----------------------
  notificacoes: Notificacao[] = [];
  nova: Notificacao = { titulo: '', descricao: '', imagemUrl: '' };
  imagemSelecionada: File | null = null;

  // ---------------------- Carrossel de Imagem ----------------------
  imagens: any[] = [];
  imagemAtual: any = null;
  novaImagemArquivo: File | null = null;
  novaImagem: any | null = null;
  mostrarFormularioImagem = false;
  indiceImagemAtual: number = 0;
  intervaloCarrosselImagem: any;

  // ----------------- Barbeiros -----------------
  barbeiros: Barbeiro[] = [];
  novoBarbeiro: Barbeiro = this.resetarFormularioBarbeiro();
  editarBarbeiro: boolean = false;
  editandoId: number | null = null;
  imagemPreview: string | null = null;
  mostrarFormularioBarbeiro = false;

  // ---------------------- Serviços ----------------------
  servicos: Servico[] = [];
  servicosPaginados: Servico[] = [];
  novoServico: Servico = { nome: '', preco: 0 };
  itensPorPagina = 9;
  paginaAtual = 1;
  totalPaginas = 1;
  paginas: number[] = [];

  // ---------------------- Carrossel de Cards ----------------------
  cards: Card[] = [];
  novoCardDescricao = '';
  novoCardImagem: File | null = null;
  cardEditando: Card | null = null;
  mostrarFormularioCard = false;
  cardsVisiveis: Card[] = [];
  proximoIndexCard = 0;
  intervaloCarrosselCards: any;
  mostrarMenuMobile = false;

  constructor(
    public usuarioService: UsuarioService,
    private router: Router,
    private notificacaoService: NotificacaoService,
    private carrosselImagem: CarrosselImagem,
    private servicoService: ServicoService,
    private cardService: CardService,
    private http: HttpClient,
    private barbeiroService: BarbeiroService // 👈 adicionado aqui
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
      this.usuarioService.getUsuarioLogado().subscribe({
        next: (user) => {
          console.log('Usuário carregado:', user);
          if (user && user.id) {
            this.usuarioService.nomeUsuario = user.nome;
            this.listarNotificacoes();
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
    } else {
      console.warn('Usuário não está logado. Redirecionando para login.');
      this.router.navigate(['/login']);
    }

    this.listarImagens();
    this.listarServicos();
    this.listarCards();
    this.carregarBarbeiros();
  }

  ngOnDestroy() {
    if (this.intervaloCarrosselImagem)
      clearInterval(this.intervaloCarrosselImagem);
    if (this.intervaloCarrosselCards)
      clearInterval(this.intervaloCarrosselCards);
  }

  irParaSecao(id: string) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth' });
    }
  }

  abrirMenu() {
    clearTimeout(this.menuTimeout);
    this.menuAberto = true;
  }

  fecharMenu() {
    this.menuTimeout = setTimeout(() => {
      this.menuAberto = false;
    }, 200);
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

  // ---------------------- Serviços ----------------------
  listarServicos() {
    this.servicoService.listar().subscribe((res) => {
      this.servicos = res.sort((a, b) => a.id! - b.id!);
      this.totalPaginas = Math.ceil(this.servicos.length / this.itensPorPagina);
      this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
      this.irParaPagina(1);
    });
  }

  irParaPagina(pagina: number) {
    this.paginaAtual = pagina;
    const inicio = (pagina - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    this.servicosPaginados = this.servicos.slice(inicio, fim);
  }

  abrirFormularioServico(servico?: Servico) {
    this.novoServico = servico ? { ...servico } : { nome: '', preco: 0 };
    this.mostrarFormularioServico = true;
  }

  cancelarFormularioServico() {
    this.mostrarFormularioServico = false;
    this.novoServico = { nome: '', preco: 0 };
  }

  salvarServico() {
    const op = this.novoServico.id
      ? this.servicoService.atualizar(this.novoServico.id, this.novoServico)
      : this.servicoService.adicionar(this.novoServico);

    op.subscribe((servicoSalvo: Servico) => {
      if (this.novoServico.id) {
        const index = this.servicos.findIndex(
          (s) => s.id === this.novoServico.id
        );
        if (index !== -1) {
          this.servicos[index] = { ...servicoSalvo };
        }
      } else {
        this.servicos.push(servicoSalvo);
      }

      this.totalPaginas = Math.ceil(this.servicos.length / this.itensPorPagina);
      this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
      this.irParaPagina(this.paginaAtual);

      this.cancelarFormularioServico();
    });
  }

  deletarServico(id: number) {
    if (confirm('Você deseja remover este serviço?')) {
      this.servicoService.deletar(id).subscribe(() => this.listarServicos());
    }
  }

  // ---------------------- Notificações ----------------------
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

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagemSelecionada = file;
      const reader = new FileReader();
      reader.onload = () => (this.nova.imagemUrl = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  salvarNotificacao() {
    const op = this.nova.id
      ? this.notificacaoService.atualizar(this.nova.id, this.nova)
      : this.notificacaoService.criar(this.nova);

    op.subscribe(() => {
      this.cancelarFormulario();
      this.listarNotificacoes();
    });
  }

  listarNotificacoes() {
    this.notificacaoService
      .listar()
      .subscribe((res) => (this.notificacoes = res));
  }

  confirmarRemocao(notificacao: Notificacao) {
    if (!confirm('Você deseja remover esta notificação?')) return;
    const isAdmin = this.usuarioService.usuarioEhAdmin();
    this.notificacaoService.deletar(notificacao.id!, true, isAdmin).subscribe({
      next: () => this.listarNotificacoes(),
      error: (err) => alert(err.error || 'Erro ao remover notificação'),
    });
  }

  editarNotificacao(n: Notificacao) {
    this.nova = { ...n };
    this.mostrarFormulario = true;
  }

  // ---------------------- Carrossel de Imagem ----------------------
  abrirFormularioImagem() {
    this.novaImagemArquivo = null;
    this.novaImagem = { id: null, url: '' };
    this.mostrarFormularioImagem = true;
  }

  cancelarFormularioImagem() {
    this.mostrarFormularioImagem = false;
    this.novaImagemArquivo = null;
    this.novaImagem = { id: null, url: '' };
  }

  onFileChangeImagem(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.novaImagemArquivo = file;

      const reader = new FileReader();
      reader.onload = () => (this.novaImagem.url = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  salvarImagem() {
    if (!this.novaImagemArquivo) {
      alert('Selecione uma imagem antes de salvar.');
      return;
    }

    const formData = new FormData();
    formData.append('imagem', this.novaImagemArquivo);

    this.http
      .post('http://localhost:8080/api/imagens', formData)
      .subscribe(() => {
        this.listarImagens();
        this.cancelarFormularioImagem();
      });
  }

  editarImagem(imagem: any) {
    this.novaImagem = { ...imagem };
    this.mostrarFormularioImagem = true;
  }

  listarImagens() {
    this.carrosselImagem.listarImagens().subscribe((res) => {
      this.imagens = res;
      this.indiceImagemAtual = 0;
      this.imagemAtual = this.imagens.length > 0 ? this.imagens[0] : null;

      if (this.intervaloCarrosselImagem)
        clearInterval(this.intervaloCarrosselImagem);

      if (this.imagens.length > 1) {
        this.intervaloCarrosselImagem = setInterval(() => {
          this.indiceImagemAtual =
            (this.indiceImagemAtual + 1) % this.imagens.length;
          this.imagemAtual = this.imagens[this.indiceImagemAtual];
        }, 5000);
      }
    });
  }

  removerImagem(imagem: any) {
    if (confirm('Deseja remover esta imagem?')) {
      this.carrosselImagem
        .deletarImagem(imagem.id)
        .subscribe(() => this.listarImagens());
    }
  }

  anteriorImagem() {
    if (this.imagens.length > 0) {
      this.indiceImagemAtual =
        (this.indiceImagemAtual - 1 + this.imagens.length) %
        this.imagens.length;
      this.imagemAtual = this.imagens[this.indiceImagemAtual];
    }
  }

  proximaImagem() {
    if (this.imagens.length > 0) {
      this.indiceImagemAtual =
        (this.indiceImagemAtual + 1) % this.imagens.length;
      this.imagemAtual = this.imagens[this.indiceImagemAtual];
    }
  }

  // ============= SESSÂO BARBEIROS =============
  carregarBarbeiros() {
    this.barbeiroService.listar().subscribe((res) => (this.barbeiros = res));
  }

  resetarFormularioBarbeiro(): Barbeiro {
    return {
      nome: '',
      instagram: '',
      telefone: '',
      linkAgendamento: '',
      imagemUrl: '',
    };
  }

  formatarWhatsapp(telefone: string): string {
    const apenasNumeros = telefone.replace(/\D/g, '');
    return `https://wa.me/55${apenasNumeros}`;
  }

  onImagemSelecionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagemPreview = reader.result as string;
        this.novoBarbeiro.imagemUrl = this.imagemPreview;
      };
      reader.readAsDataURL(file);
    }
  }

  toggleFormularioBarbeiro() {
    this.mostrarFormularioBarbeiro = !this.mostrarFormularioBarbeiro;
  }

  fecharFormularioBarbeiro() {
    this.mostrarFormularioBarbeiro = false;
  }

  salvar() {
    if (this.editarBarbeiro && this.editandoId !== null) {
      this.barbeiroService
        .atualizar(this.editandoId, this.novoBarbeiro)
        .subscribe(() => {
          this.editarBarbeiro = false;
          this.editandoId = null;
          this.novoBarbeiro = this.resetarFormularioBarbeiro();
          this.carregarBarbeiros();
          this.mostrarFormularioBarbeiro = false; // fecha popup ao salvar
        });
    } else {
      this.barbeiroService.criar(this.novoBarbeiro).subscribe(() => {
        this.novoBarbeiro = this.resetarFormularioBarbeiro();
        this.carregarBarbeiros();
        this.mostrarFormularioBarbeiro = false; // fecha popup ao salvar
      });
    }
  }

  editar(barbeiro: Barbeiro) {
    this.novoBarbeiro = { ...barbeiro };
    this.editarBarbeiro = true;
    this.editandoId = barbeiro.id!;
    this.mostrarFormularioBarbeiro = true; // Abre o formulário para editar
  }

  cancelar() {
    this.novoBarbeiro = this.resetarFormularioBarbeiro();
    this.editarBarbeiro = false;
    this.editandoId = null;
  }

  deletar(id: number) {
    if (confirm('Deseja realmente remover este barbeiro?')) {
      this.barbeiroService
        .deletar(id)
        .subscribe(() => this.carregarBarbeiros());
    }
  }
  // ======= CARDS ========
  listarCards() {
    this.cardService.listar().subscribe((res) => {
      const largura = window.innerWidth;
      const quantidade = largura <= 1000 ? 4 : 4;

      this.cards = res.map((c) => ({
        ...c,
        imagemPath: c.imagemBase64 || 'assets/imagem-nao-encontrada.png',
      }));

      this.cardsVisiveis = this.cards.slice(0, quantidade);
      this.proximoIndexCard = quantidade % this.cards.length;

      this.iniciarCarrosselCards(quantidade);
    });
  }

  iniciarCarrosselCards(quantidadeVisivel: number) {
    if (this.intervaloCarrosselCards)
      clearInterval(this.intervaloCarrosselCards);

    if (this.cards.length <= quantidadeVisivel) {
      this.cardsVisiveis = [...this.cards];
      return;
    }

    this.intervaloCarrosselCards = setInterval(() => {
      const novosCards: Card[] = [];

      for (let i = 0; i < quantidadeVisivel; i++) {
        const index = (this.proximoIndexCard + i) % this.cards.length;
        novosCards.push(this.cards[index]);
      }

      this.cardsVisiveis = novosCards;
      this.proximoIndexCard = (this.proximoIndexCard + 1) % this.cards.length;
    }, 5000);
  }

  abrirFormularioCard(card?: Card) {
    if (card) {
      this.cardEditando = { ...card };
      this.novoCardDescricao = card.descricao;
      this.novoCardImagem = null; // mantém imagem antiga até trocar
    } else {
      this.cardEditando = null;
      this.novoCardDescricao = '';
      this.novoCardImagem = null;
    }
    this.mostrarFormularioCard = true;
  }

  cancelarFormularioCard() {
    this.mostrarFormularioCard = false;
    this.novoCardDescricao = '';
    this.novoCardImagem = null;
    this.cardEditando = null;
  }

  onFileChangeCard(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.novoCardImagem = file;
    }
  }

  salvarCard() {
    if (this.cardEditando) {
      // Atualizar card
      this.cardService
        .atualizar(
          this.cardEditando.id!,
          this.novoCardDescricao,
          this.novoCardImagem ?? undefined // aqui a correção
        )

        .subscribe(() => {
          this.listarCards();
          this.cancelarFormularioCard();
        });
    } else {
      // Criar novo card
      if (!this.novoCardImagem) {
        alert('Selecione uma imagem para o novo card.');
        return;
      }

      this.cardService
        .criar(this.novoCardDescricao, this.novoCardImagem ?? undefined)
        .subscribe(() => {
          this.listarCards();
          this.cancelarFormularioCard();
        });
    }
  }

  deletarCard(id: number) {
    if (confirm('Deseja remover este card?')) {
      this.cardService.deletar(id).subscribe(() => this.listarCards());
    }
  }
}
