package com.stmoneybarber.backend.service;

import com.stmoneybarber.backend.model.Agendamento;
import com.stmoneybarber.backend.model.Horario;
import com.stmoneybarber.backend.repository.AgendamentoRepository;
import com.stmoneybarber.backend.repository.HorarioRepository;
import com.stmoneybarber.backend.repository.ServicoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AgendamentoService {

    private static final Logger logger = LoggerFactory.getLogger(AgendamentoService.class);

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    @Autowired
    private HorarioRepository horarioRepository;

    @Autowired
    private ServicoRepository servicoRepository;

    public Agendamento criar(Agendamento agendamento) {
        logger.info("Criando agendamento: {}", agendamento);
        if (agendamento.getUsuarioId() == null) {
            throw new IllegalArgumentException("UsuarioId é obrigatório");
        }
        if (agendamento.getServicos() == null || agendamento.getServicos().isEmpty()) {
            throw new IllegalArgumentException("Pelo menos um serviço deve ser selecionado");
        }
        if (agendamento.getData() == null) {
            throw new IllegalArgumentException("Data é obrigatória");
        }
        if (agendamento.getHorario() == null) {
            throw new IllegalArgumentException("Horário é obrigatório");
        }

        LocalDate data = agendamento.getData();
        LocalTime horario = agendamento.getHorario();
        DayOfWeek diaSemana = data.getDayOfWeek();
        LocalDateTime agora = LocalDateTime.now(ZoneId.of("America/Sao_Paulo"));
        LocalDateTime dataHoraAgendamento = LocalDateTime.of(data, horario);

        logger.info("Verificando agendamento: data={}, horario={}, diaSemana={}, agora={}, dataHoraAgendamento={}",
                data, horario, diaSemana, agora, dataHoraAgendamento);

        if (data.equals(agora.toLocalDate()) && horario.isBefore(agora.toLocalTime())) {
            throw new IllegalArgumentException("Não é possível agendar em horários passados no dia atual: " + horario);
        }

        String barbeiro = agendamento.getBarbeiro();
        if (barbeiro == null || "Sem Preferência".equals(barbeiro)) {
            // Para "Sem Preferência", verificar se há pelo menos dois barbeiros disponíveis
            List<Horario> horariosDisponiveis = horarioRepository.findByDiaSemana(diaSemana).stream()
                    .filter(h -> h.getBarbeiro() != null && !h.isBloqueado() && h.getHora().equals(horario))
                    .filter(h -> agendamentoRepository.findByDataAndHorarioAndBarbeiro(data, horario,
                            h.getBarbeiro()) == null)
                    .collect(Collectors.toList());

            long countSemPref = agendamentoRepository.countByDataAndHorarioAndBarbeiroIsNull(data, horario);

            if (horariosDisponiveis.size() < 2 || countSemPref > 0) {
                throw new IllegalArgumentException("Nenhum horário disponível para 'Sem Preferência' em: " + horario);
            }

            // Definir barbeiro como null e horarioId como null para "Sem Preferência"
            agendamento.setBarbeiro(null);
            agendamento.setHorarioId(null);
        } else {
            // Para barbeiro específico
            Optional<Horario> horarioExistente = horarioRepository.findByDiaSemanaAndHoraAndBarbeiro(diaSemana, horario,
                    barbeiro);
            if (horarioExistente.isEmpty()) {
                throw new IllegalArgumentException("Horário não cadastrado para " + barbeiro + ": " + horario);
            }
            if (horarioExistente.get().isBloqueado()) {
                throw new IllegalArgumentException("Horário já está bloqueado para " + barbeiro + ": " + horario);
            }
            if (agendamentoRepository.findByDataAndHorarioAndBarbeiro(data, horario, barbeiro) != null) {
                throw new IllegalArgumentException("Horário já agendado para " + barbeiro + " em: " + horario);
            }

            // Reatribuir agendamentos "Sem Preferência" pendentes
            List<Agendamento> semPrefs = agendamentoRepository.findByDataAndHorarioAndBarbeiroIsNull(data, horario);
            for (Agendamento sem : semPrefs) {
                String outroBarbeiro = barbeiro.equals("Felipe") ? "Ezequiel" : "Felipe";
                Optional<Horario> horOutro = horarioRepository.findByDiaSemanaAndHoraAndBarbeiro(diaSemana, horario,
                        outroBarbeiro);
                if (horOutro.isEmpty() || horOutro.get().isBloqueado() ||
                        agendamentoRepository.findByDataAndHorarioAndBarbeiro(data, horario, outroBarbeiro) != null) {
                    throw new IllegalArgumentException(
                            "Conflito ao reatribuir agendamento Sem Preferência para " + outroBarbeiro);
                }
                sem.setBarbeiro(outroBarbeiro);
                sem.setHorarioId(horOutro.get().getId());
                agendamentoRepository.save(sem);
                // Bloquear o horário do barbeiro reatribuído
                horOutro.ifPresent(horarioToBlock -> {
                    horarioToBlock.setBloqueado(true);
                    horarioRepository.save(horarioToBlock);
                    logger.info("Horário bloqueado para {} em {}", outroBarbeiro, horario);
                });
                logger.info("Agendamento Sem Preferência ID={} reatribuído para {}", sem.getId(), outroBarbeiro);
            }

            // Definir horarioId se não informado
            agendamento.setHorarioId(horarioExistente.get().getId());
        }

        for (Long servicoId : agendamento.getServicos()) {
            if (!servicoRepository.existsById(servicoId)) {
                throw new IllegalArgumentException("Serviço inválido: " + servicoId);
            }
        }

        agendamento.setStatus(Agendamento.StatusAgendamento.PENDENTE);
        Agendamento novoAgendamento = agendamentoRepository.save(agendamento);

        // Bloquear horário apenas para barbeiro específico
        if (barbeiro != null && !"Sem Preferência".equals(barbeiro)) {
            Optional<Horario> horarioExistente = horarioRepository.findByDiaSemanaAndHoraAndBarbeiro(diaSemana, horario,
                    barbeiro);
            horarioExistente.ifPresent(horarioToBlock -> {
                horarioToBlock.setBloqueado(true);
                horarioRepository.save(horarioToBlock);
                logger.info("Horário bloqueado para {} em {}", barbeiro, horario);
            });
        }

        logger.info("Agendamento criado com sucesso: ID={}, status={}",
                novoAgendamento.getId(), novoAgendamento.getStatus());
        return novoAgendamento;
    }

    public Agendamento atualizar(Long id, Agendamento agendamentoAtualizado) {
        logger.info("Atualizando agendamento ID: {}", id);
        Optional<Agendamento> agendamentoExistente = agendamentoRepository.findById(id);
        if (agendamentoExistente.isEmpty()) {
            throw new IllegalArgumentException("Agendamento não encontrado: " + id);
        }

        if (agendamentoAtualizado.getUsuarioId() == null) {
            throw new IllegalArgumentException("UsuarioId é obrigatório");
        }
        if (agendamentoAtualizado.getServicos() == null || agendamentoAtualizado.getServicos().isEmpty()) {
            throw new IllegalArgumentException("Pelo menos um serviço deve ser selecionado");
        }
        if (agendamentoAtualizado.getData() == null) {
            throw new IllegalArgumentException("Data é obrigatória");
        }
        if (agendamentoAtualizado.getHorario() == null) {
            throw new IllegalArgumentException("Horário é obrigatório");
        }

        LocalDate novaData = agendamentoAtualizado.getData();
        LocalTime novoHorario = agendamentoAtualizado.getHorario();
        DayOfWeek novoDiaSemana = novaData.getDayOfWeek();
        LocalDateTime agora = LocalDateTime.now(ZoneId.of("America/Sao_Paulo"));

        if (novaData.equals(agora.toLocalDate()) && novoHorario.isBefore(agora.toLocalTime())) {
            throw new IllegalArgumentException(
                    "Não é possível agendar em horários passados no dia atual: " + novoHorario);
        }

        String novoBarbeiro = agendamentoAtualizado.getBarbeiro();
        Optional<Horario> novoHorarioExistente = java.util.Optional.empty();
        if ("Sem Preferência".equals(novoBarbeiro)) {
            List<Horario> horariosDisponiveis = horarioRepository.findByDiaSemana(novoDiaSemana).stream()
                    .filter(h -> h.getBarbeiro() != null && !h.isBloqueado() && h.getHora().equals(novoHorario))
                    .collect(Collectors.toList());
            if (horariosDisponiveis.isEmpty()) {
                throw new IllegalArgumentException(
                        "Nenhum horário disponível para 'Sem Preferência' em: " + novoHorario);
            }
        } else {
            novoHorarioExistente = horarioRepository.findByDiaSemanaAndHoraAndBarbeiro(novoDiaSemana, novoHorario,
                    novoBarbeiro);
            if (novoHorarioExistente.isEmpty()) {
                throw new IllegalArgumentException(
                        "Novo horário não cadastrado para " + novoBarbeiro + ": " + novoHorario);
            }
            if (novoHorarioExistente.get().isBloqueado()) {
                throw new IllegalArgumentException(
                        "Novo horário já está bloqueado para " + novoBarbeiro + ": " + novoHorario);
            }
        }

        for (Long servicoId : agendamentoAtualizado.getServicos()) {
            if (!servicoRepository.existsById(servicoId)) {
                throw new IllegalArgumentException("Serviço inválido: " + servicoId);
            }
        }

        Agendamento agendamentoAntigo = agendamentoExistente.get();
        LocalDate dataAntiga = agendamentoAntigo.getData();
        LocalTime horarioAntigo = agendamentoAntigo.getHorario();
        String barbeiroAntigo = agendamentoAntigo.getBarbeiro();

        // Desbloquear horário antigo se for barbeiro específico
        if (!"Sem Preferência".equals(barbeiroAntigo)
                && (!dataAntiga.equals(novaData) || !horarioAntigo.equals(novoHorario))) {
            Optional<Horario> horarioAntigoExistente = horarioRepository
                    .findByDiaSemanaAndHoraAndBarbeiro(dataAntiga.getDayOfWeek(), horarioAntigo, barbeiroAntigo);
            horarioAntigoExistente.ifPresent(horarioToUnblock -> {
                horarioToUnblock.setBloqueado(false);
                horarioRepository.save(horarioToUnblock);
                logger.info("Horário antigo desbloqueado: {}", horarioAntigo);
            });
        }

        agendamentoAtualizado.setId(id);
        agendamentoAtualizado.setStatus(agendamentoAntigo.getStatus());
        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamentoAtualizado);

        // Bloquear novo horário apenas para barbeiro específico
        if (!"Sem Preferência".equals(novoBarbeiro)) {
            novoHorarioExistente.ifPresent(horarioToBlock -> {
                horarioToBlock.setBloqueado(true);
                horarioRepository.save(horarioToBlock);
            });
        }

        logger.info("Agendamento atualizado com sucesso: ID={}, status={}",
                agendamentoSalvo.getId(), agendamentoSalvo.getStatus());
        return agendamentoSalvo;
    }

    public void deletar(Long id) {
        logger.info("Deletando agendamento ID: {}", id);
        Optional<Agendamento> agendamentoExistente = agendamentoRepository.findById(id);
        if (agendamentoExistente.isEmpty()) {
            throw new IllegalArgumentException("Agendamento não encontrado: " + id);
        }

        Agendamento agendamento = agendamentoExistente.get();
        LocalDate data = agendamento.getData();
        LocalTime horario = agendamento.getHorario();
        String barbeiro = agendamento.getBarbeiro();

        // Desbloquear horário apenas se for barbeiro específico
        if (!"Sem Preferência".equals(barbeiro)) {
            Optional<Horario> horarioExistente = horarioRepository
                    .findByDiaSemanaAndHoraAndBarbeiro(data.getDayOfWeek(), horario, barbeiro);
            horarioExistente.ifPresent(horarioToUnblock -> {
                horarioToUnblock.setBloqueado(false);
                horarioRepository.save(horarioToUnblock);
                logger.info("Horário desbloqueado: {}", horario);
            });
        }

        agendamentoRepository.deleteById(id);
        logger.info("Agendamento deletado com sucesso: {}", id);
    }

    public List<Agendamento> listarPorUsuario(Long usuarioId) {
        logger.info("Listando agendamentos para usuarioId: {}", usuarioId);
        return agendamentoRepository.findByUsuarioId(usuarioId);
    }

    public List<Agendamento> listarTodos() {
        logger.info("Listando todos os agendamentos");
        return agendamentoRepository.findAll();
    }

    @Scheduled(fixedRate = 30000) // Executa a cada 30 segundos
    public void atualizarStatusAgendamentos() {
        LocalDateTime agora = LocalDateTime.now(ZoneId.of("America/Sao_Paulo"));
        logger.info("Atualizando status dos agendamentos em: {}", agora.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        List<Agendamento> agendamentos = agendamentoRepository
                .findByStatusNot(Agendamento.StatusAgendamento.FINALIZADO);

        for (Agendamento agendamento : agendamentos) {
            LocalDate data = agendamento.getData();
            LocalTime horario = agendamento.getHorario();
            LocalDateTime dataHoraAgendamento = LocalDateTime.of(data, horario).atZone(ZoneId.of("America/Sao_Paulo"))
                    .toLocalDateTime();
            LocalDateTime fimJanelaAtivo = dataHoraAgendamento.plusMinutes(15);

            logger.info(
                    "Agendamento ID: {}, Data: {}, Horário: {}, Status Atual: {}, DataHoraAgendamento: {}, FimJanelaAtivo: {}, Agora: {}",
                    agendamento.getId(), data, horario, agendamento.getStatus(),
                    dataHoraAgendamento.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                    fimJanelaAtivo.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                    agora.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            if (agora.isBefore(dataHoraAgendamento)) {
                if (agendamento.getStatus() != Agendamento.StatusAgendamento.PENDENTE) {
                    agendamento.setStatus(Agendamento.StatusAgendamento.PENDENTE);
                    agendamentoRepository.save(agendamento);
                    logger.info("Agendamento {} mudado para PENDENTE", agendamento.getId());
                }
            } else if (!agora.isBefore(dataHoraAgendamento) && !agora.isAfter(fimJanelaAtivo)) {
                if (agendamento.getStatus() != Agendamento.StatusAgendamento.ATIVO) {
                    agendamento.setStatus(Agendamento.StatusAgendamento.ATIVO);
                    agendamentoRepository.save(agendamento);
                    logger.info("Agendamento {} mudado para ATIVO", agendamento.getId());
                }
            } else if (agora.isAfter(fimJanelaAtivo)) {
                if (agendamento.getStatus() != Agendamento.StatusAgendamento.FINALIZADO) {
                    agendamento.setStatus(Agendamento.StatusAgendamento.FINALIZADO);
                    String barbeiro = agendamento.getBarbeiro();
                    if (!"Sem Preferência".equals(barbeiro)) {
                        Optional<Horario> horarioExistente = horarioRepository.findByDiaSemanaAndHoraAndBarbeiro(
                                data.getDayOfWeek(), horario, barbeiro);
                        horarioExistente.ifPresent(horarioToUnblock -> {
                            horarioToUnblock.setBloqueado(false);
                            horarioRepository.save(horarioToUnblock);
                            logger.info("Horário {} desbloqueado para agendamento {}", horario, agendamento.getId());
                        });
                    }
                    agendamentoRepository.save(agendamento);
                    logger.info("Agendamento {} mudado para FINALIZADO", agendamento.getId());
                }
            }
        }
    }
}