package com.SBuses.demo.config;

import com.SBuses.demo.Security.JWT.JwtFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.SBuses.demo.Models.AuthExterna;
import com.SBuses.demo.Models.Role;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Repository.RoleRepository;
import com.SBuses.demo.Repository.UserRepository;
import com.SBuses.demo.Security.JWT.JwtUtil;
import org.springframework.security.oauth2.core.user.OAuth2User;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SegurityConfig {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;

    public SegurityConfig(UserRepository userRepository, RoleRepository roleRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.jwtUtil = jwtUtil;
    }

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Ejemplo de permisos por rol:
                        .requestMatchers(HttpMethod.GET, "/api/users/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .successHandler((request, response, authentication) -> {
                            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

                            String email = oauth2User.getAttribute("email") != null
                                    ? oauth2User.getAttribute("email")
                                    : oauth2User.getAttribute("preferred_username");

                            String name = oauth2User.getAttribute("given_name") != null
                                    ? oauth2User.getAttribute("given_name")
                                    : oauth2User.getAttribute("login") != null
                                    ? oauth2User.getAttribute("login")
                                    : oauth2User.getAttribute("name");

                            String lastName = oauth2User.getAttribute("family_name") != null
                                    ? oauth2User.getAttribute("family_name") : "";

                            Object idAttr = oauth2User.getAttribute("sub") != null
                                    ? oauth2User.getAttribute("sub")
                                    : oauth2User.getAttribute("id");
                            String providerId = idAttr != null ? idAttr.toString() : "unknown";

                            String proveedor = oauth2User.getAttribute("sub") != null
                                    ? (oauth2User.getAttributes().containsKey("login") ? "github" :
                                    oauth2User.getAttribute("iss") != null &&
                                            oauth2User.getAttribute("iss").toString().contains("microsoft")
                                            ? "microsoft" : "google")
                                    : "github";

                            User user = userRepository.findByEmail(email).orElseGet(() -> {
                                Role rolCiudadano = roleRepository.findByName("Ciudadano")
                                        .orElseThrow(() -> new RuntimeException("Rol Ciudadano no encontrado"));

                                User newUser = new User();
                                newUser.setName(name);
                                newUser.setLastName(lastName);
                                newUser.setEmail(email);
                                newUser.setPassword(null);
                                newUser.setActivo(true);
                                newUser.setRegistrationDate(new Date());
                                newUser.setRoles(new ArrayList<>(List.of(rolCiudadano.getId())));

                                AuthExterna authExterna = new AuthExterna();
                                authExterna.setProveedor(proveedor);
                                authExterna.setIdExterno(providerId);
                                authExterna.setEmail(email);
                                authExterna.setFechaVinculacion(new Date());
                                newUser.setAuthExternas(new ArrayList<>(List.of(authExterna)));

                                return userRepository.save(newUser);
                            });

                            String token = jwtUtil.generateToken(email, user.getRoles());

                            response.setContentType("application/json");
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write("{\"token\": \"" + token + "\"}");
                        })
                        .failureUrl("/auth/oauth2/failure")
                )
                // Agregar el JwtFilter antes del filtro de autenticación de Spring
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    @Bean
    public AuthenticationSuccessHandler oAuth2SuccessHandler() {
        return (request, response, authentication) -> {
            response.sendRedirect("/auth/oauth2/success");
        };
    }
}