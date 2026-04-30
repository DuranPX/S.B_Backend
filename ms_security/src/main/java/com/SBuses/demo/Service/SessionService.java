package com.SBuses.demo.Service;

import com.SBuses.demo.Models.RefreshToken;
import com.SBuses.demo.Models.Session;
import com.SBuses.demo.Repository.RefreshTokenRepository;
import com.SBuses.demo.Repository.SessionRepository;
import com.SBuses.demo.Security.JWT.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;

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

    /**
     * Crea una nueva sesión para el usuario a partir de un token JWT.
     * PRIMERO elimina cualquier sesión previa del usuario (sesión única).
     */
    public Session createSession(String token) {
        String userId = jwtUtil.getUserIdFromToken(token);
        String jti = jwtUtil.getJtiFromToken(token);

        // Eliminar TODAS las sesiones previas del usuario → sesión única
        sessionRepository.deleteByUserId(userId);

        // Crear la nueva sesión
        Session session = new Session();
        session.setUserId(userId);
        session.setJti(jti);
        session.setActive(true);
        session.setCreatedAt(new Date());
        session.setExpiresAt(new Date(System.currentTimeMillis() + 3600000L)); // 1 hora

        Session savedSession = sessionRepository.save(session);

        // LOG: Registrar en la colección refresh_tokens (como auditoría)
        RefreshToken rtLog = new RefreshToken();
        rtLog.setUserId(userId);
        rtLog.setSessionId(savedSession.getId());
        rtLog.setTokenHash("LOG_" + jti); // Usamos un hash simbólico para el log
        rtLog.setRevoked(false);
        rtLog.setCreatedAt(new Date());
        rtLog.setExpiresAt(session.getExpiresAt());
        refreshTokenRepository.save(rtLog);

        return savedSession;
    }

    /**
     * Verifica si existe una sesión activa para el JTI dado.
     * Retorna true si la sesión existe y está activa.
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
        });
    }

    /**
     * Invalida TODAS las sesiones de un usuario (forzar cierre de sesión global).
     */
    public void invalidateAllSessions(String userId) {
        sessionRepository.deleteByUserId(userId);
    }
}
