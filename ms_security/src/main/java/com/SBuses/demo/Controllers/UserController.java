package com.SBuses.demo.Controllers;

import com.SBuses.demo.DTOs.SetPasswordRequest;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** CRUD de usuarios. ADMIN tiene acceso total, usuarios autenticados acceden a su propio perfil. */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAll() {
        return ResponseEntity.ok(userService.find());
    }

    /**
     * GET /api/users/search?q=texto
     * Busca usuarios por nombre, apellido o email (parcial, case-insensitive).
     * Solo accesible por ADMIN.
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> search(@RequestParam(name = "q", required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(userService.search(query));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == principal.id")
    public ResponseEntity<User> getById(@PathVariable String id) {
        User user = userService.findById(id).orElse(null);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMIN') or #email == principal.username")
    public ResponseEntity<User> getByEmail(@PathVariable String email) {
        User user = userService.findByEmail(email).orElse(null);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> create(@RequestBody User user) {
        User created = userService.create(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == principal.id")
    public ResponseEntity<User> update(@PathVariable String id, @RequestBody User user) {
        User updated = userService.update(id, user);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        boolean deleted = userService.delete(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/roles/{rolId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> assignRole(@PathVariable String id, @PathVariable String rolId) {
        return ResponseEntity.ok(userService.assignRole(id, rolId));
    }

    @DeleteMapping("/{id}/roles/{rolId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> removeRole(@PathVariable String id, @PathVariable String rolId) {
        return ResponseEntity.ok(userService.removeRole(id, rolId));
    }

    /**
     * DELETE /api/users/{id}/auth-external/{provider}
     * Desvincula una cuenta OAuth2 externa (google, microsoft, github).
     * El usuario solo puede desvincular sus propias cuentas. ADMIN puede desvincular cualquiera.
     */
    @DeleteMapping("/{id}/auth-external/{provider}")
    @PreAuthorize("hasRole('ADMIN') or #id == principal.id")
    public ResponseEntity<?> unlinkAuthExternal(@PathVariable String id, @PathVariable String provider) {
        try {
            User updated = userService.unlinkAuthExternal(id, provider);
            return ResponseEntity.ok(Map.of(
                    "message", "Cuenta de " + provider + " desvinculada exitosamente.",
                    "user", updated
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/users/{id}/has-password
     * Consulta si el usuario tiene contraseña propia.
     */
    @GetMapping("/{id}/has-password")
    @PreAuthorize("hasRole('ADMIN') or #id == principal.id")
    public ResponseEntity<?> hasPassword(@PathVariable String id) {
        boolean hasPassword = userService.hasPassword(id);
        return ResponseEntity.ok(Map.of("hasPassword", hasPassword));
    }

    /**
     * POST /api/users/{id}/set-password
     * Crea la contraseña para un usuario OAuth2.
     */
    @PostMapping("/{id}/set-password")
    @PreAuthorize("hasRole('ADMIN') or #id == principal.id")
    public ResponseEntity<?> setPassword(
            @PathVariable String id,
            @Valid @RequestBody SetPasswordRequest request) {

        boolean updated = userService.setPassword(id, request.getPassword());

        if (!updated) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Usuario no encontrado");
        }

        return ResponseEntity.ok("Contraseña creada exitosamente");
    }
}