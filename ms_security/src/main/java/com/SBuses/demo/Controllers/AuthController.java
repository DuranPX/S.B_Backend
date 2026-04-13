package com.SBuses.demo.Controllers;

import com.SBuses.demo.DTOs.LoginRequest;
import com.SBuses.demo.DTOs.RegisterRequest;
import com.SBuses.demo.DTOs.ResetPasswordRequest;
import com.SBuses.demo.DTOs.SelectRoleRequest;
import com.SBuses.demo.Models.Role;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Security.JWT.JwtUtil;
import com.SBuses.demo.Service.RecaptchaService;
import com.SBuses.demo.Service.RoleService;
import com.SBuses.demo.Service.TwoFactorService;
import com.SBuses.demo.Service.UserService;
import com.SBuses.demo.Service.SessionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private TwoFactorService twoFactorService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RecaptchaService recaptchaService;

    @Autowired
    private SessionService sessionService;

    /**
     * POST /auth/register
     * Recibe los datos del formulario, valida y crea el usuario
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

        // Validar reCAPTCHA antes de procesar
        if (!recaptchaService.validate(request.getRecaptchaToken())) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Verificación reCAPTCHA fallida. Intenta de nuevo."));
        }

        // Validar que las contraseñas coincidan
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Las contraseñas no coinciden."));
        }

        User newUser = userService.validateRegister(
                request.getName(),
                request.getLastName(),
                request.getEmail(),
                request.getPassword(),
                request.getPhone(),
                request.getAddress()
        );

        if (newUser == null) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El email ya está registrado"));
        }

        userService.create(newUser);
        twoFactorService.sendCode(request.getEmail(), "REGISTRO");

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of("message", "Usuario creado. Se envió un código de verificación a tu correo."));
    }

    /**
     * POST /auth/login
     * Valida credenciales y retorna un JWT si son correctas.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

        // Validar reCAPTCHA antes de procesar
        if (!recaptchaService.validate(request.getRecaptchaToken())) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Verificación reCAPTCHA fallida. Intenta de nuevo."));
        }

        String resultado = userService.login(request.getEmail(), request.getPassword());

        if (resultado == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Email o contraseña incorrectos"));
        }

        if (resultado.equals("INACTIVO")) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cuenta no activada. Revisa tu correo."));
        }

        twoFactorService.sendCode(request.getEmail(), "LOGIN");

        return ResponseEntity
                .ok(Map.of("message", "Credenciales correctas. Se envió un código 2FA a tu correo."));
    }

    // ENVIAR código 2FA

    /**
     * POST /auth/2fa/send
     * Genera y envía el código 2FA al email del usuario.
     */
    @PostMapping("/2fa/send")
    public ResponseEntity<?> send2FA(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        String proposito = body.get("proposito"); // "REGISTRO" o "LOGIN"

        if (email == null || proposito == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Se requiere email y proposito"));
        }

        boolean enviado = twoFactorService.sendCode(email, proposito);

        if (!enviado) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No existe un usuario con ese email"));
        }

        return ResponseEntity
                .ok(Map.of("message", "Código enviado al correo " + email));
    }

    // VERIFICAR código 2FA

    /**
     * POST /auth/2fa/verify
     * Verifica el código ingresado por el usuario.
     * - Si es LOGIN exitoso: devuelve JWT
     * - Si es REGISTRO exitoso: activa la cuenta
     */
    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verify2FA(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        String codigo = body.get("codigo");

        if (email == null || codigo == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Se requiere email y codigo"));
        }

        TwoFactorService.VerificationResult result = twoFactorService.verifyCode(email, codigo);

        switch (result) {

            case SUCCESS_LOGIN -> {
                // Buscar usuario para obtener sus roles y generar JWT
                User user = userService.findByEmail(email).orElse(null);
                String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRoles());

                // Crear sesión (invalida sesiones previas → sesión única)
                sessionService.createSession(token);

                return ResponseEntity.ok(Map.of("token", token));
            }

            case SUCCESS_REGISTER -> {
                // Activar la cuenta del usuario
                userService.activateUser(email);
                return ResponseEntity.ok(Map.of("message", "Cuenta activada exitosamente. Ya puedes iniciar sesión."));
            }

            case INVALID_CODE -> {
                int remaining = twoFactorService.getRemainingAttempts(email);
                Map<String, Object> errorBody = new HashMap<>();
                errorBody.put("error", "Código incorrecto. Intentos restantes: " + remaining);
                errorBody.put("intentosRestantes", remaining);
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(errorBody);
            }

            case EXPIRED -> {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "El código ha expirado. Solicita uno nuevo."));
            }

            case MAX_ATTEMPTS -> {
                return ResponseEntity
                        .status(HttpStatus.TOO_MANY_REQUESTS)     // 429
                        .body(Map.of("error", "Demasiados intentos fallidos. Solicita un nuevo código."));
            }

            default -> {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No existe un código activo para este email."));
            }
        }
    }

    // RECUPERACIÓN DE CONTRASEÑA

    /**
     * POST /auth/recovery/send
     * Envía el código de recuperación al email del usuario.
     * IMPORTANTE: Siempre retorna respuesta genérica para prevenir enumeración de emails.
     */
    @PostMapping("/recovery/send")
    public ResponseEntity<?> sendRecovery(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        String recaptchaToken = body.get("recaptchaToken");

        if (email == null || email.isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "El email es obligatorio"));
        }

        // Validar reCAPTCHA antes de procesar
        if (recaptchaToken == null || !recaptchaService.validate(recaptchaToken)) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Verificación reCAPTCHA fallida. Intenta de nuevo."));
        }

        // Ejecutar envío (si el email no existe, simplemente no envía nada)
        twoFactorService.sendRecoveryCode(email);

        // SIEMPRE retornar respuesta genérica — NO revelar si el email existe o no
        return ResponseEntity
                .ok(Map.of("message", "Si el email existe en el sistema, recibirás instrucciones de recuperación."));
    }

    /**
     * POST /auth/recovery/verify
     * Verifica el código y actualiza la contraseña.
     */
    @PostMapping("/recovery/verify")
    public ResponseEntity<?> verifyRecovery(@Valid @RequestBody ResetPasswordRequest request) {

        // Validar reCAPTCHA antes de procesar
        if (!recaptchaService.validate(request.getRecaptchaToken())) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Verificación reCAPTCHA fallida. Intenta de nuevo."));
        }

        TwoFactorService.VerificationResult result =
                twoFactorService.verifyCode(request.getEmail(), request.getCodigo());

        switch (result) {
            case SUCCESS_RECOVERY -> {
                boolean updated = userService.resetPassword(
                        request.getEmail(), request.getNewPassword());
                if (!updated) {
                    return ResponseEntity
                            .status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Error al actualizar la contraseña"));
                }
                return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
            }
            case INVALID_CODE -> {
                int remaining = twoFactorService.getRemainingAttempts(request.getEmail());
                Map<String, Object> errorBody = new HashMap<>();
                errorBody.put("error", "Código incorrecto. Intentos restantes: " + remaining);
                errorBody.put("intentosRestantes", remaining);
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(errorBody);
            }
            case EXPIRED -> {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "El código ha expirado. Solicita uno nuevo."));
            }
            case MAX_ATTEMPTS -> {
                return ResponseEntity
                        .status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of("error", "Demasiados intentos fallidos. Solicita un nuevo código."));
            }
            default -> {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No existe un código activo para este email."));
            }
        }
    }

    // SELECCIÓN DE ROL (RBAC)

    /**
     * POST /auth/select-role
     * Cambia el token temporal por un token definitivo asociado a un rol específico
     * y retorna la estructura del rol con sus permisos embebidos.
     */
    @PostMapping("/select-role")
    public ResponseEntity<?> selectRole(@Valid @RequestBody SelectRoleRequest request,
                                        @RequestHeader("Authorization") String tokenHeader) {

        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token no proveído"));
        }

        String token = tokenHeader.substring(7);
        
        // El filtro JWT automáticamente invalida tokens incorrectos que llegan con Bearer en /auth
        // pero por seguridad manual lo extraemos
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token inválido o manipulado"));
        }

        String email = jwtUtil.getEmailFromToken(token);
        User user = userService.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario no encontrado en la base de datos."));
        }

        // Verificar si el usuario efectivamente tiene asignado el rol que está solicitando
        // El frontend envía el DTO con ej: {"role": "ADMIN"}
        if (!user.getRoles().contains(request.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "El usuario no tiene asignado el rol: " + request.getRole()));
        }

        // Obtener la información completa del Rol desde Mongo (que incluye la lista estructurada de permisos)
        Role roleData = roleService.getByNombre(request.getRole()).orElse(null);
        if (roleData == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "La estructura y configuración del rol solicitado no fue encontrada en el sistema."));
        }

        // Generar el nuevo JWT Definitivo con el claim "roles" fijado únicamente al rol seleccionado
        // y con un claim "token_type" = "auth_role"
        String newToken = jwtUtil.generateTokenForRole(user.getId(), user.getEmail(), request.getRole());

        // Crear/reemplazar sesión con el nuevo token definitivo (invalida la general anterior)
        sessionService.createSession(newToken);

        // Crear el JSON de respuesta tal como fue solicitado (anidando token y Role con sus permisos)
        Map<String, Object> response = Map.of(
                "token", newToken,
                "role", roleData
        );

        return ResponseEntity.ok(response);
    }

    /**
     * GET /auth/me
     * Retorna la información del usuario en sesión y los permisos de su rol activo basado en el JWT definitivo.
     * Ideal para recargar la app (F5) de forma segura sin guardar detalles sensibles en localStorage.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader("Authorization") String tokenHeader) {

        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token no proveído"));
        }

        String token = tokenHeader.substring(7);

        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token inválido o manipulado"));
        }

        // Verificación de Seguridad CRÍTICA: Asegurarse de que el usuario envíe su "Token Definitivo",
        // no el token temporal.
        if (!"auth_role".equals(jwtUtil.getTokenTypeFromToken(token))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Acceso denegado. Se requiere un token de rol activo validado."));
        }

        String email = jwtUtil.getEmailFromToken(token);
        User user = userService.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario no encontrado."));
        }

        // Extraer el rol activo de forma segura desde los Claims del JWT
        List<String> rolesEnToken = jwtUtil.getRolesFromToken(token);
        if (rolesEnToken == null || rolesEnToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "El token no contiene un rol asociado."));
        }
        
        String rolActivo = rolesEnToken.get(0);
        Role roleData = roleService.getByNombre(rolActivo).orElse(null);

        // Limpiar información sensible antes de enviar al Front
        user.setPassword(null);

        Map<String, Object> response = Map.of(
                "user", user,
                "role", roleData != null ? roleData : "Rol no existente en el sistema."
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * POST /auth/logout
     * Invalida la sesión activa del usuario en MongoDB.
     * El token JWT deja de ser válido inmediatamente porque el JwtFilter
     * verifica la sesión en cada petición.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String tokenHeader) {

        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token no proveído"));
        }

        String token = tokenHeader.substring(7);

        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token inválido o expirado"));
        }

        // Invalidar la sesión en MongoDB → el token queda inutilizable
        String jti = jwtUtil.getJtiFromToken(token);
        sessionService.invalidateSession(jti);

        return ResponseEntity.ok(Map.of("message", "Sesión cerrada exitosamente."));
    }
}