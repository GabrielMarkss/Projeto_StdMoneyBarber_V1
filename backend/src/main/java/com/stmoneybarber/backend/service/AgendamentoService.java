package com.stmoneybarber.backend.service;

import com.stmoneybarber.backend.model.Agendamento;
import com.stmoneybarber.backend.repository.AgendamentoRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class AgendamentoService {

    private final AgendamentoRepository repository;

    public AgendamentoService(AgendamentoRepository repository) {
        this.repository = repository;
    }

    public List<Agendamento> listarTodos() {
        return repository.findAll();
    }

    public List<Agendamento> listarPorDia(DayOfWeek dia) {
        return repository.findByDiaSemana(dia);
    }

    public Optional<Agendamento> buscarPorId(Long id) {
        return repository.findById(id);
    }

    public void criar(Agendamento agendamento) {
        if (agendamento.getDiaSemana() == DayOfWeek.SUNDAY) {
            throw new IllegalArgumentException("Domingo está fechado.");
        }

        List<DayOfWeek> dias = List.of(
                DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY);

        for (DayOfWeek dia : dias) {
            if (!repository.existsByDiaSemanaAndHorario(dia, agendamento.getHorario())) {
                Agendamento novo = new Agendamento();
                novo.setDiaSemana(dia);
                novo.setHorario(agendamento.getHorario());
                novo.setDisponivel(true);
                novo.setBloqueado(false);
                repository.save(novo);
            }
        }
    }

    public Agendamento editar(Agendamento agendamento) {
        return repository.save(agendamento);
    }

    public void remover(Long id) {
        repository.deleteById(id);
    }

    public void toggleBloqueioHorario(Long id) {
        Agendamento a = repository.findById(id).orElseThrow();
        a.setBloqueado(!a.isBloqueado());
        repository.save(a);
    }

    public void toggleBloqueioDia(DayOfWeek dia) {
        List<Agendamento> lista = repository.findByDiaSemana(dia);
        for (Agendamento a : lista) {
            a.setBloqueado(!a.isBloqueado());
        }
        repository.saveAll(lista);
    }
}
