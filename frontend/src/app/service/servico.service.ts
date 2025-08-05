import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Servico } from '../models/servico.model';

@Injectable({ providedIn: 'root' })
export class ServicoService {
  private apiUrl = `http://${window.location.hostname}:8080/api/servicos`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Servico[]> {
    return this.http.get<Servico[]>(this.apiUrl);
  }

  adicionar(servico: Servico): Observable<Servico> {
    return this.http.post<Servico>(`${this.apiUrl}`, servico);
  }

  atualizar(id: number, servico: Servico): Observable<Servico> {
    return this.http.put<Servico>(`${this.apiUrl}/${id}`, servico);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
