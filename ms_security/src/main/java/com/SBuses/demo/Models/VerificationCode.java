package com.SBuses.demo.Models;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "verification_codes")
public class VerificationCode {

    @Id
    private String id;

    // ID del usuario al que pertenece el código
    private String userId;

    // Código de 6 dígitos enviado al usuario
    private String code;

    // Intentos fallidos (máximo 3 antes de bloquear)
    private int attempts;

    // true cuando el código ya fue verificado exitosamente
    private boolean used;

    // true cuando se superaron los intentos máximos
    private boolean blocked;

    // Fecha de expiración — TTL index configurado en MongoDB (recomendado: 5 min)
    private Date expiresAt;

    // Fecha de creación
    private Date createdAt;
}
