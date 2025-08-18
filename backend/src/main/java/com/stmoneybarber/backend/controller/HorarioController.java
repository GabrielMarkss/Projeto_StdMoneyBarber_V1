package com.stmoneybarber.backend.controller;

import com.stmoneybarber.backend.model.Horario;
import com.stmoneybarber.backend.service.HorarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/horarios")
public class HorarioController {

    @Autowired
    private HorarioService horarioService;

    @GetMapping
    public List<Horario> listar() {
        return horarioService.listarTodos();
    }

    @PostMapping
    public List<Horario> criar(@RequestBody Horario horario) {
        return horarioService.criar(horario);
    }

    @PutMapping("/{id}")
    public Horario editar(@PathVariable Long id, @RequestBody Horario horario) {
        return horarioService.editar(id, horario);
    }

    @PostMapping("/deletar")
    public void deletarHorarios(@RequestBody List<Long> ids) {
        horarioService.deletarTodos(ids);
    }

    @PostMapping("/bloquear")
    public void bloquearHorarios(@RequestBody List<Long> ids) {
        horarioService.bloquearHorarios(ids);
    }

    @PostMapping("/desbloquear")
    public void desbloquearHorarios(@RequestBody List<Long> ids) {
        horarioService.desbloquearHorarios(ids);
    }

    @GetMapping("/verificar-dia")
    public boolean isDiaBloqueado(@RequestParam("dia") DayOfWeek dia) {
        return horarioService.isDiaBloqueado(dia);
    }

    @GetMapping("/disponiveis")
    public List<Horario> listarHorariosDisponiveis(
            @RequestParam("data") LocalDate data,
            @RequestParam("barbeiro") String barbeiro) {
        return horarioService.listarHorariosDisponiveis(data, barbeiro);
    }
}