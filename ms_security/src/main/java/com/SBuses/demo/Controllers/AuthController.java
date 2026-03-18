package com.SBuses.demo.Controllers;

import com.SBuses.demo.DTOs.LoginRequest;
import com.SBuses.demo.DTOs.RegisterRequest;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * POST /auth/register
     * Recibe los datos del formulario, valida y crea el usuario
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

        // Paso 1: validar datos y construir el User
        User newUser = userService.validateRegister(
                request.getName(),
                request.getLastName(),
                request.getEmail(),
                request.getPassword(),
                request.getPhone(),
                request.getAddress()
        );

        // Paso 2: si validateRegister retornó null, el email ya existe
        if (newUser == null) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)           // 409
                    .body("El email ya está registrado");
        }

        // Paso 3: guardar en MongoDB
        User saved = userService.create(newUser);

        return ResponseEntity
                .status(HttpStatus.CREATED)               // 201
                .body(saved);
    }

    /**
     * POST /auth/login
     * Valida credenciales y retorna un JWT si son correctas.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

        String token = userService.login(request.getEmail(), request.getPassword());

        if (token == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)       // 401
                    .body("Credenciales incorrectas");
        }

        return ResponseEntity
                .status(HttpStatus.OK)                     // 200
                .body(token);
    }
}