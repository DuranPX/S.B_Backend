package com.SBuses.demo.Service;

import com.SBuses.demo.Models.User;
import com.SBuses.demo.Repository.RoleRepository;
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

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private GmailService gmailService;

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

    // Buscar usuarios por nombre o email (parcial, case-insensitive)
    public List<User> search(String query) {
        if (query == null || query.isBlank()) {
            return userRepository.findAll();
        }
        return userRepository.searchByNameOrEmail(query.trim());
    }

    /**
     * Valida los datos de entrada y construye el User listo para guardar.
     * Retorna null si el email ya existe.
     */
    public User validateRegister(String name, String lastName, String email,
                                 String password, String phone, String address) {
        // Verificar email duplicado
        if (userRepository.existsByEmail(email)) {
            return null;
        }

        // Construir el User con los campos seguros
        User newUser = new User();
        newUser.setName(name);
        newUser.setLastName(lastName);
        newUser.setEmail(email.toLowerCase().trim());
        newUser.setPassword(encryptionService.encryptPassword(password)); // BCrypt
        newUser.setPhone(phone);
        newUser.setAddress(address); // se activa cuando verifica el código 2FA
        newUser.setRegistrationDate(new Date());
        newUser.setLastTime(new Date());
        newUser.setActivo(false);
        newUser.setRoles(new ArrayList<>(List.of("Ciudadano")));
        newUser.setAuthExternals(new ArrayList<>());

        return newUser;
    }

    /**
     * Valida las credenciales del usuario y retorna un JWT si son correctas.
     * Retorna null si el email no existe o la contraseña es incorrecta.
     */
    public String login(String email, String password) {

        // Buscar el usuario por email
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return null;
        }

        // Verificar que el usuario esté activo
        if (!user.isActivo()) {
            return "INACTIVO"; // cuenta no verificada aún
        }

        // Comparar la contraseña con el hash guardado en BD
        if (!encryptionService.checkPassword(password, user.getPassword())) {
            return null;
        }

        // Credenciales correctas — disparar 2FA en vez de devolver JWT directamente
        return "2FA_REQUERIDO";
    }

    // Crear usuario
    /**
     * Recibe un User ya construido y validado, lo guarda en MongoDB.
     * Reutilizable para cualquier flujo (registro, admin, OAuth2, etc.)
     */
    public User create(User user) {
        return userRepository.save(user);
    }

    // Actualizar usuario (Null-safe para actualizaciones parciales)
    public User update(String id, User user) {
        User existing = userRepository.findById(id).orElse(null);
        if (existing != null) {
            if (user.getName() != null && !user.getName().isBlank()) existing.setName(user.getName());
            if (user.getLastName() != null && !user.getLastName().isBlank()) existing.setLastName(user.getLastName());
            if (user.getEmail() != null && !user.getEmail().isBlank()) existing.setEmail(user.getEmail());
            if (user.getPhone() != null && !user.getPhone().isBlank()) existing.setPhone(user.getPhone());
            if (user.getAddress() != null && !user.getAddress().isBlank()) existing.setAddress(user.getAddress());
            if (user.getPhoto() != null && !user.getPhoto().isBlank()) existing.setPhoto(user.getPhoto());
            
            // Solo actualizar activo si se envía explícitamente (se asume booleano en el body)
            // existing.setActivo(user.isActivo()); // Comentado o condicional si fuera necesario
            
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                existing.setRoles(user.getRoles());
            }
            
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

    // Asignar rol a usuario (con notificación por email)
    public User assignRole(String userId, String rolId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!roleRepository.existsByNombre(rolId)) {
            throw new RuntimeException("Rol no encontrado");
        }

        if (user.getRoles() == null) {
            user.setRoles(new ArrayList<>());
        }

        if (user.getRoles().contains(rolId)) {
            throw new RuntimeException("El usuario ya tiene ese rol");
        }

        user.getRoles().add(rolId);
        User saved = userRepository.save(user);

        // Notificar al usuario por email del cambio de roles
        try {
            String html = gmailService.buildRoleChangeEmailHtml(
                    user.getName(), rolId, "asignado");
            gmailService.sendEmail(user.getEmail(), "Cambio en tus roles - Sistema de Buses", html);
        } catch (Exception e) {
            System.err.println("Error al enviar notificación de cambio de rol: " + e.getMessage());
        }

        return saved;
    }

    // Quitar rol a usuario (con notificación por email)
    public User removeRole(String userId, String rolId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (user.getRoles() == null || !user.getRoles().contains(rolId)) {
            throw new RuntimeException("El usuario no tiene ese rol");
        }

        user.getRoles().remove(rolId);
        User saved = userRepository.save(user);

        // Notificar al usuario por email del cambio de roles
        try {
            String html = gmailService.buildRoleChangeEmailHtml(
                    user.getName(), rolId, "removido");
            gmailService.sendEmail(user.getEmail(), "Cambio en tus roles - Sistema de Buses", html);
        } catch (Exception e) {
            System.err.println("Error al enviar notificación de cambio de rol: " + e.getMessage());
        }

        return saved;
    }

    // Desvincular cuenta OAuth2 externa (Google, Microsoft, GitHub)
    public User unlinkAuthExternal(String userId, String provider) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (user.getAuthExternals() == null || user.getAuthExternals().isEmpty()) {
            throw new RuntimeException("El usuario no tiene cuentas externas vinculadas");
        }

        boolean removed = user.getAuthExternals().removeIf(
                ext -> ext.getProveedor().equalsIgnoreCase(provider));

        if (!removed) {
            throw new RuntimeException("No se encontró vinculación con el proveedor: " + provider);
        }

        // Si el usuario no tiene contraseña local y desvincula su única cuenta externa, bloquear
        boolean hasPassword = user.getPassword() != null && !user.getPassword().isBlank();
        boolean hasOtherExternals = !user.getAuthExternals().isEmpty();
        if (!hasPassword && !hasOtherExternals) {
            throw new RuntimeException(
                    "No puedes desvincular tu única forma de acceso. Establece una contraseña primero.");
        }

        return userRepository.save(user);
    }

    // Activar al usuario
    public void activateUser(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            user.setActivo(true);
            userRepository.save(user);
        }
    }

    // Resetear la contraseña
    public boolean resetPassword(String email, String newPassword) {

        // Buscar el usuario
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

        // Encriptar la nueva contraseña con BCrypt
        user.setPassword(encryptionService.encryptPassword(newPassword));

        // Actualizar en MongoDB
        userRepository.save(user);
        return true;
    }
}