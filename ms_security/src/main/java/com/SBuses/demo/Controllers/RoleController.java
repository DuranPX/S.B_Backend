package com.SBuses.demo.Controllers;

import com.SBuses.demo.Models.Role;
import com.SBuses.demo.Service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** CRUD de roles del sistema. Acceso restringido a ADMIN. */
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'roles', 'leer')")
    @GetMapping
    public ResponseEntity<List<Role>> getAll() {
        return ResponseEntity.ok(roleService.getAll());
    }

    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'roles', 'leer')")
    @GetMapping("/{id}")
    public ResponseEntity<Role> getById(@PathVariable String id) {
        return roleService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'roles', 'escribir')")
    @PostMapping
    public ResponseEntity<Role> create(@RequestBody Role role) {
        return ResponseEntity.ok(roleService.create(role));
    }

    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'roles', 'editar')")
    @PutMapping("/{id}")
    public ResponseEntity<Role> update(@PathVariable String id, @RequestBody Role role) {
        return ResponseEntity.ok(roleService.update(id, role));
    }

    @PreAuthorize("@permissionValidationService.hasPermission(authentication, 'roles', 'eliminar')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}