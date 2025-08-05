import { Component, OnInit, OnDestroy } from '@angular/core';
import { UsuarioService } from '../service/usuario.service';
import { CarrosselImagem } from '../service/carrosselImagem.service';
import { ServicoService } from '../service/servico.service';
import { Servico } from '../models/servico.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardService } from '../service/card.service';
import { Card } from '../models/card-servico.model';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
})
export class HomeComponent implements OnInit, OnDestroy {
  // DATA DE HOJE
  dataHoje: string = '';

  // -------------- Menu Dropdown ---------------
  menuAberto = false;
  mostrarFormulario = false;
  menuTimeout: any;

  // ---------------------- Carrossel de Imagem ----------------------
  imagens: any[] = [];
  imagemAtual: any = null;
  novaImagemArquivo: File | null = null;
  novaImagem: any = { id: null, url: '' };
  mostrarFormularioImagem = false;
  indiceImagemAtual: number = 0;
  intervaloCarrosselImagem: any;

  // ---------------------- Serviços ----------------------
  servicos: Servico[] = [];
  servicosPaginados: Servico[] = [];
  novoServico: Servico = { nome: '', preco: 0 };
  mostrarFormularioServico = false;
  // ---------------- Paginação do serviço ----------------
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
  router: any;

  constructor(
    public usuarioService: UsuarioService,
    private carrosselImagem: CarrosselImagem,
    private servicoService: ServicoService,
    private cardService: CardService,
    private http: HttpClient
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
      const usuarioLogado = this.usuarioService.getUsuarioLogadoSnapshot();
      if (usuarioLogado && usuarioLogado.id) {
        this.usuarioService.nomeUsuario = usuarioLogado.nome;
      } else {
        this.usuarioService.getUsuarioLogado().subscribe({
          next: (user) => {
            if (user && user.id) {
              this.usuarioService.nomeUsuario = user.nome;
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
    } else {
      console.warn('Usuário não está logado. Redirecionando para login.');
      this.router.navigate(['/login']);
    }

    this.listarImagens();
    this.listarServicos();
    this.usuarioService.loadUsuarioLogado();
    this.listarCards();

    window.addEventListener('resize', () => {
      this.listarCards();
    });
  }

  ngOnDestroy() {
    if (this.intervaloCarrosselImagem)
      clearInterval(this.intervaloCarrosselImagem);
    if (this.intervaloCarrosselCards)
      clearInterval(this.intervaloCarrosselCards);
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

  abrirFormulario(servico?: Servico) {
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

  // ======= CARDS ========
  listarCards() {
    this.cardService.listar().subscribe((res) => {
      const host = window.location.hostname;
      const port = 8080;

      this.cards = res.map((c) => ({
        ...c,
        imagemPath: c.imagemPath || 'assets/imagem-nao-encontrada.png',
      }));

      const largura = window.innerWidth;
      const quantidade = largura <= 768 ? 4 : 5;

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
