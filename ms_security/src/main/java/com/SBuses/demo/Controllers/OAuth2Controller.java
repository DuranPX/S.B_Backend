package com.SBuses.demo.Controllers;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth/oauth2")
@RequiredArgsConstructor
public class OAuth2Controller {

    @GetMapping("/failure")
    public ResponseEntity<?> failure() {
        return ResponseEntity.status(401).body(Map.of("error", "Error al autenticar con Google"));
    }
}