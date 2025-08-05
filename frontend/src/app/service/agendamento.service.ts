import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Agendamento } from '../models/agendamento.model';

@Injectable({
  providedIn: 'root',
})
export class AgendamentoService {
  private apiUrl = `http://${window.location.hostname}:8080/api/agendamentos`;

  constructor(private http: HttpClient) {}

  criar(agendamento: Agendamento): Observable<Agendamento> {
    console.log(
      'Enviando para URL:',
      this.apiUrl,
      'Payload:',
      JSON.stringify(agendamento, null, 2)
    );
    return this.http.post<Agendamento>(this.apiUrl, agendamento);
  }

  atualizar(id: number, agendamento: Agendamento): Observable<Agendamento> {
    console.log(
      'Atualizando agendamento ID:',
      id,
      'Payload:',
      JSON.stringify(agendamento, null, 2)
    );
    return this.http.put<Agendamento>(`${this.apiUrl}/${id}`, agendamento);
  }

  deletar(id: number): Observable<void> {
    console.log('Deletando agendamento ID:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarPorUsuario(usuarioId: number): Observable<Agendamento[]> {
    console.log('Listando agendamentos para usuário:', usuarioId);
    return this.http.get<Agendamento[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  listarTodos(): Observable<Agendamento[]> {
    console.log('Listando todos os agendamentos');
    return this.http.get<Agendamento[]>(`${this.apiUrl}/todos`);
  }
}
