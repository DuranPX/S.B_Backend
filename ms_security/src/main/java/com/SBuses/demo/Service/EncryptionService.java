package com.SBuses.demo.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class EncryptionService {

    @Autowired
    private PasswordEncoder passwordEncoder;

    public String encryptPassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    // Para verificar login: compara la contraseña en texto plano con el hash guardado
    public boolean checkPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }

    /**
     * Genera un hash SHA-256 para tokens de sesión (más rápido que BCrypt).
     */
    public String hashValue(String value) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(value.getBytes());
            return java.util.Base64.getEncoder().encodeToString(encodedhash);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("Error fatal en algoritmo de hash", e);
        }
    }
}