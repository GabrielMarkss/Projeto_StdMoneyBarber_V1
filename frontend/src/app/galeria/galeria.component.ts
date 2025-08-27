import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../service/usuario.service';
import { NotificacaoService } from '../service/notificacao.service';
import { Notificacao } from '../models/Notificacao.model';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-galeria',
  templateUrl: './galeria.component.html',
  styleUrls: ['./galeria.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class GaleriaComponent implements OnInit {
  menuAberto = false;
  mostrarNotificacoes = false;
  mostrarFormulario = false;
  menuTimeout: any;
  notificacaoTimeout: any;
  dataHoje: string = '';
  notificacoes: Notificacao[] = [];
  nova: Notificacao = {
    titulo: '',
    descricao: '',
    imagemUrl: '',
  };
  imagemSelecionada: File | null = null;
  mostrarMenuMobile = false;

  constructor(
    public usuarioService: UsuarioService,
    private notificacaoService: NotificacaoService,
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
        this.listarNotificacoes();
      } else {
        this.usuarioService.getUsuarioLogado().subscribe({
          next: (user) => {
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
      }
    } else {
      console.warn('Usuário não está logado. Redirecionando para login.');
      this.router.navigate(['/login']);
    }
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
    this.nova = {
      titulo: '',
      descricao: '',
      imagemUrl: '',
    };
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
          console.log('Notificação atualizada');
          this.cancelarFormulario();
          this.listarNotificacoes();
        },
        error: (err) => {
          console.error('Erro ao atualizar notificação:', err);
          alert('Erro ao atualizar notificação: ' + (err.error || err.message));
        },
      });
    } else {
      this.notificacaoService.criar(this.nova).subscribe({
        next: () => {
          console.log('Notificação criada');
          this.cancelarFormulario();
          this.listarNotificacoes();
        },
        error: (err) => {
          console.error('Erro ao criar notificação:', err);
          alert('Erro ao criar notificação: ' + (err.error || err.message));
        },
      });
    }
  }

  listarNotificacoes() {
    this.notificacaoService.listar().subscribe({
      next: (res) => {
        this.notificacoes = res;
      },
      error: (err) => {
        console.error('Erro ao listar notificações:', err);
        alert('Erro ao carregar notificações: ' + (err.error || err.message));
      },
    });
  }

  confirmarRemocao(notificacao: Notificacao) {
    const confirmar = confirm('Você deseja remover esta notificação?');
    if (!confirmar) return;

    const isAdmin = this.usuarioService.usuarioEhAdmin();
    this.notificacaoService.deletar(notificacao.id!, true, isAdmin).subscribe({
      next: () => this.listarNotificacoes(),
      error: (err) => {
        console.error('Erro ao remover notificação:', err);
        alert('Erro ao remover notificação: ' + (err.error || err.message));
      },
    });
  }

  editarNotificacao(n: Notificacao) {
    this.nova = { ...n };
    this.mostrarFormulario = true;
  }
}
