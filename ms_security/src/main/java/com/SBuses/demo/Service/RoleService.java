package com.SBuses.demo.Service;

import com.SBuses.demo.Models.Role;
import com.SBuses.demo.Repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    // Obtener todos los roles
    public List<Role> getAll() {
        return roleRepository.findAll();
    }

    // Obtener rol por id
    public Optional<Role> getById(String id) {
        return roleRepository.findById(id);
    }

    // Obtener rol por nombre
    public Optional<Role> getByNombre(String name) {
        return roleRepository.findByName((name));
    }

    // Crear rol
    public Role create(Role role) {
        if (roleRepository.existsByName(role.getName())) {
            throw new RuntimeException("Ya existe un rol con ese nombre");
        }
        return roleRepository.save(role);
    }

    // Actualizar rol
    public Role update(String id, Role role) {
        Role existing = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
        existing.setName(role.getName());
        existing.setDescription(role.getDescription());
        existing.setActivo(role.isActivo());
        existing.setPermisos(role.getPermisos());
        return roleRepository.save(existing);
    }

    // Eliminar rol
    public void delete(String id) {
        if (!roleRepository.existsById(id)) {
            throw new RuntimeException("Rol no encontrado");
        }
        roleRepository.deleteById(id);
    }
}