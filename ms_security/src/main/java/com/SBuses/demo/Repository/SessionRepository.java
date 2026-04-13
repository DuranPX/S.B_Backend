package com.SBuses.demo.Repository;

import com.SBuses.demo.Models.Session;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SessionRepository extends MongoRepository<Session, String> {

    // Buscar sesión activa por JTI (para validar en JwtFilter)
    Optional<Session> findByJtiAndIsActive(String jti, boolean isActive);

    // Buscar sesión por JTI
    Optional<Session> findByJti(String jti);

    // Invalidar todas las sesiones activas de un usuario (forzar sesión única)
    void deleteByUserId(String userId);
}
