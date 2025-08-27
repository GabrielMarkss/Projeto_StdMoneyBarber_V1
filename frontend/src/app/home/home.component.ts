import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';
import { CarrosselImagem } from '../service/carrosselImagem.service';
import { ServicoService } from '../service/servico.service';
import { CardService } from '../service/card.service';
import { BarbeiroService } from '../service/barbeiro.service';
import { Servico } from '../models/servico.model';
import { Card } from '../models/card-servico.model';
import { Barbeiro } from '../models/barbeiro.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, GoogleMapsModule],
})
export class HomeComponent implements OnInit, OnDestroy {
  dataHoje: string = '';
  imagens: any[] = [];
  imagemAtual: any = null;
  indiceImagemAtual: number = 0;
  intervaloCarrosselImagem: any;
  barbeiros: Barbeiro[] = [];
  servicos: Servico[] = [];
  servicosPaginados: Servico[] = [];
  itensPorPagina = 9;
  paginaAtual = 1;
  totalPaginas = 1;
  paginas: number[] = [];
  cards: Card[] = [];
  cardsVisiveis: Card[] = [];
  proximoIndexCard = 0;
  intervaloCarrosselCards: any;

  constructor(
    private router: Router,
    private carrosselImagem: CarrosselImagem,
    private servicoService: ServicoService,
    private cardService: CardService,
    private barbeiroService: BarbeiroService
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

  // Carousel de Imagem
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
  // Barbeiros
  carregarBarbeiros() {
    this.barbeiroService.listar().subscribe((res) => (this.barbeiros = res));
  }

  formatarWhatsapp(telefone: string): string {
    const apenasNumeros = telefone.replace(/\D/g, '');
    return `https://wa.me/55${apenasNumeros}`;
  }

  // Serviços
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

  // Cards
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
}
