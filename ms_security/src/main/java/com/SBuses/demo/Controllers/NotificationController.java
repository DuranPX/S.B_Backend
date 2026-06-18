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

    @PostMapping("/email")
    public ResponseEntity<?> sendGenericEmail(@RequestBody Map<String, String> request) {
        String to = request.get("to");
        String subject = request.get("subject");
        String templateType = request.get("templateType");

        if (to == null || subject == null) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Los campos 'to' y 'subject' son requeridos")
            );
        }

        String html;
        switch (templateType != null ? templateType : "") {
            case "pqrs_confirmacion" -> html = buildPqrsConfirmacionHtml(
                request.get("radicado"),
                request.get("tipo"),
                request.get("categoria"),
                request.get("descripcion"),
                request.get("tiempoEstimado")
            );
            case "pqrs_estado" -> html = buildPqrsEstadoHtml(
                request.get("radicado"),
                request.get("nuevoEstado"),
                request.get("respuesta")
            );
            case "clima_alerta" -> html = buildClimaAlertaHtml(
                request.get("nombre"),
                request.get("mensaje"),
                request.get("temperatura"),
                request.get("probabilidadLluvia"),
                request.get("condicion")
            );
            case "cita_confirmacion" -> html = buildCitaConfirmadaHtml(
                request.get("nombre"),
                request.get("tipoConsulta"),
                request.get("tipoAtencion"),
                request.get("fechaInicio"),
                request.get("meetLink")
            );
            default -> {
                // Template genérico si no se especifica
                String bodyText = request.get("html");
                if (bodyText == null) {
                    return ResponseEntity.badRequest().body(
                        Map.of("error", "templateType o html es requerido")
                    );
                }
                html = bodyText;
            }
        }

        gmailService.sendEmail(to, subject, html);
        return ResponseEntity.ok(Map.of("message", "Email enviado correctamente", "to", to));
    }

    @PostMapping("/email-departamento")
    public ResponseEntity<?> notifyDepartamento(@RequestBody Map<String, String> request) {
        String departamento = request.get("departamento");
        String radicado = request.get("radicado");

        // Mapear departamento → rol en el sistema
        Map<String, String> departamentoRol = Map.of(
            "operaciones", "Supervisor",
            "mantenimiento", "Supervisor",
            "sistemas", "Admin",
            "atencion_cliente", "asesor"
        );

        String rolDestino = departamentoRol.getOrDefault(departamento, "Supervisor");

        List<User> destinatarios = userRepository.findAll().stream()
            .filter(u -> u.getRoles() != null && u.getRoles().contains(rolDestino))
            .collect(Collectors.toList());

        if (destinatarios.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "message", "No hay usuarios con rol " + rolDestino,
                "notificados", 0
            ));
        }

        String html = buildPqrsNuevaDepartamentoHtml(
            radicado,
            request.get("tipo"),
            request.get("categoria"),
            request.get("descripcion"),
            request.get("emailContacto")
        );

        String subject = "📋 Nueva PQRS asignada [" + radicado + "] - Departamento " + departamento;

        destinatarios.forEach(u -> gmailService.sendEmail(u.getEmail(), subject, html));

        return ResponseEntity.ok(Map.of(
            "message", "Departamento notificado",
            "notificados", destinatarios.size()
        ));
    }

    private String buildCitaConfirmadaHtml(String nombre, String tipoConsulta,
                                            String tipoAtencion, String fechaInicio,
                                            String meetLink) {
        String modalidad = "virtual".equalsIgnoreCase(tipoAtencion)
            ? "Virtual (Google Meet)" : "Presencial en oficina";

        String meetRow = (meetLink != null && !meetLink.isEmpty())
            ? "<tr><td style=\"padding:8px;border:1px solid #ddd;background:#f9f9f9;\"><b>🔗 Enlace Meet</b></td><td style=\"padding:8px;border:1px solid #ddd;\"><a href=\"%s\">Unirse a la reunión</a></td></tr>".formatted(meetLink)
            : "";

        return """
            <!DOCTYPE html><html lang="es"><body style="font-family:Arial,sans-serif;background:#f4f4f4;">
            <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div style="background:#1a73e8;padding:30px;text-align:center;">
                <h1 style="color:#fff;margin:0;">✅ Cita Confirmada</h1>
                <p style="color:#d0e4ff;margin:8px 0 0;">Sistema de Buses Inteligentes</p>
            </div>
            <div style="padding:30px;color:#333;">
                <p>Hola <strong>%s</strong>, tu cita ha sido agendada exitosamente.</p>
                <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>📋 Consulta</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>📅 Fecha</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>🕐 Duración</b></td><td style="padding:8px;border:1px solid #ddd;">30 minutos</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>📍 Modalidad</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                %s
                </table>
            </div>
            <div style="background:#f4f4f4;padding:20px;text-align:center;font-size:12px;color:#888;">
                <p>Este es un correo automático del Sistema de Buses Inteligentes.</p>
            </div>
            </div></body></html>
            """.formatted(nombre, tipoConsulta, fechaInicio, modalidad, meetRow);
    }

    private String buildPqrsConfirmacionHtml(String radicado, String tipo,
                                            String categoria, String descripcion,
                                            String tiempoEstimado) {
        return """
            <!DOCTYPE html><html lang="es"><body style="font-family:Arial,sans-serif;background:#f4f4f4;">
            <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div style="background:#34a853;padding:30px;text-align:center;">
                <h1 style="color:#fff;margin:0;">📋 PQRS Recibida</h1>
                <p style="color:#d0f0d8;margin:8px 0 0;">Sistema de Buses Inteligentes</p>
            </div>
            <div style="padding:30px;color:#333;">
                <p>Tu solicitud ha sido recibida exitosamente.</p>
                <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>📌 Radicado</b></td><td style="padding:8px;border:1px solid #ddd;font-weight:bold;color:#34a853;">%s</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Tipo</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Categoría</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Descripción</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>⏱ Tiempo estimado</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                </table>
                <p style="background:#fff3cd;padding:12px;border-radius:6px;border-left:4px solid #ffc107;">
                Guarda tu número de radicado <strong>%s</strong> para consultar el estado de tu solicitud.
                </p>
            </div>
            <div style="background:#f4f4f4;padding:20px;text-align:center;font-size:12px;color:#888;">
                <p>Este es un correo automático del Sistema de Buses Inteligentes.</p>
            </div>
            </div></body></html>
            """.formatted(radicado, tipo, categoria, descripcion, tiempoEstimado, radicado);
    }

    private String buildPqrsEstadoHtml(String radicado, String nuevoEstado, String respuesta) {
        Map<String, String> colores = Map.of(
            "En revisión", "#1a73e8",
            "En proceso", "#ff9800",
            "Resuelto", "#34a853",
            "Recibido", "#607d8b"
        );
        String color = colores.getOrDefault(nuevoEstado, "#607d8b");

        String respuestaHtml = (respuesta != null && !respuesta.isEmpty())
            ? "<div style=\"background:#f8f9fa;padding:16px;border-radius:6px;border-left:4px solid " + color + ";margin-top:16px;\"><p><strong>Respuesta del agente:</strong></p><p>" + respuesta + "</p></div>"
            : "";

        return """
            <!DOCTYPE html><html lang="es"><body style="font-family:Arial,sans-serif;background:#f4f4f4;">
            <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div style="background:%s;padding:30px;text-align:center;">
                <h1 style="color:#fff;margin:0;">🔄 Actualización de tu PQRS</h1>
                <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Sistema de Buses Inteligentes</p>
            </div>
            <div style="padding:30px;color:#333;">
                <p>Tu solicitud <strong>%s</strong> ha sido actualizada:</p>
                <div style="text-align:center;margin:24px 0;">
                <span style="background:%s;color:#fff;padding:10px 24px;border-radius:20px;font-size:18px;font-weight:bold;">%s</span>
                </div>
                %s
            </div>
            <div style="background:#f4f4f4;padding:20px;text-align:center;font-size:12px;color:#888;">
                <p>Este es un correo automático del Sistema de Buses Inteligentes.</p>
            </div>
            </div></body></html>
            """.formatted(color, radicado, color, nuevoEstado, respuestaHtml);
    }

    private String buildClimaAlertaHtml(String nombre, String mensaje,
                                        String temperatura, String probabilidadLluvia,
                                        String condicion) {
        boolean hayLluvia = Integer.parseInt(probabilidadLluvia != null ? probabilidadLluvia : "0") > 50;
        String colorHeader = hayLluvia ? "#1a73e8" : "#ff9800";
        String icono = hayLluvia ? "🌧️" : "☀️";

        return """
            <!DOCTYPE html><html lang="es"><body style="font-family:Arial,sans-serif;background:#f4f4f4;">
            <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div style="background:%s;padding:30px;text-align:center;">
                <h1 style="color:#fff;margin:0;">%s Pronóstico del día</h1>
                <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Sistema de Buses Inteligentes</p>
            </div>
            <div style="padding:30px;color:#333;">
                <p>Hola <strong>%s</strong>,</p>
                <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:16px 0;text-align:center;">
                <p style="font-size:24px;margin:0;">%s</p>
                <p style="font-size:16px;color:#555;margin:8px 0;">🌡️ Temperatura: %s°C</p>
                <p style="font-size:14px;color:#777;margin:0;">%s</p>
                </div>
                <p style="background:#fff3cd;padding:12px;border-radius:6px;border-left:4px solid #ffc107;">%s</p>
            </div>
            <div style="background:#f4f4f4;padding:20px;text-align:center;font-size:12px;color:#888;">
                <p>Puedes desactivar estas alertas desde tu perfil en la aplicación.</p>
            </div>
            </div></body></html>
            """.formatted(colorHeader, icono, nombre, mensaje, temperatura, condicion, mensaje);
    }

    private String buildPqrsNuevaDepartamentoHtml(String radicado, String tipo,
                                                String categoria, String descripcion,
                                                String emailContacto) {
        return """
            <!DOCTYPE html><html lang="es"><body style="font-family:Arial,sans-serif;background:#f4f4f4;">
            <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div style="background:#673ab7;padding:30px;text-align:center;">
                <h1 style="color:#fff;margin:0;">📋 Nueva PQRS Asignada</h1>
                <p style="color:#e1d5f5;margin:8px 0 0;">Sistema de Buses Inteligentes — Interno</p>
            </div>
            <div style="padding:30px;color:#333;">
                <p>Se ha recibido una nueva solicitud que requiere atención:</p>
                <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>📌 Radicado</b></td><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">%s</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Tipo</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Categoría</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>Descripción</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><b>📧 Contacto</b></td><td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                </table>
            </div>
            <div style="background:#f4f4f4;padding:20px;text-align:center;font-size:12px;color:#888;">
                <p>Por favor gestionar esta solicitud en el tiempo establecido.</p>
            </div>
            </div></body></html>
            """.formatted(radicado, tipo, categoria, descripcion, emailContacto);
    }
}