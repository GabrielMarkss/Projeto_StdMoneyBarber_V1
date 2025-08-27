import { Component, OnInit, HostListener } from '@angular/core';
import { UsuarioService } from '../service/usuario.service';
import { NotificacaoService } from '../service/notificacao.service';
import { Notificacao } from '../models/Notificacao.model';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
  mostrarMenuMobile = false;
  mostrarModalImagem = false;
  mostrarIconeMobile = false; // Controla a visibilidade do ícone no mobile
  mostrarIconeDesktop = false; // Controla a visibilidade do ícone no desktop

  editandoNome = false;
  editandoSobrenome = false;
  editandoTelefone = false;
  editandoEmail = false;
  editandoSenha = false;

  tempNome: string = '';
  tempSobrenome: string | null = null;
  tempTelefone: string | null = null;
  tempEmail: string = '';
  tempSenha: string = '';

  mostrarConfirmacao = false;
  campoEditado: string | null = null;
  valorOriginal: { [key: string]: string } = {};
  valorAlterado: { [key: string]: string } = {};

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
        this.tempNome = usuarioLogado.nome;
        this.tempSobrenome = usuarioLogado.sobrenome;
        this.tempEmail = usuarioLogado.email;
        this.tempTelefone = usuarioLogado.telefone;
        this.valorOriginal['nome'] = this.tempNome;
        this.valorOriginal['sobrenome'] = this.tempSobrenome || '';
        this.valorOriginal['telefone'] = this.tempTelefone || '';
        this.valorOriginal['email'] = this.tempEmail;
        this.valorOriginal['senha'] = this.tempSenha;
        this.listarNotificacoes();
      } else {
        this.usuarioService.getUsuarioLogado().subscribe({
          next: (user) => {
            if (user && user.id) {
              this.tempNome = user.nome;
              this.tempSobrenome = user.sobrenome;
              this.tempEmail = user.email;
              this.tempTelefone = user.telefone;
              this.valorOriginal['nome'] = this.tempNome;
              this.valorOriginal['sobrenome'] = this.tempSobrenome || '';
              this.valorOriginal['telefone'] = this.tempTelefone || '';
              this.valorOriginal['email'] = this.tempEmail;
              this.valorOriginal['senha'] = this.tempSenha;
              this.listarNotificacoes();
            } else {
              console.warn('Usuário retornado sem ID ou nulo:', user);
              this.router.navigate(['/login']);
            }
          },
          error: (err) => {
            console.error('Erro ao carregar usuário:', err);
            this.router.navigate(['/login']);
          },
        });
      }
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

  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (
      this.isMobile() &&
      this.campoEditado &&
      event.target &&
      !(event.target as Element).closest('.campo, .confirmacao-modal')
    ) {
      this.verificarEdicao(this.campoEditado);
    }
  }

  toggleEditarIconeMobile() {
    if (this.isMobile()) {
      this.mostrarIconeMobile = !this.mostrarIconeMobile;
      if (this.mostrarIconeMobile) {
        // Abrir o modal após um pequeno atraso para permitir que o ícone seja visível
        setTimeout(() => {
          this.abrirModalImagem();
          this.mostrarIconeMobile = false; // Esconder o ícone após abrir o modal
        }, 300);
      }
    } else {
      this.abrirModalImagem(); // No desktop, abrir o modal diretamente
    }
  }

  abrirModalImagem() {
    this.mostrarModalImagem = true;
  }

  fecharModalImagem() {
    this.mostrarModalImagem = false;
    this.imagemSelecionada = null;
    this.mostrarIconeMobile = false; // Resetar no mobile
  }

  salvarImagem() {
    if (this.imagemSelecionada) {
      this.usuarioService.uploadImagem(this.imagemSelecionada).subscribe({
        next: (res) => {
          console.log('Imagem atualizada:', res);
          this.fecharModalImagem();
          alert('Imagem de perfil atualizada com sucesso');
        },
        error: (err) => {
          console.error('Erro ao atualizar imagem:', err);
          const errorMessage =
            err.error?.erro ||
            err.error ||
            err.message ||
            'Erro desconhecido ao atualizar imagem';
          alert(`Erro ao atualizar imagem: ${errorMessage}`);
        },
      });
    } else {
      alert('Nenhuma imagem selecionada');
    }
  }

  iniciarEdicao(campo: string) {
    if (this.isMobile() && this.mostrarConfirmacao) {
      // Impede abrir outro campo enquanto o pop-up está aberto
      return;
    }

    // Cancela qualquer edição ativa antes de iniciar uma nova
    if (this.campoEditado) {
      this.cancelarEdicao(this.campoEditado);
    }

    switch (campo) {
      case 'nome':
        if (!this.editandoNome) {
          this.tempNome = this.usuarioService.nome || '';
          this.valorOriginal['nome'] = this.tempNome;
          this.editandoNome = true;
          this.campoEditado = campo; // Define o campo editado
        }
        break;
      case 'sobrenome':
        if (!this.editandoSobrenome) {
          this.tempSobrenome = this.usuarioService.sobrenome || '';
          this.valorOriginal['sobrenome'] = this.tempSobrenome;
          this.editandoSobrenome = true;
          this.campoEditado = campo;
        }
        break;
      case 'telefone':
        if (!this.editandoTelefone) {
          this.tempTelefone = this.usuarioService.telefone || '';
          this.valorOriginal['telefone'] = this.tempTelefone;
          this.editandoTelefone = true;
          this.campoEditado = campo;
        }
        break;
      case 'email':
        if (!this.editandoEmail) {
          this.tempEmail = this.usuarioService.email || '';
          this.valorOriginal['email'] = this.tempEmail;
          this.editandoEmail = true;
          this.campoEditado = campo;
        }
        break;
      case 'senha':
        if (!this.editandoSenha) {
          this.tempSenha = '';
          this.valorOriginal['senha'] = this.tempSenha;
          this.editandoSenha = true;
          this.campoEditado = campo;
        }
        break;
    }
  }

  onInputChange(campo: string) {
    // Rastreia alterações no input
    switch (campo) {
      case 'nome':
        this.valorAlterado['nome'] = this.tempNome;
        break;
      case 'sobrenome':
        this.valorAlterado['sobrenome'] = this.tempSobrenome || '';
        break;
      case 'telefone':
        this.valorAlterado['telefone'] = this.tempTelefone || '';
        break;
      case 'email':
        this.valorAlterado['email'] = this.tempEmail;
        break;
      case 'senha':
        this.valorAlterado['senha'] = this.tempSenha;
        break;
    }
  }

  verificarEdicao(campo: string) {
    if (this.isMobile()) {
      const valorOriginal = this.valorOriginal[campo] || '';
      const valorAlterado = this.valorAlterado[campo] || '';
      if (valorOriginal !== valorAlterado && valorAlterado.trim()) {
        // Mostra o pop-up se o valor foi alterado e não está vazio
        this.mostrarConfirmacao = true;
        this.campoEditado = campo;
      } else {
        // Cancela a edição se não houve alterações ou o valor está vazio
        this.cancelarEdicao(campo);
      }
    }
  }

  cancelarEdicao(campo: string) {
    switch (campo) {
      case 'nome':
        this.tempNome =
          this.valorOriginal['nome'] || this.usuarioService.nome || '';
        this.editandoNome = false;
        break;
      case 'sobrenome':
        this.tempSobrenome =
          this.valorOriginal['sobrenome'] ||
          this.usuarioService.sobrenome ||
          '';
        this.editandoSobrenome = false;
        break;
      case 'telefone':
        this.tempTelefone =
          this.valorOriginal['telefone'] || this.usuarioService.telefone || '';
        this.editandoTelefone = false;
        break;
      case 'email':
        this.tempEmail =
          this.valorOriginal['email'] || this.usuarioService.email || '';
        this.editandoEmail = false;
        break;
      case 'senha':
        this.tempSenha = this.valorOriginal['senha'] || '';
        this.editandoSenha = false;
        break;
    }
    this.mostrarConfirmacao = false;
    this.campoEditado = null;
    this.valorOriginal[campo] = '';
    this.valorAlterado[campo] = '';
  }

  salvarEdicao(campo: string) {
    const dados: any = {};
    switch (campo) {
      case 'nome':
        if (this.tempNome.trim()) {
          dados.nome = this.tempNome;
        } else {
          alert('Nome não pode ser vazio');
          return;
        }
        break;
      case 'sobrenome':
        dados.sobrenome = this.tempSobrenome;
        break;
      case 'telefone':
        dados.telefone = this.tempTelefone;
        break;
      case 'email':
        if (this.tempEmail.trim()) {
          dados.email = this.tempEmail;
        } else {
          alert('Email não pode ser vazio');
          return;
        }
        break;
      case 'senha':
        if (this.tempSenha.trim()) {
          dados.senha = this.tempSenha;
        } else {
          alert('Senha não pode ser vazia');
          return;
        }
        break;
    }

    this.usuarioService.atualizarDados(dados).subscribe({
      next: () => {
        console.log(`${campo} atualizado`);
        this.cancelarEdicao(campo); // Chama cancelarEdicao para limpar estados
        alert(`${campo} atualizado com sucesso`);
      },
      error: (err) => {
        console.error(`Erro ao atualizar ${campo}:`, err);
        alert(`Erro ao atualizar ${campo}: ${err.message}`);
      },
    });
  }
}
