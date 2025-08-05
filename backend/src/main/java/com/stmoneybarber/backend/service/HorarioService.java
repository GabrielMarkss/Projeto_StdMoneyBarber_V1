package com.stmoneybarber.backend.service;

import com.stmoneybarber.backend.model.Horario;
import com.stmoneybarber.backend.repository.HorarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
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
        List<Horario> horarios = horarioRepo.findAllById(ids);
        for (Horario h : horarios) {
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
}
