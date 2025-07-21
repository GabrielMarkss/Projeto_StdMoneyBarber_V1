package com.stmoneybarber.backend.repository;

import com.stmoneybarber.backend.model.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
    List<Agendamento> findByDiaSemana(DayOfWeek dia);

    boolean existsByDiaSemanaAndHorario(DayOfWeek dia, LocalTime horario);

    List<Agendamento> findByHorario(LocalTime horario);

}