package com.SBuses.demo.Security.JWT;

import com.SBuses.demo.Service.SessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Interceptor JWT que valida tokens y configura el SecurityContext con UserPrincipal.
 * Ahora también verifica que el JTI del token corresponda a una sesión activa en MongoDB,
 * garantizando que solo UNA sesión por usuario sea válida.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private SessionService sessionService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.validateToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Token inválido o expirado\"}");
            return;
        }

        // Verificar que el JTI del token corresponda a una sesión activa
        String jti = jwtUtil.getJtiFromToken(token);
        if (!sessionService.isSessionActive(jti)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Sesión expirada o invalidada. Inicia sesión nuevamente.\"}");
            return;
        }

        String email = jwtUtil.getEmailFromToken(token);

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            String tokenType = jwtUtil.getTokenTypeFromToken(token);
            String userId = jwtUtil.getUserIdFromToken(token);
            List<SimpleGrantedAuthority> authorities;

            if ("general".equals(tokenType)) {
                authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_PRE_AUTH")
                );
            } else {
                List<String> rolesFromToken = jwtUtil.getRolesFromToken(token);
                authorities = rolesFromToken.stream()
                                  .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                                  .collect(Collectors.toList());
            }

            com.SBuses.demo.Security.UserPrincipal principal = new com.SBuses.demo.Security.UserPrincipal(
                    userId, email, authorities
            );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}