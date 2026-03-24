package com.SBuses.demo.Controllers;

import com.SBuses.demo.DTOs.LoginRequest;
import com.SBuses.demo.DTOs.RegisterRequest;
import com.SBuses.demo.DTOs.ResetPasswordRequest;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Security.JWT.JwtUtil;
import com.SBuses.demo.Service.RecaptchaService;
import com.SBuses.demo.Service.TwoFactorService;
import com.SBuses.demo.Service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private TwoFactorService twoFactorService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RecaptchaService recaptchaService;

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
                    .body("Verificación reCAPTCHA fallida. Intenta de nuevo.");
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
                    .body("El email ya está registrado");
        }

        userService.create(newUser);
        twoFactorService.sendCode(request.getEmail(), "REGISTRO");

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body("Usuario creado. Se envió un código de verificación a tu correo.");
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
                    .body("Verificación reCAPTCHA fallida. Intenta de nuevo.");
        }

        String resultado = userService.login(request.getEmail(), request.getPassword());

        if (resultado == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Credenciales incorrectas");
        }

        if (resultado.equals("INACTIVO")) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Cuenta no activada. Revisa tu correo.");
        }

        twoFactorService.sendCode(request.getEmail(), "LOGIN");

        return ResponseEntity
                .ok("Credenciales correctas. Se envió un código 2FA a tu correo.");
    }

    // ─────────────────────────────────────────────
    // ENVIAR código 2FA
    // ─────────────────────────────────────────────

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
                    .body("Se requiere email y proposito");
        }

        boolean enviado = twoFactorService.sendCode(email, proposito);

        if (!enviado) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("No existe un usuario con ese email");
        }

        return ResponseEntity
                .ok("Código enviado al correo " + email);
    }

    // ─────────────────────────────────────────────
    // VERIFICAR código 2FA
    // ─────────────────────────────────────────────

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
                    .body("Se requiere email y codigo");
        }

        TwoFactorService.VerificationResult result = twoFactorService.verifyCode(email, codigo);

        switch (result) {

            case SUCCESS_LOGIN -> {
                // Buscar usuario para obtener sus roles y generar JWT
                User user = userService.findByEmail(email).orElse(null);
                String token = jwtUtil.generateToken(user.getEmail(), user.getRoles());
                return ResponseEntity.ok(token);
            }

            case SUCCESS_REGISTER -> {
                // Activar la cuenta del usuario
                userService.activateUser(email);
                return ResponseEntity.ok("Cuenta activada exitosamente. Ya puedes iniciar sesión.");
            }

            case INVALID_CODE -> {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Código incorrecto");
            }

            case EXPIRED -> {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("El código ha expirado. Solicita uno nuevo.");
            }

            case MAX_ATTEMPTS -> {
                return ResponseEntity
                        .status(HttpStatus.TOO_MANY_REQUESTS)     // 429
                        .body("Demasiados intentos fallidos. Solicita un nuevo código.");
            }

            default -> {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("No existe un código activo para este email.");
            }
        }
    }

    // ─────────────────────────────────────────────
    // RECUPERACIÓN DE CONTRASEÑA
    // ─────────────────────────────────────────────

    /**
     * POST /auth/recovery/send
     * Envía el código de recuperación al email del usuario.
     */
    @PostMapping("/recovery/send")
    public ResponseEntity<?> sendRecovery(@RequestBody Map<String, String> body) {

        String email = body.get("email");

        if (email == null || email.isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("El email es obligatorio");
        }

        boolean enviado = twoFactorService.sendRecoveryCode(email);

        if (!enviado) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("No existe un usuario con ese email");
        }

        return ResponseEntity
                .ok("Se envió un código de recuperación a " + email);
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
                    .body("Verificación reCAPTCHA fallida. Intenta de nuevo.");
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
                            .body("Error al actualizar la contraseña");
                }
                return ResponseEntity.ok("Contraseña actualizada exitosamente");
            }
            case INVALID_CODE -> {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Código incorrecto");
            }
            case EXPIRED -> {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("El código ha expirado. Solicita uno nuevo.");
            }
            case MAX_ATTEMPTS -> {
                return ResponseEntity
                        .status(HttpStatus.TOO_MANY_REQUESTS)
                        .body("Demasiados intentos fallidos. Solicita un nuevo código.");
            }
            default -> {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("No existe un código activo para este email.");
            }
        }
    }
}