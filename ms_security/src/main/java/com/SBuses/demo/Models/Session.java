package com.SBuses.demo.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "sessions")
public class Session {

    @Id
    private String id;

    // ID del usuario al que pertenece la sesión
    private String userId;

    // JWT ID único (claim "jti" del access token)
    @Indexed(unique = true)
    private String jti;

    // Tipo de token (general o auth_role)
    private String tokenType;

    // Rol activo si el tipo es auth_role
    private String activeRole;

    // Hash SHA-256 del refresh token (nunca el valor plano)
    private String refreshTokenHash;

    // Estado de la sesión
    private boolean isActive;

    // Fecha de expiración
    private Date expiresAt;

    // Fecha de creación
    private Date createdAt;
}