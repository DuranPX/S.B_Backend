package com.SBuses.demo.Service;

import com.SBuses.demo.Models.Role;
import com.SBuses.demo.Repository.RoleRepository;
import com.SBuses.demo.Repository.UserRepository;
import com.SBuses.demo.Security.PermissionValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/** Servicio de gestión de roles y permisos. */
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionValidationService permissionValidationService;

    public List<Role> getAll() {
        return roleRepository.findAll();
    }

    public Optional<Role> getById(String id) {
        return roleRepository.findById(id);
    }

    public Optional<Role> getByNombre(String name) {
        return roleRepository.findByNombre(name);
    }

    public Role create(Role role) {
        if (roleRepository.existsByNombre(role.getNombre())) {
            throw new RuntimeException("Ya existe un rol con ese nombre");
        }
        Role saved = roleRepository.save(role);
        permissionValidationService.refreshCache();
        return saved;
    }

    public Role update(String id, Role role) {
        Role existing = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
        existing.setNombre(role.getNombre());
        existing.setDescripcion(role.getDescripcion());
        existing.setActivo(role.isActivo());
        existing.setPermisos(role.getPermisos());
        Role saved = roleRepository.save(existing);
        permissionValidationService.refreshCache();
        return saved;
    }

    public void delete(String id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        // Validar que no haya usuarios con este rol asignado antes de eliminar
        long usersWithRole = userRepository.countByRolesContaining(role.getNombre());
        if (usersWithRole > 0) {
            throw new RuntimeException(
                    "No se puede eliminar: " + usersWithRole + " usuario(s) tienen el rol '" + role.getNombre() + "' asignado.");
        }

        roleRepository.deleteById(id);
        permissionValidationService.refreshCache();
    }
}