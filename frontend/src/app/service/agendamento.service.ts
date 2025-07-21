import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Agendamento } from '../models/agendamento.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AgendamentoService {
  private apiUrl = 'http://localhost:8080/api/agendamentos';

  constructor(private http: HttpClient) {}

  listarPorDia(dia: string): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(`${this.apiUrl}/dia/${dia}`);
  }

  criar(agendamento: Agendamento): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/criar`, agendamento);
  }

  editar(agendamento: Agendamento): Observable<Agendamento> {
    return this.http.put<Agendamento>(`${this.apiUrl}/editar`, agendamento);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deletarVarios(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/deletar-muitos`, ids);
  }

  bloquearHorarios(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bloquear-horarios`, ids);
  }
}
