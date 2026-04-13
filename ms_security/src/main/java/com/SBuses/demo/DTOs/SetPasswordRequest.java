package com.SBuses.demo.DTOs;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SetPasswordRequest {

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$",
            message = "La contraseña debe tener al menos una mayúscula, minúscula, número y carácter especial"
    )
    private String password;
}
