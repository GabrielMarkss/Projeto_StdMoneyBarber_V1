import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = `http://localhost:8080/api/usuarios`;
  private usuarioLogadoSubject = new BehaviorSubject<{
    id: number;
    nome: string;
    sobrenome: string | null;
    email: string;
    telefone: string | null;
    admin: boolean;
    imagemUrl: string | null;
  } | null>(null);

  public nome: string = '';
  public sobrenome: string | null = null;
  public email: string = '';
  public telefone: string | null = null;
  public imagemUrl: string | null = null;
  public nomeUsuario: string = '';

  constructor(private http: HttpClient, private router: Router) {
    this.loadUsuarioLogado();
  }

  login(payload: {
    identificador: string;
    senha: string;
    permanecerConectado: boolean;
  }): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/login`, payload)
      .pipe(
        tap((response) => {
          const token = response.token;
          if (payload.permanecerConectado) {
            localStorage.setItem('token', token);
          } else {
            sessionStorage.setItem('token', token);
          }
          this.loadUsuarioLogado();
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Erro no login:', error);
          return throwError(
            () =>
              new Error(
                'Falha no login: ' + (error.error?.message || error.message)
              )
          );
        })
      );
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;
  }

  register(usuario: any): Observable<string> {
    return this.http
      .post(`${this.apiUrl}/register`, usuario, { responseType: 'text' })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Erro no registro:', error);
          return throwError(
            () =>
              new Error(
                'Falha no registro: ' + (error.error?.message || error.message)
              )
          );
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    this.nome = '';
    this.sobrenome = null;
    this.email = '';
    this.telefone = null;
    this.imagemUrl = null;
    this.nomeUsuario = '';
    this.usuarioLogadoSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  getUsuarioLogado(): Observable<{
    id: number;
    nome: string;
    sobrenome: string | null;
    email: string;
    telefone: string | null;
    admin: boolean;
    imagemUrl: string | null;
  } | null> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    return this.http
      .get<{
        id: number;
        nome: string;
        sobrenome: string | null;
        email: string;
        telefone: string | null;
        admin: boolean;
        imagemUrl: string | null;
      }>(`${this.apiUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        tap((user) => {
          if (user && user.id) {
            this.nome = user.nome;
            this.sobrenome = user.sobrenome;
            this.email = user.email;
            this.telefone = user.telefone;
            this.imagemUrl = user.imagemUrl;
            this.nomeUsuario = user.nome;
            this.usuarioLogadoSubject.next(user);
          } else {
            console.warn('Usuário retornado sem ID:', user);
            this.logout();
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Erro ao obter usuário logado:', error);
          this.logout();
          return of(null);
        })
      );
  }

  usuarioEhAdmin(): boolean {
    return this.usuarioLogadoSubject.value?.admin === true;
  }

  loadUsuarioLogado(): void {
    const token = this.getToken();
    if (token && !this.usuarioLogadoSubject.value) {
      this.getUsuarioLogado().subscribe({
        next: (user) => {
          if (user) {
            this.nome = user.nome;
            this.sobrenome = user.sobrenome;
            this.email = user.email;
            this.telefone = user.telefone;
            this.imagemUrl = user.imagemUrl;
            this.nomeUsuario = user.nome;
            this.usuarioLogadoSubject.next(user);
          }
        },
        error: () => {
          this.nome = '';
          this.sobrenome = null;
          this.email = '';
          this.telefone = null;
          this.imagemUrl = null;
          this.nomeUsuario = '';
          this.usuarioLogadoSubject.next(null);
        },
      });
    }
  }

  getUsuarioLogadoSnapshot(): {
    id: number;
    nome: string;
    sobrenome: string | null;
    email: string;
    telefone: string | null;
    admin: boolean;
    imagemUrl: string | null;
  } | null {
    return this.usuarioLogadoSubject.value;
  }

  atualizarDados(dados: any): Observable<any> {
    const token = this.getToken();
    return this.http
      .put(`${this.apiUrl}/me`, dados, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        tap((response: any) => {
          console.log('Resposta da atualização:', response);
          this.loadUsuarioLogado();
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Erro ao atualizar dados:', error);
          return throwError(
            () =>
              new Error(
                error.error?.erro || error.error?.message || error.message
              )
          );
        })
      );
  }

  uploadImagem(file: File): Observable<any> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post(`${this.apiUrl}/me/imagem`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        tap(() => this.loadUsuarioLogado()),
        catchError((error) => {
          console.error('Erro ao fazer upload da imagem:', error);
          return throwError(
            () => new Error(error.error?.message || error.message)
          );
        })
      );
  }
}
