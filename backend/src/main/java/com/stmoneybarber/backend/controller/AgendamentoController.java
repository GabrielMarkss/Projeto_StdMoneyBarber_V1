package com.stmoneybarber.backend.controller;

import com.stmoneybarber.backend.model.Agendamento;
import com.stmoneybarber.backend.service.AgendamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.List;

@RestController
@RequestMapping("/api/horarios")
public class AgendamentoController {

    @Autowired
    private AgendamentoService agendamentoService;

    @GetMapping
    public List<Agendamento> listar() {
        return agendamentoService.listarTodos();
    }

    @PostMapping
    public Agendamento criar(@RequestBody Agendamento horario) {
        return agendamentoService.criar(horario);
    }

    @PutMapping("/{id}")
    public Agendamento editar(@PathVariable Long id, @RequestBody Agendamento horario) {
        return agendamentoService.editar(id, horario);
    }

    @PostMapping("/deletar")
    public void deletarHorarios(@RequestBody List<Long> ids) {
        agendamentoService.deletarTodos(ids);
    }

    @PostMapping("/bloquear")
    public void bloquearHorarios(@RequestBody List<Long> ids) {
        agendamentoService.bloquearHorarios(ids);
    }

    @PostMapping("/desbloquear")
    public void desbloquearHorarios(@RequestBody List<Long> ids) {
        agendamentoService.desbloquearHorarios(ids);
    }

    @GetMapping("/verificar-dia")
    public boolean isDiaBloqueado(@RequestParam("dia") DayOfWeek dia) {
        return agendamentoService.isDiaBloqueado(dia);
    }
}
