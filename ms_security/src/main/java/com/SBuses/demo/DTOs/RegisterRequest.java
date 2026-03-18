package com.SBuses.demo.DTOs;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
    private String name;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
    private String lastName;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$",
            message = "La contraseña debe tener al menos una mayúscula, minúscula, número y carácter especial"
    )
    private String password;

    @NotBlank(message = "El teléfono es obligatorio")
    @Pattern(
            regexp = "^[+]?[0-9]{7,15}$",
            message = "El teléfono no tiene un formato válido"
    )
    private String phone;

    @Size(max = 200, message = "La dirección no puede superar 200 caracteres")
    private String address;
}