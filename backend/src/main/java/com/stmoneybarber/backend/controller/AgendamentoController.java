package com.stmoneybarber.backend.controller;

import com.stmoneybarber.backend.model.Agendamento;
import com.stmoneybarber.backend.repository.AgendamentoRepository;
import com.stmoneybarber.backend.service.AgendamentoService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    private final AgendamentoService service;

    public AgendamentoController(AgendamentoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Agendamento> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/dia/{dia}")
    public List<Agendamento> listarPorDia(@PathVariable String dia) {
        DayOfWeek diaEnum = DayOfWeek.valueOf(dia.toUpperCase());
        return service.listarPorDia(diaEnum);
    }

    @GetMapping("/id/{id}")
    public Agendamento buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id).orElseThrow();
    }

    @PostMapping("/criar")
    public void criar(@RequestBody Agendamento agendamento) {
        service.criar(agendamento);
    }

    @PutMapping("/editar")
    public Agendamento editar(@RequestBody Agendamento agendamento) {
        return service.editar(agendamento);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarPorId(@PathVariable Long id) {
        if (!agendamentoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        agendamentoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/deletar-muitos")
    public ResponseEntity<Void> deletarVarios(@RequestBody List<Long> ids) {
        agendamentoRepository.deleteAllById(ids);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/toggle-bloqueio-horario/{id}")
    public void toggleBloqueioHorario(@PathVariable Long id) {
        service.toggleBloqueioHorario(id);
    }

    @PostMapping("/toggle-bloqueio-dia/{dia}")
    public void toggleBloqueioDia(@PathVariable String dia) {
        DayOfWeek diaEnum = DayOfWeek.valueOf(dia.toUpperCase());
        service.toggleBloqueioDia(diaEnum);
    }
}