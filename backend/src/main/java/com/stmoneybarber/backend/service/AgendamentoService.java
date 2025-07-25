package com.stmoneybarber.backend.service;

import com.stmoneybarber.backend.model.Agendamento;
import com.stmoneybarber.backend.repository.AgendamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.List;

@Service
public class AgendamentoService {

    @Autowired
    private AgendamentoRepository horarioRepo;

    public List<Agendamento> listarTodos() {
        return horarioRepo.findAll(); 
    }

    public Agendamento criar(Agendamento horario) {
        if (horario.getDiaSemana() == DayOfWeek.SUNDAY) {
            throw new RuntimeException("Domingo é fechado");
        }
        return horarioRepo.save(horario);
    }

    public Agendamento editar(Long id, Agendamento novoHorario) {
        Agendamento horario = horarioRepo.findById(id).orElseThrow();
        horario.setHora(novoHorario.getHora());
        horario.setDiaSemana(novoHorario.getDiaSemana());
        return horarioRepo.save(horario);
    }

    public void deletarTodos(List<Long> ids) {
        horarioRepo.deleteAllById(ids);
    }

    public void bloquearHorarios(List<Long> ids) {
        List<Agendamento> horarios = horarioRepo.findAllById(ids);
        for (Agendamento h : horarios) {
            h.setBloqueado(true);
        }
        horarioRepo.saveAll(horarios);
    }

    public void desbloquearHorarios(List<Long> ids) {
        List<Agendamento> horarios = horarioRepo.findAllById(ids);
        for (Agendamento h : horarios) {
            h.setBloqueado(false);
        }
        horarioRepo.saveAll(horarios);
    }

    public boolean isDiaBloqueado(DayOfWeek dia) {
        if (dia == DayOfWeek.SUNDAY)
            return true;
        List<Agendamento> horarios = horarioRepo.findByDiaSemana(dia);
        return !horarios.isEmpty() && horarios.stream().allMatch(Agendamento::isBloqueado);
    }
}
