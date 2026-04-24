package com.SBuses.demo.Service;

import com.SBuses.demo.Models.RefreshToken;
import com.SBuses.demo.Models.Session;
import com.SBuses.demo.Repository.RefreshTokenRepository;
import com.SBuses.demo.Repository.SessionRepository;
import com.SBuses.demo.Repository.UserRepository;
import com.SBuses.demo.Security.JWT.JwtUtil;
import com.SBuses.demo.Models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;

import java.util.UUID;
import java.util.Optional;
import com.SBuses.demo.DTOs.JwtResponse;
import com.SBuses.demo.Service.EncryptionService;

/**
 * Servicio de gestión de sesiones.
 * Garantiza que cada usuario solo tenga UNA sesión activa a la vez.
 * Cuando se crea una nueva sesión, todas las anteriores son eliminadas.
 */
@Service
public class SessionService {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EncryptionService encryptionService;

    private static final long REFRESH_TOKEN_EXPIRATION = 86400000L; // 1 día (24h)

    /**
     * Crea una nueva sesión para el usuario a partir de un token JWT.
     * Genera un Refresh Token real, lo hashea y lo devuelve junto al JWT.
     */
    public JwtResponse createSession(String token) {
        String userId = jwtUtil.getUserIdFromToken(token);
        String jti = jwtUtil.getJtiFromToken(token);
        String tokenType = jwtUtil.getTokenTypeFromToken(token);
        java.util.List<String> roles = jwtUtil.getRolesFromToken(token);
        String activeRole = (tokenType.equals("auth_role") && roles != null && !roles.isEmpty()) ? roles.get(0) : null;

        // Eliminar TODAS las sesiones previas del usuario → sesión única
        sessionRepository.deleteByUserId(userId);

        // Generar Refresh Token aleatorio (UUID)
        String plainRefreshToken = UUID.randomUUID().toString();
        String hash = encryptionService.hashValue(plainRefreshToken);

        // Crear la nueva sesión
        Session session = new Session();
        session.setUserId(userId);
        session.setJti(jti);
        session.setTokenType(tokenType);
        session.setActiveRole(activeRole);
        session.setRefreshTokenHash(hash);
        session.setActive(true);
        session.setCreatedAt(new Date());
        session.setExpiresAt(new Date(System.currentTimeMillis() + 3600000L)); // 1 hora (mismo que JWT)

        Session savedSession = sessionRepository.save(session);

        // Guardar el Refresh Token en su colección
        RefreshToken rt = new RefreshToken();
        rt.setUserId(userId);
        rt.setSessionId(savedSession.getId());
        rt.setTokenHash(hash);
        rt.setRevoked(false);
        rt.setCreatedAt(new Date());
        rt.setExpiresAt(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION));
        refreshTokenRepository.save(rt);

        return new JwtResponse(token, plainRefreshToken);
    }

    /**
     * Renueva el Access Token y el Refresh Token usando un Refresh Token válido.
     * Mantiene el principio POLP al re-emitir el mismo tipo de token (general o auth_role).
     */
    public JwtResponse refreshSession(String plainRefreshToken) {
        String hash = encryptionService.hashValue(plainRefreshToken);

        RefreshToken rt = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new RuntimeException("Refresh Token no encontrado o inválido"));

        if (rt.isRevoked() || rt.getExpiresAt().before(new Date())) {
            throw new RuntimeException("Refresh Token expirado o revocado");
        }

        Session session = sessionRepository.findById(rt.getSessionId())
                .orElseThrow(() -> new RuntimeException("Sesión no encontrada"));

        if (!session.isActive()) {
            throw new RuntimeException("La sesión asociada ya no está activa");
        }

        com.SBuses.demo.Models.User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Generar nuevo JWT respetando el tipo original (POLP)
        String newToken;
        if ("general".equals(session.getTokenType())) {
            newToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRoles());
        } else {
            newToken = jwtUtil.generateTokenForRole(user.getId(), user.getEmail(), session.getActiveRole());
        }

        // Rotación: createSession invalidará la sesión actual automáticamente por UserId
        return createSession(newToken);
    }

    /**
     * Verifica si existe una sesión activa para el JTI dado.
     */
    public boolean isSessionActive(String jti) {
        return sessionRepository.findByJtiAndIsActive(jti, true).isPresent();
    }

    /**
     * Invalida la sesión asociada al JTI (logout).
     */
    public void invalidateSession(String jti) {
        sessionRepository.findByJti(jti).ifPresent(session -> {
            session.setActive(false);
            sessionRepository.save(session);
            
            // También revocar el refresh token asociado si existe
            refreshTokenRepository.findByTokenHash(session.getRefreshTokenHash()).ifPresent(rt -> {
                rt.setRevoked(true);
                refreshTokenRepository.save(rt);
            });
        });
    }

    /**
     * Invalida TODAS las sesiones de un usuario.
     */
    public void invalidateAllSessions(String userId) {
        sessionRepository.deleteByUserId(userId);
    }
}