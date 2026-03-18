package com.SBuses.demo.Service;

import com.SBuses.demo.Models.User;
import com.SBuses.demo.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.SBuses.demo.Repository.RoleRepository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    // Obtener todos los usuarios
    public List<User> getAll() {
        return userRepository.findAll();
    }

    // Obtener usuario por id
    public Optional<User> getById(String id) {
        return userRepository.findById(id);
    }

    // Obtener usuario por email
    public Optional<User> getByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Crear usuario
    public User create(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Ya existe un usuario con ese email");
        }
        user.setRegistrationDate(new Date());
        return userRepository.save(user);
    }

    // Actualizar usuario
    public User update(String id, User user) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        existing.setName(user.getName());
        existing.setLastName(user.getLastName());
        existing.setEmail(user.getEmail());
        existing.setPhone(user.getPhone());
        existing.setAddress(user.getAddress());
        existing.setPhoto(user.getPhoto());
        existing.setActivo(user.isActivo());
        existing.setRoles(user.getRoles());
        return userRepository.save(existing);
    }

    // Eliminar usuario
    public void delete(String id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Usuario no encontrado");
        }
        userRepository.deleteById(id);
    }
    // Asignar rol a usuario
    public User assignRole(String userId, String rolId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!roleRepository.existsById(rolId)) {
            throw new RuntimeException("Rol no encontrado");
        }

        if (user.getRoles().contains(rolId)) {
            throw new RuntimeException("El usuario ya tiene ese rol");
        }

        user.getRoles().add(rolId);
        return userRepository.save(user);
    }

    // Quitar rol a usuario
    public User removeRole(String userId, String rolId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!user.getRoles().contains(rolId)) {
            throw new RuntimeException("El usuario no tiene ese rol");
        }

        user.getRoles().remove(rolId);
        return userRepository.save(user);
    }
}