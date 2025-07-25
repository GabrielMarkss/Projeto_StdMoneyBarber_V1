package com.stmoneybarber.backend.repository;

import com.stmoneybarber.backend.model.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
    List<Agendamento> findByDiaSemana(DayOfWeek diaSemana);

    List<Agendamento> findByDiaSemanaNot(DayOfWeek diaSemana);
}
