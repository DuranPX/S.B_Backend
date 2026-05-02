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
@Document
public class TwoFactorCode {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;          // a qué usuario pertenece este código

    private String codigo;         // el código de 6 dígitos

    private Date expiracion;       // cuándo vence (ahora + 5 minutos)

    private int intentos;          // cuántos intentos fallidos lleva

    private String proposito;      // "REGISTRO" o "LOGIN" o "RECUPERAR_CONTRASEÑA"

    private boolean used;          // true si ya fue validado (historial)
}
