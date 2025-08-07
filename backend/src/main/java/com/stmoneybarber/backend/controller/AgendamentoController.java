package com.stmoneybarber.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.stmoneybarber.backend.dto.AgendamentoDTO;
import com.stmoneybarber.backend.model.Agendamento;
import com.stmoneybarber.backend.service.AgendamentoService;

import java.util.List;

@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {

    private static final Logger logger = LoggerFactory.getLogger(AgendamentoController.class);

    @Autowired
    private AgendamentoService agendamentoService;

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody AgendamentoDTO dto) {
        try {
            logger.info("Recebendo requisição POST /api/agendamentos com payload: {}", dto);
            Agendamento agendamento = new Agendamento();
            agendamento.setUsuarioId(dto.getUsuarioId());
            agendamento.setBarbeiro(dto.getBarbeiro());
            agendamento.setServicos(dto.getServicos());
            agendamento.setData(dto.getData());
            agendamento.setHorario(dto.getHorario());
            agendamento.setSubtotal(dto.getSubtotal());
            agendamento.setDesconto(dto.getDesconto());
            agendamento.setTotal(dto.getTotal());
            agendamento.setCupomNome(dto.getCupomNome());
            // Deixa o AgendamentoService.criar definir o status como PENDENTE
            Agendamento novoAgendamento = agendamentoService.criar(agendamento);
            logger.info("Agendamento criado com sucesso: ID={}, status={}",
                    novoAgendamento.getId(), novoAgendamento.getStatus());
            return ResponseEntity.ok(novoAgendamento);
        } catch (Exception e) {
            logger.error("Erro ao criar agendamento: {}", e.getMessage(), e);
            return ResponseEntity.status(400).body("Erro ao criar agendamento: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody AgendamentoDTO dto) {
        try {
            logger.info("Recebendo requisição PUT /api/agendamentos/{} com payload: {}", id, dto);
            Agendamento agendamento = new Agendamento();
            agendamento.setUsuarioId(dto.getUsuarioId());
            agendamento.setBarbeiro(dto.getBarbeiro());
            agendamento.setServicos(dto.getServicos());
            agendamento.setData(dto.getData());
            agendamento.setHorario(dto.getHorario());
            agendamento.setSubtotal(dto.getSubtotal());
            agendamento.setDesconto(dto.getDesconto());
            agendamento.setTotal(dto.getTotal());
            agendamento.setCupomNome(dto.getCupomNome());
            // Não definir status para preservar o valor existente

            Agendamento agendamentoAtualizado = agendamentoService.atualizar(id, agendamento);
            logger.info("Agendamento atualizado com sucesso: ID={}, status={}",
                    agendamentoAtualizado.getId(), agendamentoAtualizado.getStatus());
            return ResponseEntity.ok(agendamentoAtualizado);
        } catch (Exception e) {
            logger.error("Erro ao atualizar agendamento: {}", e.getMessage(), e);
            return ResponseEntity.status(400).body("Erro ao atualizar agendamento: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        try {
            logger.info("Recebendo requisição DELETE /api/agendamentos/{}", id);
            agendamentoService.deletar(id);
            logger.info("Agendamento deletado com sucesso: {}", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Erro ao deletar agendamento: {}", e.getMessage(), e);
            return ResponseEntity.status(400).body("Erro ao deletar agendamento: " + e.getMessage());
        }
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Agendamento>> listarPorUsuario(@PathVariable Long usuarioId) {
        logger.info("Recebendo requisição GET /api/agendamentos/usuario/{}", usuarioId);
        List<Agendamento> agendamentos = agendamentoService.listarPorUsuario(usuarioId);
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/todos")
    public ResponseEntity<List<Agendamento>> listarTodos() {
        logger.info("Recebendo requisição GET /api/agendamentos/todos");
        List<Agendamento> agendamentos = agendamentoService.listarTodos();
        return ResponseEntity.ok(agendamentos);
    }
}