package com.SBuses.demo.Service;

import com.SBuses.demo.Models.User;
import com.SBuses.demo.Repository.UserRepository;
import com.SBuses.demo.Security.JWT.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private UserRepository userRepository;

    // Obtener todos los usuarios
    public List<User> find() {
        return userRepository.findAll();
    }

    // Obtener usuario por id
    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    // Obtener usuario por email
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Valida los datos de entrada y construye el User listo para guardar.
     * Retorna null si el email ya existe.
     */
    public User validateRegister(String name, String lastName, String email,
                                 String password, String phone, String address) {
        // 1. Verificar email duplicado
        if (userRepository.existsByEmail(email)) {
            return null;
        }

        // 2. Construir el User con los campos seguros
        User newUser = new User();
        newUser.setName(name);
        newUser.setLastName(lastName);
        newUser.setEmail(email.toLowerCase().trim());
        newUser.setPassword(encryptionService.encryptPassword(password)); // BCrypt
        newUser.setPhone(phone);
        newUser.setAddress(address);
        newUser.setRegistrationDate(new Date());
        newUser.setLastTime(new Date());
        newUser.setActivo(true);
        newUser.setRoles(new ArrayList<>(List.of("USER")));
        newUser.setAuthExternas(new ArrayList<>());

        return newUser;
    }

    /**
     * Valida las credenciales del usuario y retorna un JWT si son correctas.
     * Retorna null si el email no existe o la contraseña es incorrecta.
     */
    public String login(String email, String password) {

        // 1. Buscar el usuario por email
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return null; // email no existe
        }

        // 2. Verificar que el usuario esté activo
        if (!user.isActivo()) {
            return null; // cuenta desactivada
        }

        // 3. Comparar la contraseña con el hash guardado en BD
        if (!encryptionService.checkPassword(password, user.getPassword())) {
            return null; // contraseña incorrecta
        }

        // 4. Todo correcto — generar y retornar el JWT
        return jwtUtil.generateToken(user.getEmail(), user.getRoles());
    }

    // Crear usuario
    /**
     * Recibe un User ya construido y validado, lo guarda en MongoDB.
     * Reutilizable para cualquier flujo (registro, admin, OAuth2, etc.)
     */
    public User create(User user) {
        return userRepository.save(user);
    }

    // Actualizar usuario
    public User update(String id, User user) {
        User existing = userRepository.findById(id)
                .orElse(null);
        if (existing != null) {
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
        return null;
    }

    // Eliminar usuario
    public boolean delete(String id) {
        User theUser = userRepository.findById(id).orElse(null);
        if (theUser != null) {
            userRepository.delete(theUser);
            return true;
        }
        return false;
    }
}