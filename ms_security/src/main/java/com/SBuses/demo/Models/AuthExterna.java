package com.SBuses.demo.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthExterna {

    private String proveedor;  // "google" | "microsoft" | "github"

    private String idExterno;

    private String email;

    private String tokenAcceso;

    private Date fechaVinculacion;
}