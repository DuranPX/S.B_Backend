package com.SBuses.demo.DTOs;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SelectRoleRequest {

    @NotBlank(message = "El nombre del rol es obligatorio")
    private String role; // Nombre del rol a seleccionar (ej. "USER", "ADMIN")

}
