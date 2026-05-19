package com.SBuses.demo.DTOs;
import lombok.Data;

// IncidentNotificationRequest.java (DTO)
@Data
public class IncidentNotificationRequest {
    private String tipo;
    private String gravedad;
    private String descripcion;
    private String busPlaca;
    private String fecha;
}