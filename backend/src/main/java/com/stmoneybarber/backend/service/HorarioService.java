package com.stmoneybarber.backend.service;

import com.stmoneybarber.backend.model.Horario;
import com.stmoneybarber.backend.repository.HorarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.List;

@Service
public class HorarioService {

    @Autowired
    private HorarioRepository horarioRepo;

    public List<Horario> listarTodos() {
        return horarioRepo.findAll();
    }

    public Horario criar(Horario horario) {
        if (horario.getDiaSemana() == DayOfWeek.SUNDAY) {
            throw new RuntimeException("Domingo é fechado");
        }
        return horarioRepo.save(horario);
    }

    public Horario editar(Long id, Horario novoHorario) {
        Horario horario = horarioRepo.findById(id).orElseThrow();
        horario.setHora(novoHorario.getHora());
        horario.setDiaSemana(novoHorario.getDiaSemana());
        return horarioRepo.save(horario);
    }

    public void deletarTodos(List<Long> ids) {
        horarioRepo.deleteAllById(ids);
    }

    public void bloquearHorarios(List<Long> ids) {
        List<Horario> horarios = horarioRepo.findAllById(ids);
        for (Horario h : horarios) {
            h.setBloqueado(true);
        }
        horarioRepo.saveAll(horarios);
    }

    public void desbloquearHorarios(List<Long> ids) {
        LocalDateTime agora = LocalDateTime.now(ZoneId.of("America/Sao_Paulo"));
        LocalDate hoje = agora.toLocalDate();
        LocalTime horaAtual = agora.toLocalTime();

        List<Horario> horarios = horarioRepo.findAllById(ids);
        for (Horario h : horarios) {
            if (h.getDiaSemana().equals(hoje.getDayOfWeek()) && h.getHora().isBefore(horaAtual)) {
                throw new IllegalArgumentException(
                        "Não é possível desbloquear horários passados no dia atual: " + h.getHora());
            }
            h.setBloqueado(false);
        }
        horarioRepo.saveAll(horarios);
    }

    public boolean isDiaBloqueado(DayOfWeek dia) {
        if (dia == DayOfWeek.SUNDAY)
            return true;
        List<Horario> horarios = horarioRepo.findByDiaSemana(dia);
        return !horarios.isEmpty() && horarios.stream().allMatch(Horario::isBloqueado);
    }

    @Scheduled(cron = "0 0 0 * * ?") // Executa à meia-noite todos os dias
    public void desbloquearHorariosDiariamente() {
        LocalDateTime agora = LocalDateTime.now(ZoneId.of("America/Sao_Paulo"));
        List<Horario> horarios = horarioRepo.findAll();
        for (Horario horario : horarios) {
            if (horario.isBloqueado()) {
                horario.setBloqueado(false);
                horarioRepo.save(horario);
            }
        }
    }

    @Scheduled(fixedRate = 60000) // Executa a cada 1 minuto
    public void bloquearHorariosPassados() {
        LocalDateTime agora = LocalDateTime.now(ZoneId.of("America/Sao_Paulo"));
        List<Horario> horarios = horarioRepo.findAll();
        for (Horario horario : horarios) {
            LocalTime hora = horario.getHora();
            DayOfWeek diaSemana = horario.getDiaSemana();
            LocalDate hoje = agora.toLocalDate();
            if (diaSemana.equals(hoje.getDayOfWeek()) && agora.toLocalTime().isAfter(hora)) {
                horario.setBloqueado(true);
                horarioRepo.save(horario);
            }
        }
    }
}