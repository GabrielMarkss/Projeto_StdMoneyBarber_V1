package com.stmoneybarber.backend.service;

import com.stmoneybarber.backend.model.Agendamento;
import com.stmoneybarber.backend.model.Horario;
import com.stmoneybarber.backend.repository.AgendamentoRepository;
import com.stmoneybarber.backend.repository.HorarioRepository;
import com.stmoneybarber.backend.repository.ServicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class AgendamentoService {

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    @Autowired
    private HorarioRepository horarioRepository;

    @Autowired
    private ServicoRepository servicoRepository;

    public Agendamento criar(Agendamento agendamento) {
        // Validações iniciais
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

        // Verifica se o horário existe e não está bloqueado
        Optional<Horario> horarioExistente = horarioRepository.findByDiaSemanaAndHora(diaSemana, horario);
        if (horarioExistente.isEmpty()) {
            throw new IllegalArgumentException("Horário não cadastrado: " + horario);
        }
        if (horarioExistente.get().isBloqueado()) {
            throw new IllegalArgumentException("Horário já está bloqueado: " + horario);
        }

        // Valida serviços
        for (Long servicoId : agendamento.getServicos()) {
            if (!servicoRepository.existsById(servicoId)) {
                throw new IllegalArgumentException("Serviço inválido: " + servicoId);
            }
        }

        // Salva o agendamento
        Agendamento novoAgendamento = agendamentoRepository.save(agendamento);

        // Bloqueia o horário
        Horario horarioToBlock = horarioExistente.get();
        horarioToBlock.setBloqueado(true);
        horarioRepository.save(horarioToBlock);

        return novoAgendamento;
    }

    public Agendamento atualizar(Long id, Agendamento agendamentoAtualizado) {
        // Verifica se o agendamento existe
        Optional<Agendamento> agendamentoExistente = agendamentoRepository.findById(id);
        if (agendamentoExistente.isEmpty()) {
            throw new IllegalArgumentException("Agendamento não encontrado: " + id);
        }

        // Validações
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

        // Verifica se o novo horário existe e não está bloqueado
        Optional<Horario> novoHorarioExistente = horarioRepository.findByDiaSemanaAndHora(novoDiaSemana, novoHorario);
        if (novoHorarioExistente.isEmpty()) {
            throw new IllegalArgumentException("Novo horário não cadastrado: " + novoHorario);
        }
        if (novoHorarioExistente.get().isBloqueado()) {
            throw new IllegalArgumentException("Novo horário já está bloqueado: " + novoHorario);
        }

        // Valida serviços
        for (Long servicoId : agendamentoAtualizado.getServicos()) {
            if (!servicoRepository.existsById(servicoId)) {
                throw new IllegalArgumentException("Serviço inválido: " + servicoId);
            }
        }

        // Desbloqueia o horário antigo, se for diferente do novo
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
            }
        }

        // Atualiza o agendamento
        agendamentoAtualizado.setId(id);
        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamentoAtualizado);

        // Bloqueia o novo horário
        Horario horarioToBlock = novoHorarioExistente.get();
        horarioToBlock.setBloqueado(true);
        horarioRepository.save(horarioToBlock);

        return agendamentoSalvo;
    }

    public void deletar(Long id) {
        // Verifica se o agendamento existe
        Optional<Agendamento> agendamentoExistente = agendamentoRepository.findById(id);
        if (agendamentoExistente.isEmpty()) {
            throw new IllegalArgumentException("Agendamento não encontrado: " + id);
        }

        // Desbloqueia o horário associado
        Agendamento agendamento = agendamentoExistente.get();
        LocalDate data = agendamento.getData();
        LocalTime horario = agendamento.getHorario();
        Optional<Horario> horarioExistente = horarioRepository.findByDiaSemanaAndHora(data.getDayOfWeek(), horario);
        if (horarioExistente.isPresent()) {
            Horario horarioToUnblock = horarioExistente.get();
            horarioToUnblock.setBloqueado(false);
            horarioRepository.save(horarioToUnblock);
        }

        // Deleta o agendamento
        agendamentoRepository.deleteById(id);
    }

    public List<Agendamento> listarPorUsuario(Long usuarioId) {
        return agendamentoRepository.findByUsuarioId(usuarioId);
    }

    public List<Agendamento> listarTodos() {
        return agendamentoRepository.findAll();
    }
}