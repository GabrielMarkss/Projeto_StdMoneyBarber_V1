package com.stmoneybarber.backend.repository;

import com.stmoneybarber.backend.model.Horario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioRepository extends JpaRepository<Horario, Long> {
    List<Horario> findByDiaSemana(DayOfWeek diaSemana);

    Optional<Horario> findByDiaSemanaAndHora(DayOfWeek diaSemana, LocalTime hora); // Updated method name and types

    List<Horario> findByDiaSemanaNot(DayOfWeek diaSemana);
}