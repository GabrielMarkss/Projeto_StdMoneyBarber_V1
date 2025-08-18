import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Horario } from '../models/horario.model';

@Injectable({
  providedIn: 'root',
})
export class HorarioService {
  private apiUrl = `http://${window.location.hostname}:8080/api/horarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Horario[]> {
    return this.http.get<Horario[]>(this.apiUrl);
  }

  listarDisponiveis(data: string, barbeiro: string): Observable<Horario[]> {
    return this.http.get<Horario[]>(
      `${this.apiUrl}/disponiveis?data=${data}&barbeiro=${barbeiro}`
    );
  }

  criar(horario: Horario): Observable<Horario[]> {
    return this.http.post<Horario[]>(this.apiUrl, horario);
  }

  editar(horario: Horario): Observable<Horario> {
    return this.http.put<Horario>(`${this.apiUrl}/${horario.id}`, horario);
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
    return this.http.get<boolean>(
      `${this.apiUrl}/verificar-dia?dia=${diaSemana}`
    );
  }
}
