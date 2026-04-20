package com.SBuses.demo.Security;

import com.SBuses.demo.Models.Permission;
import com.SBuses.demo.Models.Role;
import com.SBuses.demo.Repository.RoleRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio para validar de forma eficiente (vía caché) los permisos dinámicos 
 * basado en los módulos solicitados, evitando llamadas a MongoDB por petición.
 */
@Service
public class PermissionValidationService {

    @Autowired
    private RoleRepository roleRepository;

    // Caché en memoria: Nombre del Rol (mayúsculas) -> Objeto Role
    private Map<String, Role> roleCache = new HashMap<>();

    @PostConstruct
    public void init() {
        refreshCache();
    }

    /**
     * Vuelve a consultar la base de datos y reconstruye el índice en memoria.
     * Debe llamarse cada vez que un rol se crea, edita o elimina.
     */
    public void refreshCache() {
        List<Role> roles = roleRepository.findAll();
        Map<String, Role> newCache = new HashMap<>();
        for (Role r : roles) {
            newCache.put(r.getNombre().toUpperCase(), r);
        }
        this.roleCache = newCache;
    }

    /**
     * Evalúa si el usuario actual posee en al menos uno de sus roles
     * el permiso indicado para el módulo.
     * 
     * @param authentication la autenticación de Spring Security (inyectada automáticamente por @PreAuthorize)
     * @param modulo nombre del módulo tal cual está en Mongo, pej "usuarios", "roles"
     * @param accion acción a realizar: "leer", "escribir", "editar", "eliminar"
     * @return true si tiene el permiso, false de lo contrario
     */
    public boolean hasPermission(Authentication authentication, String modulo, String accion) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        // Extraer nombres de roles desde los GrantedAuthorities
        // (JwtFilter inyecta cosas como "ROLE_ADMIN", por tanto extraemos "ADMIN")
        List<String> userRoles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5).toUpperCase())
                .collect(Collectors.toList());

        for (String roleName : userRoles) {
            Role role = roleCache.get(roleName);
            if (role != null && role.getPermisos() != null) {
                for (Permission perm : role.getPermisos()) {
                    if (modulo.equalsIgnoreCase(perm.getModulo())) {
                        if ("leer".equalsIgnoreCase(accion) && perm.isLeer()) return true;
                        if ("escribir".equalsIgnoreCase(accion) && perm.isEscribir()) return true;
                        if ("editar".equalsIgnoreCase(accion) && perm.isEditar()) return true;
                        if ("eliminar".equalsIgnoreCase(accion) && perm.isEliminar()) return true;
                    }
                }
            }
        }

        return false;
    }
}
