package com.SBuses.demo.Security.JWT;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Leer el header Authorization
        String authHeader = request.getHeader("Authorization");

        // Si no tiene el header o no empieza con "Bearer ", dejar pasar
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extraer el token (quitar el prefijo "Bearer ")
        String token = authHeader.substring(7);

        // Validar el token
        if (!jwtUtil.validateToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Token inválido o expirado\"}");
            return;
        }

        // Extraer el email del token
        String email = jwtUtil.getEmailFromToken(token);

        // Configurar la autenticación usando los datos del JWT (sin ir a la BD en cada request)
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            // Extraer roles del JWT y convertirlos a SimpleGrantedAuthority
            java.util.List<String> rolesFromToken = jwtUtil.getRolesFromToken(token);
            java.util.List<org.springframework.security.core.authority.SimpleGrantedAuthority> authorities = 
                rolesFromToken.stream()
                              .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                              .collect(java.util.stream.Collectors.toList());

            // Crear un UserDetails genérico basado en el token, no de la base de datos
            UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                    email, 
                    "", // password no es necesaria acá
                    authorities
            );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // Continuar con la cadena de filtros
        filterChain.doFilter(request, response);
    }
}