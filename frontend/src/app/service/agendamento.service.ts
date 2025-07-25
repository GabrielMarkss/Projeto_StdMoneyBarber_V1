import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Agendamento {
  id?: number;
  diaSemana: string;      // Ex: 'MONDAY'
  horario: string;        // Ex: '08:00'
  bloqueado: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AgendamentoService {
  private apiUrl = 'http://localhost:8080/api/horarios';

  constructor(private http: HttpClient) { }

  listar(): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(this.apiUrl);
  }

  criar(agendamento: Agendamento): Observable<Agendamento> {
    return this.http.post<Agendamento>(this.apiUrl, agendamento);
  }

  editar(agendamento: Agendamento): Observable<Agendamento> {
    return this.http.put<Agendamento>(`${this.apiUrl}/${agendamento.id}`, agendamento);
  }

  deletarHorarios(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/deletar`, ids);
  }

  bloquearHorarios(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bloquear`, ids);
  }

  desbloquearHorarios(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/desbloquear`, ids);
  }

  verificarDiaBloqueado(diaSemana: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/verificar-dia?dia=${diaSemana}`);
  }
}
