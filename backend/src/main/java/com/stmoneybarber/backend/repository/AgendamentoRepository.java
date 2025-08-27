package com.stmoneybarber.backend.repository;

import com.stmoneybarber.backend.model.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
    List<Agendamento> findByUsuarioId(Long usuarioId);

    List<Agendamento> findByStatusNot(Agendamento.StatusAgendamento status);

    Agendamento findByDataAndHorarioAndBarbeiro(LocalDate data, LocalTime horario, String barbeiro);

    List<Agendamento> findByDataAndHorarioAndBarbeiroIsNull(LocalDate data, LocalTime horario);

    long countByDataAndHorarioAndBarbeiroIsNull(LocalDate data, LocalTime horario);
}