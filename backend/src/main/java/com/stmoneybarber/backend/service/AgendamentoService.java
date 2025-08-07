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
import org.springframework.web.bind.annotation.PostMapping;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

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

        Optional<Horario> horarioExistente = horarioRepository.findByDiaSemanaAndHora(diaSemana, horario);
        if (horarioExistente.isEmpty()) {
            throw new IllegalArgumentException("Horário não cadastrado: " + horario);
        }
        if (horarioExistente.get().isBloqueado()) {
            throw new IllegalArgumentException("Horário já está bloqueado: " + horario);
        }

        for (Long servicoId : agendamento.getServicos()) {
            if (!servicoRepository.existsById(servicoId)) {
                throw new IllegalArgumentException("Serviço inválido: " + servicoId);
            }
        }

        // Garante que o status inicial seja PENDENTE
        agendamento.setStatus(Agendamento.StatusAgendamento.PENDENTE);
        Agendamento novoAgendamento = agendamentoRepository.save(agendamento);

        Horario horarioToBlock = horarioExistente.get();
        horarioToBlock.setBloqueado(true);
        horarioRepository.save(horarioToBlock);

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

        Optional<Horario> novoHorarioExistente = horarioRepository.findByDiaSemanaAndHora(novoDiaSemana, novoHorario);
        if (novoHorarioExistente.isEmpty()) {
            throw new IllegalArgumentException("Novo horário não cadastrado: " + novoHorario);
        }
        if (novoHorarioExistente.get().isBloqueado()) {
            throw new IllegalArgumentException("Novo horário já está bloqueado: " + novoHorario);
        }

        for (Long servicoId : agendamentoAtualizado.getServicos()) {
            if (!servicoRepository.existsById(servicoId)) {
                throw new IllegalArgumentException("Serviço inválido: " + servicoId);
            }
        }

        Agendamento agendamentoAntigo = agendamentoExistente.get();
        LocalDate dataAntiga = agendamentoAntigo.getData();
        LocalTime horarioAntigo = agendamentoAntigo.getHorario();
        if (!dataAntiga.equals(novaData) || !horarioAntigo.equals(novoHorario)) {
            Optional<Horario> horarioAntigoExistente = horarioRepository
                    .findByDiaSemanaAndHora(dataAntiga.getDayOfWeek(), horarioAntigo);
            if (horarioAntigoExistente.isPresent()) {
                Horario horarioToUnblock = horarioAntigoExistente.get();
                horarioToUnblock.setBloqueado(false);
                horarioRepository.save(horarioToUnblock);
                logger.info("Horário antigo desbloqueado: {}", horarioAntigo);
            }
        }

        agendamentoAtualizado.setId(id);
        agendamentoAtualizado.setStatus(agendamentoAntigo.getStatus()); // Preserva o status existente
        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamentoAtualizado);

        Horario horarioToBlock = novoHorarioExistente.get();
        horarioToBlock.setBloqueado(true);
        horarioRepository.save(horarioToBlock);

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
        Optional<Horario> horarioExistente = horarioRepository.findByDiaSemanaAndHora(data.getDayOfWeek(), horario);
        if (horarioExistente.isPresent()) {
            Horario horarioToUnblock = horarioExistente.get();
            horarioToUnblock.setBloqueado(false);
            horarioRepository.save(horarioToUnblock);
            logger.info("Horário desbloqueado: {}", horario);
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

    @Scheduled(fixedRate = 30000, initialDelay = 0) // Check every 30 seconds
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

            // 1. PENDENTE: antes do horário agendado
            if (agora.isBefore(dataHoraAgendamento)) {
                if (agendamento.getStatus() != Agendamento.StatusAgendamento.PENDENTE) {
                    agendamento.setStatus(Agendamento.StatusAgendamento.PENDENTE);
                    agendamentoRepository.save(agendamento);
                    logger.info("Agendamento {} mudado para PENDENTE", agendamento.getId());
                }
            }
            // 2. ATIVO: no horário agendado até 15 minutos após
            else if (!agora.isBefore(dataHoraAgendamento) && !agora.isAfter(fimJanelaAtivo)) {
                if (agendamento.getStatus() != Agendamento.StatusAgendamento.ATIVO) {
                    agendamento.setStatus(Agendamento.StatusAgendamento.ATIVO);
                    agendamentoRepository.save(agendamento);
                    logger.info("Agendamento {} mudado para ATIVO", agendamento.getId());
                }
            }
            // 3. FINALIZADO: após 15 minutos do horário agendado
            else if (agora.isAfter(fimJanelaAtivo)) {
                if (agendamento.getStatus() != Agendamento.StatusAgendamento.FINALIZADO) {
                    agendamento.setStatus(Agendamento.StatusAgendamento.FINALIZADO);
                    Optional<Horario> horarioExistente = horarioRepository.findByDiaSemanaAndHora(
                            data.getDayOfWeek(), horario);
                    if (horarioExistente.isPresent()) {
                        Horario horarioToUnblock = horarioExistente.get();
                        horarioToUnblock.setBloqueado(false);
                        horarioRepository.save(horarioToUnblock);
                        logger.info("Horário {} desbloqueado para agendamento {}", horario, agendamento.getId());
                    }
                    agendamentoRepository.save(agendamento);
                    logger.info("Agendamento {} mudado para FINALIZADO", agendamento.getId());
                }
            }
        }
    }

    @PostMapping("/forcar-atualizacao-status")
    public void forcarAtualizacaoStatus() {
        atualizarStatusAgendamentos();
    }
}