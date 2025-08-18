package com.stmoneybarber.backend.service;

import com.stmoneybarber.backend.model.Horario;
import com.stmoneybarber.backend.repository.HorarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class HorarioService {

    private static final Logger logger = LoggerFactory.getLogger(HorarioService.class);

    @Autowired
    private HorarioRepository horarioRepo;

    public List<Horario> listarTodos() {
        return horarioRepo.findAll();
    }

    public List<Horario> criar(Horario horario) {
        if (horario.getBarbeiro() == null || horario.getBarbeiro().isEmpty()
                || "Sem Preferência".equals(horario.getBarbeiro())) {
            throw new IllegalArgumentException("Barbeiro deve ser especificado (Felipe ou Ezequiel).");
        }

        logger.info("Criando horário para barbeiro: {}, hora: {}", horario.getBarbeiro(), horario.getHora());

        List<Horario> criados = new ArrayList<>();
        List<DayOfWeek> diasUteis = Arrays.asList(
                DayOfWeek.MONDAY,
                DayOfWeek.TUESDAY,
                DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY,
                DayOfWeek.SATURDAY);

        for (DayOfWeek dia : diasUteis) {
            Optional<Horario> existente = horarioRepo.findByDiaSemanaAndHoraAndBarbeiro(
                    dia, horario.getHora(), horario.getBarbeiro());
            if (existente.isEmpty()) {
                Horario novo = new Horario();
                novo.setHora(horario.getHora());
                novo.setBarbeiro(horario.getBarbeiro());
                novo.setDiaSemana(dia);
                novo.setBloqueado(false);
                Horario salvo = horarioRepo.save(novo);
                criados.add(salvo);
                logger.info("Horário criado para {} na {}", dia, horario.getHora());
            } else {
                logger.info("Horário já existe para {} na {} para o barbeiro {}", dia, horario.getHora(),
                        horario.getBarbeiro());
            }
        }

        logger.info("Horários criados: {}", criados.size());
        return criados;
    }

    public Horario editar(Long id, Horario novoHorario) {
        Horario horario = horarioRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horário não encontrado: " + id));
        horario.setHora(novoHorario.getHora());
        horario.setDiaSemana(novoHorario.getDiaSemana());
        horario.setBarbeiro(novoHorario.getBarbeiro());
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
            if (h.getHora() == null || h.getDiaSemana() == null) {
                logger.warn("Horário inválido encontrado: ID={}, hora={}, diaSemana={}. Ignorando.",
                        h.getId(), h.getHora(), h.getDiaSemana());
                continue;
            }
            h.setBloqueado(false);
        }
        horarioRepo.saveAll(horarios);
    }

    public boolean isDiaBloqueado(DayOfWeek dia) {
        if (dia == DayOfWeek.SUNDAY) {
            return true;
        }
        List<Horario> horarios = horarioRepo.findByDiaSemana(dia);
        return !horarios.isEmpty() && horarios.stream().allMatch(Horario::isBloqueado);
    }

    public List<Horario> listarHorariosDisponiveis(LocalDate data, String barbeiro) {
        DayOfWeek diaSemana = data.getDayOfWeek();
        logger.info("Buscando horários para data: {}, barbeiro: {}", data, barbeiro);

        if (diaSemana == DayOfWeek.SUNDAY) {
            logger.info("Nenhum horário disponível para domingo.");
            return Collections.emptyList();
        }

        List<Horario> horarios;
        if ("Sem Preferência".equals(barbeiro)) {
            horarios = horarioRepo.findByDiaSemana(diaSemana).stream()
                    .filter(h -> h.getBarbeiro() != null)
                    .filter(h -> h.getHora() != null)
                    .collect(Collectors.toList());

            logger.info("Horários encontrados para 'Sem Preferência': {}", horarios.size());

            Map<LocalTime, Horario> horariosUnificados = new HashMap<>();
            for (Horario h : horarios) {
                LocalTime hora = h.getHora();
                if (!horariosUnificados.containsKey(hora)) {
                    Horario horarioSemPreferencia = new Horario();
                    horarioSemPreferencia.setHora(hora);
                    horarioSemPreferencia.setDiaSemana(diaSemana);
                    horarioSemPreferencia.setBarbeiro("Sem Preferência");
                    horarioSemPreferencia.setBloqueado(h.isBloqueado());
                    horariosUnificados.put(hora, horarioSemPreferencia);
                }
            }
            return new ArrayList<>(horariosUnificados.values()).stream()
                    .sorted(Comparator.comparing(Horario::getHora))
                    .collect(Collectors.toList());
        } else {
            horarios = horarioRepo.findByDiaSemanaAndBarbeiro(diaSemana, barbeiro).stream()
                    .filter(h -> h.getHora() != null)
                    .sorted(Comparator.comparing(Horario::getHora))
                    .collect(Collectors.toList());
        }

        logger.info("Horários encontrados para {} e barbeiro {}: {}", data, barbeiro, horarios.size());
        return horarios;
    }
}