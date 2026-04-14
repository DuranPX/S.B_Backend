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
@Document(collection = "refresh_tokens")
public class RefreshToken {

    @Id
    private String id;

    // ID del usuario al que pertenece
    private String userId;

    // ID de la sesión asociada
    private String sessionId;

    // Hash SHA-256 del token (nunca el valor plano)
    @Indexed(unique = true)
    private String tokenHash;

    // true cuando fue revocado (logout o rotación)
    private boolean revoked;

    // Fecha de expiración
    private Date expiresAt;

    // Fecha de creación
    private Date createdAt;
}