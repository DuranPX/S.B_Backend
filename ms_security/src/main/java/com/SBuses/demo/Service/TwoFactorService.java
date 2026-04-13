package com.SBuses.demo.Service;

import com.SBuses.demo.Models.TwoFactorCode;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Models.VerificationCode;
import com.SBuses.demo.Models.RecoveryToken;
import com.SBuses.demo.Repository.TwoFactorCodeRepository;
import com.SBuses.demo.Repository.VerificationCodeRepository;
import com.SBuses.demo.Repository.RecoveryTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;
import java.util.Random;

@Service
public class TwoFactorService {

    @Autowired
    private TwoFactorCodeRepository twoFactorRepository;

    @Autowired
    private GmailService gmailService;

    @Autowired
    private UserService userService;

    @Autowired
    private VerificationCodeRepository verificationRepository;

    @Autowired
    private RecoveryTokenRepository recoveryRepository;

    private static final int MAX_INTENTOS = 5;
    private static final long EXPIRACION_MS = 5 * 60 * 1000L; // 5 minutos en ms

    // GENERAR Y ENVIAR código 2FA

    public boolean sendCode(String email, String proposito) {

        // Verificar que el usuario existe
        User user = userService.findByEmail(email).orElse(null);
        if (user == null) {
            return false;
        }

        // Generar código de 6 dígitos
        String codigo = String.format("%06d", new Random().nextInt(999999));

        if ("REGISTRO".equals(proposito)) {
            // Guardar en verification_codes (LOG)
            verificationRepository.findByUserIdAndUsedFalse(user.getId())
                    .ifPresent(existing -> { existing.setUsed(true); verificationRepository.save(existing); });

            VerificationCode vc = new VerificationCode();
            vc.setUserId(user.getId());
            vc.setCode(codigo);
            vc.setUsed(false);
            vc.setCreatedAt(new Date());
            vc.setExpiresAt(new Date(System.currentTimeMillis() + EXPIRACION_MS));
            vc.setAttempts(0);
            verificationRepository.save(vc);
        } else {
            // Guardar en twoFactorCode (LOGIN etc)
            twoFactorRepository.findByEmailAndUsedFalse(email)
                    .ifPresent(existing -> { existing.setUsed(true); twoFactorRepository.save(existing); });

            TwoFactorCode twoFactorCode = new TwoFactorCode();
            twoFactorCode.setEmail(email);
            twoFactorCode.setCodigo(codigo);
            twoFactorCode.setExpiracion(new Date(System.currentTimeMillis() + EXPIRACION_MS));
            twoFactorCode.setIntentos(0);
            twoFactorCode.setProposito(proposito);
            twoFactorCode.setUsed(false);
            twoFactorRepository.save(twoFactorCode);
        }

        // Enviar correo con el código
        String html = gmailService.build2FAEmailHtml(user.getName(), codigo);
        gmailService.sendEmail(email, "Tu código de verificación", html);

        return true;
    }

    public boolean sendRecoveryCode(String email) {

        // Verificar que el usuario existe
        User user = userService.findByEmail(email).orElse(null);
        if (user == null) return false;

        // Generar código de 6 dígitos
        String codigo = String.format("%06d", new Random().nextInt(999999));

        // Guardar en recovery_tokens (LOG)
        recoveryRepository.findByEmailAndUsedFalse(email)
                .ifPresent(existing -> { existing.setUsed(true); recoveryRepository.save(existing); });

        RecoveryToken rt = new RecoveryToken();
        rt.setEmail(email);
        rt.setCode(codigo);
        rt.setUsed(false);
        rt.setCreatedAt(new Date());
        rt.setExpiresAt(new Date(System.currentTimeMillis() + EXPIRACION_MS));
        rt.setAttempts(0);
        recoveryRepository.save(rt);

        // Enviar correo de recuperación
        String html = gmailService.buildRecoveryEmailHtml(user.getName(), codigo);
        gmailService.sendEmail(email, "Recuperación de contraseña", html);

        return true;
    }

    // VERIFICAR código 2FA

    public VerificationResult verifyCode(String email, String codigo) {
        // Intentar buscar en las 3 colecciones posibles
        User user = userService.findByEmail(email).orElse(null);
        
        // 1. RECOVERY
        Optional<RecoveryToken> rtOpt = recoveryRepository.findByEmailAndUsedFalse(email);
        if (rtOpt.isPresent()) {
            RecoveryToken rt = rtOpt.get();
            if (new Date().after(rt.getExpiresAt())) return VerificationResult.EXPIRED;
            if (rt.getAttempts() >= MAX_INTENTOS) return VerificationResult.MAX_ATTEMPTS;
            if (!rt.getCode().equals(codigo)) {
                rt.setAttempts(rt.getAttempts() + 1);
                recoveryRepository.save(rt);
                return VerificationResult.INVALID_CODE;
            }
            rt.setUsed(true);
            recoveryRepository.save(rt);
            return VerificationResult.SUCCESS_RECOVERY;
        }

        // 2. REGISTRO
        if (user != null) {
            Optional<VerificationCode> vcOpt = verificationRepository.findByUserIdAndUsedFalse(user.getId());
            if (vcOpt.isPresent()) {
                VerificationCode vc = vcOpt.get();
                if (new Date().after(vc.getExpiresAt())) return VerificationResult.EXPIRED;
                if (vc.getAttempts() >= MAX_INTENTOS) return VerificationResult.MAX_ATTEMPTS;
                if (!vc.getCode().equals(codigo)) {
                    vc.setAttempts(vc.getAttempts() + 1);
                    verificationRepository.save(vc);
                    return VerificationResult.INVALID_CODE;
                }
                vc.setUsed(true);
                verificationRepository.save(vc);
                return VerificationResult.SUCCESS_REGISTER;
            }
        }

        // 3. LOGIN (TwoFactorCode)
        Optional<TwoFactorCode> tfcOpt = twoFactorRepository.findByEmailAndUsedFalse(email);
        if (tfcOpt.isPresent()) {
            TwoFactorCode tfc = tfcOpt.get();
            if (new Date().after(tfc.getExpiracion())) return VerificationResult.EXPIRED;
            if (tfc.getIntentos() >= MAX_INTENTOS) return VerificationResult.MAX_ATTEMPTS;
            if (!tfc.getCodigo().equals(codigo)) {
                tfc.setIntentos(tfc.getIntentos() + 1);
                twoFactorRepository.save(tfc);
                return VerificationResult.INVALID_CODE;
            }
            tfc.setUsed(true);
            twoFactorRepository.save(tfc); 
            return VerificationResult.SUCCESS_LOGIN;
        }

        return VerificationResult.NOT_FOUND;
    }

    // Consultar intentos restantes para informar al usuario
    public int getRemainingAttempts(String email) {
        // Buscar en el que esté activo
        Optional<RecoveryToken> rt = recoveryRepository.findByEmailAndUsedFalse(email);
        if (rt.isPresent()) return Math.max(0, MAX_INTENTOS - rt.get().getAttempts());

        User user = userService.findByEmail(email).orElse(null);
        if (user != null) {
            Optional<VerificationCode> vc = verificationRepository.findByUserIdAndUsedFalse(user.getId());
            if (vc.isPresent()) return Math.max(0, MAX_INTENTOS - vc.get().getAttempts());
        }

        Optional<TwoFactorCode> tfc = twoFactorRepository.findByEmailAndUsedFalse(email);
        if (tfc.isPresent()) return Math.max(0, MAX_INTENTOS - tfc.get().getIntentos());

        return 0;
    }

    // Enum de resultados posibles

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
