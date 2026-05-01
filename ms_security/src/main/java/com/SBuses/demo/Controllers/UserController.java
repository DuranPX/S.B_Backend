package com.SBuses.demo.Controllers;

import com.SBuses.demo.DTOs.ChangePasswordRequest;
import com.SBuses.demo.DTOs.SetPasswordRequest;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Repository.UserRepository;
import com.SBuses.demo.Service.EncryptionService;
import com.SBuses.demo.Service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * CRUD de usuarios. ADMIN tiene acceso total, usuarios autenticados acceden a
 * su propio perfil.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'leer')")
    public ResponseEntity<List<User>> getAll() {
        return ResponseEntity.ok(userService.find());
    }

    /**
     * GET /api/users/search?q=texto
     * Busca usuarios por nombre, apellido o email (parcial, case-insensitive).
     * Solo accesible por ADMIN.
     */
    @GetMapping("/search")
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'leer')")
    public ResponseEntity<List<User>> search(
            @RequestParam(name = "q", required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(userService.search(query));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'leer') or #id == principal.id")
    public ResponseEntity<User> getById(@PathVariable String id) {
        User user = userService.findById(id).orElse(null);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'leer') or #email == principal.username")
    public ResponseEntity<User> getByEmail(@PathVariable String email) {
        User user = userService.findByEmail(email).orElse(null);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'escribir')")
    public ResponseEntity<User> create(@RequestBody User user) {
        User created = userService.create(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'editar') or #id == principal.id")
    public ResponseEntity<User> update(@PathVariable String id, @RequestBody User user) {
        User updated = userService.update(id, user);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'eliminar')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        boolean deleted = userService.delete(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/roles/{rolId}")
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'editar')")
    public ResponseEntity<User> assignRole(@PathVariable String id, @PathVariable String rolId) {
        return ResponseEntity.ok(userService.assignRole(id, rolId));
    }

    @DeleteMapping("/{id}/roles/{rolId}")
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'editar')")
    public ResponseEntity<User> removeRole(@PathVariable String id, @PathVariable String rolId) {
        return ResponseEntity.ok(userService.removeRole(id, rolId));
    }

    /**
     * DELETE /api/users/{id}/auth-external/{provider}
     * Desvincula una cuenta OAuth2 externa (google, microsoft, github).
     * El usuario solo puede desvincular sus propias cuentas. ADMIN puede
     * desvincular cualquiera.
     */
    @DeleteMapping("/{id}/auth-external/{provider}")
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'editar') or #id == principal.id")
    public ResponseEntity<?> unlinkAuthExternal(@PathVariable String id, @PathVariable String provider) {
        try {
            User updated = userService.unlinkAuthExternal(id, provider);
            return ResponseEntity.ok(Map.of(
                    "message", "Cuenta de " + provider + " desvinculada exitosamente.",
                    "user", updated));
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
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'leer') or #id == principal.id")
    public ResponseEntity<?> hasPassword(@PathVariable String id) {
        boolean hasPassword = userService.hasPassword(id);
        return ResponseEntity.ok(Map.of("hasPassword", hasPassword));
    }

    /**
     * POST /api/users/{id}/set-password
     * Crea la contraseña para un usuario OAuth2.
     */
    @PostMapping("/{id}/set-password")
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'editar') or #id == principal.id")
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

    /**
     * PUT /api/users/{id}/change-password
     * Cambia la contraseña de un usuario.
     */
    @PutMapping("/{id}/change-password")
    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'usuarios', 'editar') or #id == principal.id")
    public ResponseEntity<?> changePassword(
            @PathVariable String id,
            @RequestBody ChangePasswordRequest request) {

        // Buscar usuario por ID
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Validar contraseña actual
        if (!encryptionService.checkPassword(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        // Validar nueva contraseña
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Las contraseñas no coinciden");
        }

        // Encriptar y guardar nueva contraseña
        user.setPassword(encryptionService.encryptPassword(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok("Contraseña actualizada correctamente");
    }
}