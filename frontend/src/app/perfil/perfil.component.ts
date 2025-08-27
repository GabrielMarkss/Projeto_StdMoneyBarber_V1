import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../service/usuario.service';
import { NotificacaoService } from '../service/notificacao.service';
import { Notificacao } from '../models/Notificacao.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class PerfilComponent implements OnInit {
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
  router: any;

  mostrarMenuMobile = false;
  mostrarModalImagem = false;

  constructor(
    public usuarioService: UsuarioService,
    private notificacaoService: NotificacaoService
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

    this.listarNotificacoes();
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

  fecharMenuMobile() {
    this.mostrarMenuMobile = false;
  }

  logout() {
    this.usuarioService.logout();
    this.router.navigate(['/']); // Redireciona para home
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

  salvarNotificacao() {
    if (this.nova.id) {
      this.notificacaoService
        .atualizar(this.nova.id, this.nova)
        .subscribe(() => {
          console.log('Notificação atualizada');
          this.cancelarFormulario();
          this.listarNotificacoes();
        });
    } else {
      this.notificacaoService.criar(this.nova).subscribe(() => {
        console.log('Notificação criada');
        this.cancelarFormulario();
        this.listarNotificacoes();
      });
    }
  }

  listarNotificacoes() {
    this.notificacaoService.listar().subscribe((res) => {
      this.notificacoes = res;
    });
  }

  confirmarRemocao(notificacao: Notificacao) {
    const confirmar = confirm('Você deseja remover esta notificação?');
    if (!confirmar) return;

    const isAdmin = this.usuarioService.usuarioEhAdmin(); // crie esse método se necessário

    this.notificacaoService.deletar(notificacao.id!, true, isAdmin).subscribe({
      next: () => this.listarNotificacoes(),
      error: (err) => alert(err.error || 'Erro ao remover notificação'),
    });
  }

  editarNotificacao(n: Notificacao) {
    this.nova = { ...n };
    this.mostrarFormulario = true;
  }

  abrirModalImagem() {
    this.mostrarModalImagem = true;
  }

  fecharModalImagem() {
    this.mostrarModalImagem = false;
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Aqui você vai adicionar a lógica para envio da imagem
      console.log('Imagem selecionada:', file.name);
    }
  }
}
