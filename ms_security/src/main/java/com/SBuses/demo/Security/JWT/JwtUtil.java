package com.SBuses.demo.Security.JWT;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:3600000}")
    private long expiration; // 1 hora en milisegundos por defecto

    // Genera la clave a partir del secret del .env
    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // GENERAR token general (después del login/2FA)
    public String generateToken(String email, List<String> roles) {
        return Jwts.builder()
                .subject(email)                          // quien es el usuario
                .claim("roles", roles)                   // sus roles dentro del token
                .claim("token_type", "general")          // para diferenciar de auth_role
                .issuedAt(new Date())                    // cuándo se creó
                .expiration(new Date(System.currentTimeMillis() + expiration)) // cuándo vence
                .signWith(getKey())                      // firma con HMAC
                .compact();
    }

    // GENERAR token definitivo (después de seleccionar rol)
    public String generateTokenForRole(String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("roles", List.of(role))           // solo el rol activo en sesión
                .claim("token_type", "auth_role")        // token definitivo
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    // ─────────────────────────────────────────────
    // VALIDAR token
    // ─────────────────────────────────────────────
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false; // token inválido, expirado o manipulado
        }
    }

    // ─────────────────────────────────────────────
    // LEER datos del token
    // ─────────────────────────────────────────────
    public String getEmailFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public String getTokenTypeFromToken(String token) {
        return getClaims(token).get("token_type", String.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        return getClaims(token).get("roles", List.class);
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
