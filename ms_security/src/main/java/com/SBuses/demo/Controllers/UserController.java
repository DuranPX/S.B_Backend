package com.SBuses.demo.Controllers;

import com.SBuses.demo.Models.User;
import com.SBuses.demo.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}