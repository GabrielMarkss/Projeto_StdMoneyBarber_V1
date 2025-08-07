package com.stmoneybarber.backend.dto;

import com.stmoneybarber.backend.model.Agendamento;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class AgendamentoDTO {
    private Long usuarioId;
    private String barbeiro;
    private List<Long> servicos;
    private LocalDate data;
    private LocalTime horario;
    private double subtotal;
    private double desconto;
    private double total;
    private String cupomNome;
    private Agendamento.StatusAgendamento status;

    // Getters e Setters
    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getBarbeiro() {
        return barbeiro;
    }

    public void setBarbeiro(String barbeiro) {
        this.barbeiro = barbeiro;
    }

    public List<Long> getServicos() {
        return servicos;
    }

    public void setServicos(List<Long> servicos) {
        this.servicos = servicos;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public LocalTime getHorario() {
        return horario;
    }

    public void setHorario(LocalTime horario) {
        this.horario = horario;
    }

    public double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(double subtotal) {
        this.subtotal = subtotal;
    }

    public double getDesconto() {
        return desconto;
    }

    public void setDesconto(double desconto) {
        this.desconto = desconto;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }

    public String getCupomNome() {
        return cupomNome;
    }

    public void setCupomNome(String cupomNome) {
        this.cupomNome = cupomNome;
    }

    public Agendamento.StatusAgendamento getStatus() {
        return status;
    }

    public void setStatus(Agendamento.StatusAgendamento status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return "AgendamentoDTO{" +
                "usuarioId=" + usuarioId +
                ", barbeiro='" + barbeiro + '\'' +
                ", servicos=" + servicos +
                ", data=" + data +
                ", horario=" + horario +
                ", subtotal=" + subtotal +
                ", desconto=" + desconto +
                ", total=" + total +
                ", cupomNome='" + cupomNome + '\'' +
                ", status=" + status +
                '}';
    }
}