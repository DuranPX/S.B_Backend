package com.SBuses.demo.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthExternal {

    private String proveedor;  // "google" | "microsoft" | "github" | providerType

    private String idExterno; // providerId

    private String email;

    private String tokenAcceso;

    private Date fechaVinculacion;
}