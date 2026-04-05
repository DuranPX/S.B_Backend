package com.SBuses.demo.Controllers;

import com.SBuses.demo.Models.AuthExterna;
import com.SBuses.demo.Models.Role;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Repository.RoleRepository;
import com.SBuses.demo.Repository.UserRepository;
import com.SBuses.demo.Security.JWT.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth/oauth2")
@RequiredArgsConstructor
public class OAuth2Controller {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;

    @GetMapping("/success")
    public ResponseEntity<?> success(Authentication authentication) {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

        // GitHub devuelve "login" en vez de "given_name"
        // Google devuelve "email" directamente
        String email = oauth2User.getAttribute("email") != null
                ? oauth2User.getAttribute("email")
                : oauth2User.getAttribute("preferred_username");
        String name = oauth2User.getAttribute("given_name") != null
                ? oauth2User.getAttribute("given_name")
                : oauth2User.getAttribute("login");
        String lastName = oauth2User.getAttribute("family_name") != null
                ? oauth2User.getAttribute("family_name")
                : "";
        String providerId = oauth2User.getAttribute("sub") != null
                ? oauth2User.getAttribute("sub").toString()
                : String.valueOf(oauth2User.getAttribute("id"));

        // Detectar proveedor
        String proveedor;
        if (oauth2User.getAttribute("sub") != null && oauth2User.getAttribute("login") == null) {
            proveedor = oauth2User.getAttribute("iss") != null &&
                    oauth2User.getAttribute("iss").toString().contains("microsoft")
                    ? "microsoft" : "google";
        } else {
            proveedor = "github";
        }

        // Buscar si ya existe en MongoDB
        User user = userRepository.findByEmail(email).orElseGet(() -> {

            Role rolCiudadano = roleRepository.findByName("Ciudadano")
                    .orElseThrow(() -> new RuntimeException("Rol Ciudadano no encontrado"));

            User newUser = new User();
            newUser.setName(name);
            newUser.setLastName(lastName);
            newUser.setEmail(email);
            newUser.setPassword(null);
            newUser.setActivo(true);
            newUser.setRegistrationDate(new Date());
            newUser.setRoles(new ArrayList<>(List.of(rolCiudadano.getId())));

            AuthExterna authExterna = new AuthExterna();
            authExterna.setProveedor(proveedor);
            authExterna.setIdExterno(providerId);
            authExterna.setEmail(email);
            authExterna.setFechaVinculacion(new Date());
            newUser.setAuthExternas(new ArrayList<>(List.of(authExterna)));

            return userRepository.save(newUser);
        });

        String token = jwtUtil.generateToken(email, user.getRoles());

        return ResponseEntity.ok(Map.of("token", token));
    }
    @GetMapping("/failure")
    public ResponseEntity<?> failure() {
        return ResponseEntity.status(401).body(Map.of("error", "Error al autenticar con Google"));
    }
}