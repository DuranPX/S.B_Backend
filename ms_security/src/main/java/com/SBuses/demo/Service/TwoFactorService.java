package com.SBuses.demo.Service;

import com.SBuses.demo.Models.TwoFactorCode;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Repository.TwoFactorCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Random;

@Service
public class TwoFactorService {

    @Autowired
    private TwoFactorCodeRepository twoFactorRepository;

    @Autowired
    private GmailService gmailService;

    @Autowired
    private UserService userService;

    private static final int MAX_INTENTOS = 5;
    private static final long EXPIRACION_MS = 5 * 60 * 1000L; // 5 minutos en ms

    // ─────────────────────────────────────────────
    // GENERAR Y ENVIAR código 2FA
    // ─────────────────────────────────────────────

    public boolean sendCode(String email, String proposito) {

        // 1. Verificar que el usuario existe
        User user = userService.findByEmail(email).orElse(null);
        if (user == null) {
            return false;
        }

        // 2. Generar código de 6 dígitos
        String codigo = String.format("%06d", new Random().nextInt(999999));

        // 3. Si ya existe un código para ese email, reemplazarlo
        twoFactorRepository.findByEmail(email)
                .ifPresent(existing -> twoFactorRepository.delete(existing));

        // 4. Guardar el nuevo código en MongoDB
        TwoFactorCode twoFactorCode = new TwoFactorCode();
        twoFactorCode.setEmail(email);
        twoFactorCode.setCodigo(codigo);
        twoFactorCode.setExpiracion(new Date(System.currentTimeMillis() + EXPIRACION_MS));
        twoFactorCode.setIntentos(0);
        twoFactorCode.setProposito(proposito);
        twoFactorRepository.save(twoFactorCode);

        // 5. Enviar correo con el código
        String html = gmailService.build2FAEmailHtml(user.getName(), codigo);
        gmailService.sendEmail(email, "Tu código de verificación", html);

        return true;
    }

    public boolean sendRecoveryCode(String email) {

        // 1. Verificar que el usuario existe
        User user = userService.findByEmail(email).orElse(null);
        if (user == null) return false;

        // 2. Generar código de 6 dígitos
        String codigo = String.format("%06d", new Random().nextInt(999999));

        // 3. Si ya existe un código para ese email, reemplazarlo
        twoFactorRepository.findByEmail(email)
                .ifPresent(existing -> twoFactorRepository.delete(existing));

        // 4. Guardar en MongoDB con proposito RECOVERY
        TwoFactorCode twoFactorCode = new TwoFactorCode();
        twoFactorCode.setEmail(email);
        twoFactorCode.setCodigo(codigo);
        twoFactorCode.setExpiracion(new Date(System.currentTimeMillis() + EXPIRACION_MS));
        twoFactorCode.setIntentos(0);
        twoFactorCode.setProposito("RECOVERY");
        twoFactorRepository.save(twoFactorCode);

        // 5. Enviar correo de recuperación
        String html = gmailService.buildRecoveryEmailHtml(user.getName(), codigo);
        gmailService.sendEmail(email, "Recuperación de contraseña", html);

        return true;
    }

    // ─────────────────────────────────────────────
    // VERIFICAR código 2FA
    // ─────────────────────────────────────────────

    public VerificationResult verifyCode(String email, String codigo) {

        // 1. Buscar el código en MongoDB
        TwoFactorCode twoFactorCode = twoFactorRepository.findByEmail(email).orElse(null);
        if (twoFactorCode == null) {
            return VerificationResult.NOT_FOUND;
        }

        // 2. Verificar expiración
        if (new Date().after(twoFactorCode.getExpiracion())) {
            twoFactorRepository.delete(twoFactorCode);
            return VerificationResult.EXPIRED;
        }

        // 3. Verificar intentos
        if (twoFactorCode.getIntentos() >= MAX_INTENTOS) {
            twoFactorRepository.delete(twoFactorCode);
            return VerificationResult.MAX_ATTEMPTS;
        }

        // 4. Verificar código
        if (!twoFactorCode.getCodigo().equals(codigo)) {
            twoFactorCode.setIntentos(twoFactorCode.getIntentos() + 1);
            twoFactorRepository.save(twoFactorCode);
            return VerificationResult.INVALID_CODE;
        }

        // 5. Código correcto — eliminar de MongoDB y retornar el propósito
        String proposito = twoFactorCode.getProposito();
        twoFactorRepository.delete(twoFactorCode);

        return switch (proposito) {
            case "REGISTRO" -> VerificationResult.SUCCESS_REGISTER;
            case "RECOVERY" -> VerificationResult.SUCCESS_RECOVERY;
            default         -> VerificationResult.SUCCESS_LOGIN;
        };
    }

    // ─────────────────────────────────────────────
    // Enum de resultados posibles
    // ─────────────────────────────────────────────

    public enum VerificationResult {
        SUCCESS_LOGIN,      // código correcto, flujo de login
        SUCCESS_REGISTER,   // código correcto, flujo de registro
        SUCCESS_RECOVERY,
        INVALID_CODE,       // código incorrecto, suma intento
        EXPIRED,            // código expirado
        MAX_ATTEMPTS,       // demasiados intentos fallidos
        NOT_FOUND           // no existe código para ese email
    }
}
