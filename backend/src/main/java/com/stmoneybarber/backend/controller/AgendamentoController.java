package com.stmoneybarber.backend.controller;

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

    @Autowired
    private AgendamentoService agendamentoService;

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody AgendamentoDTO dto) {
        try {
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

            Agendamento novoAgendamento = agendamentoService.criar(agendamento);
            return ResponseEntity.ok(novoAgendamento);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Erro ao criar agendamento: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody AgendamentoDTO dto) {
        try {
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

            Agendamento agendamentoAtualizado = agendamentoService.atualizar(id, agendamento);
            return ResponseEntity.ok(agendamentoAtualizado);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Erro ao atualizar agendamento: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        try {
            agendamentoService.deletar(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Erro ao deletar agendamento: " + e.getMessage());
        }
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Agendamento>> listarPorUsuario(@PathVariable Long usuarioId) {
        List<Agendamento> agendamentos = agendamentoService.listarPorUsuario(usuarioId);
        return ResponseEntity.ok(agendamentos);
    }

    @GetMapping("/todos")
    public ResponseEntity<List<Agendamento>> listarTodos() {
        List<Agendamento> agendamentos = agendamentoService.listarTodos();
        return ResponseEntity.ok(agendamentos);
    }
}