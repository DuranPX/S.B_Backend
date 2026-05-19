package com.SBuses.demo.Controllers;
import com.SBuses.demo.DTOs.IncidentNotificationRequest;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Repository.UserRepository;
import com.SBuses.demo.Service.GmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// NotificationController.java
@RestController
@RequestMapping("/api/notify")
public class NotificationController {

    @Autowired
    private GmailService gmailService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/incident")
    public ResponseEntity<?> notifyIncident(@RequestBody IncidentNotificationRequest request) {
        // Buscar usuarios con rol Supervisor
        List<User> supervisores = userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().contains("Supervisor"))
                .collect(Collectors.toList());

        if (supervisores.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No hay supervisores registrados"));
        }

        String html = buildIncidentAlertHtml(request);

        supervisores.forEach(supervisor ->
                gmailService.sendEmail(
                        supervisor.getEmail(),
                        "🚨 Alerta de Incidente " + request.getGravedad() + " — Bus " + request.getBusPlaca(),
                        html
                )
        );

        return ResponseEntity.ok(Map.of("notificados", supervisores.size()));
    }

    private String buildIncidentAlertHtml(IncidentNotificationRequest r) {
        return """
            <!DOCTYPE html>
            <html lang="es">
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <div style="max-width:600px; margin:40px auto; background:#fff;
                            border-radius:8px; overflow:hidden;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="background:#d93025; padding:30px; text-align:center;">
                        <h1 style="color:#fff; margin:0;">🚨 Alerta de Incidente</h1>
                        <p style="color:#ffd0cc; margin:8px 0 0;">Sistema de Buses Inteligentes</p>
                    </div>
                    <div style="padding:30px; color:#333;">
                        <p>Se ha reportado un incidente de gravedad <b>%s</b>:</p>
                        <table style="width:100%%; border-collapse:collapse; margin:20px 0;">
                            <tr><td style="padding:8px; border:1px solid #ddd; background:#f9f9f9;"><b>Bus</b></td><td style="padding:8px; border:1px solid #ddd;">%s</td></tr>
                            <tr><td style="padding:8px; border:1px solid #ddd; background:#f9f9f9;"><b>Tipo</b></td><td style="padding:8px; border:1px solid #ddd;">%s</td></tr>
                            <tr><td style="padding:8px; border:1px solid #ddd; background:#f9f9f9;"><b>Gravedad</b></td><td style="padding:8px; border:1px solid #ddd;">%s</td></tr>
                            <tr><td style="padding:8px; border:1px solid #ddd; background:#f9f9f9;"><b>Descripción</b></td><td style="padding:8px; border:1px solid #ddd;">%s</td></tr>
                            <tr><td style="padding:8px; border:1px solid #ddd; background:#f9f9f9;"><b>Fecha</b></td><td style="padding:8px; border:1px solid #ddd;">%s</td></tr>
                        </table>
                    </div>
                    <div style="background:#f4f4f4; padding:20px; text-align:center; font-size:12px; color:#888;">
                        <p>Este es un correo automático del Sistema de Buses Inteligentes.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(r.getGravedad(), r.getBusPlaca(), r.getTipo(),
                r.getGravedad(), r.getDescripcion(), r.getFecha());
    }
}