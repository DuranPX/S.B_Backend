package com.SBuses.demo.Service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.GmailScopes;
import com.google.api.services.gmail.model.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Service;

import java.io.*;
import java.security.GeneralSecurityException;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Properties;

@Service
public class GmailService {

    private static final String APPLICATION_NAME = "Sistema de Buses Inteligentes";
    private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(GmailScopes.GMAIL_SEND);

    // Ruta donde se guarda el token.json (equivalente al token.pickle de Python)
    private static final String TOKENS_PATH = "src/main/resources/confidencial";
    // Ruta del credentials.json
    private static final String CREDENTIALS_PATH = "/confidencial/credentials.json";

    // Autenticación — equivalente al authenticate_gmail() de Python
    private Credential getCredentials(NetHttpTransport httpTransport) throws IOException {
        InputStream in = GmailService.class.getResourceAsStream(CREDENTIALS_PATH);
        if (in == null) {
            throw new FileNotFoundException("No se encontró: " + CREDENTIALS_PATH);
        }

        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JSON_FACTORY,
                new InputStreamReader(in));

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                httpTransport, JSON_FACTORY, clientSecrets, SCOPES)
                .setDataStoreFactory(new FileDataStoreFactory(new File(TOKENS_PATH)))
                .setAccessType("offline")
                .build();

        LocalServerReceiver receiver = new LocalServerReceiver.Builder()
                .setPort(8888)
                .build();

        return new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
    }

    // Construir el servicio de Gmail
    private Gmail buildGmailService() throws GeneralSecurityException, IOException {
        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        return new Gmail.Builder(httpTransport, JSON_FACTORY, getCredentials(httpTransport))
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    // Enviar correo HTML
    public void sendEmail(String to, String subject, String htmlBody) {
        try {
            Gmail service = buildGmailService();
            Message message = createMessage(to, subject, htmlBody);
            service.users().messages().send("me", message).execute();
        } catch (Exception e) {
            // No lanzamos excepción para no bloquear el flujo principal
            System.err.println("Error al enviar correo: " + e.getMessage());
        }
    }

    // Construir el mensaje MIME — equivalente al create_message_html() de Python
    private Message createMessage(String to, String subject, String htmlBody)
            throws MessagingException, IOException {

        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);

        MimeMessage email = new MimeMessage(session);
        email.setFrom(new InternetAddress("me"));
        email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
        email.setSubject(subject);
        email.setContent(htmlBody, "text/html; charset=utf-8");

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        email.writeTo(buffer);
        String encodedEmail = Base64.getUrlEncoder().encodeToString(buffer.toByteArray());

        Message message = new Message();
        message.setRaw(encodedEmail);
        return message;
    }

    // HTML del correo 2FA para Register y Login
    public String build2FAEmailHtml(String userName, String codigo) {
        return """
                <!DOCTYPE html>
                <html lang="es">
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <div style="max-width:600px; margin:40px auto; background:#fff;
                                border-radius:8px; padding:30px;">
                        <h2 style="color:#1a73e8;"> Sistema de Buses Inteligentes</h2>
                        <p>Hola <b>%s</b>, tu código de verificación es:</p>
                        <div style="font-size:36px; font-weight:bold; letter-spacing:8px;
                                    color:#1a73e8; text-align:center; padding:20px;
                                    background:#f0f4ff; border-radius:8px; margin:20px 0;">
                            %s
                        </div>
                        <p>Este código expira en <b>5 minutos</b>.</p>
                        <p>Si no fuiste tú, ignora este correo.</p>
                    </div>
                </body>
                </html>
                """.formatted(userName, codigo);
    }

    // HTML del correo 2FA para Password Recovery
    public String buildRecoveryEmailHtml(String userName, String codigo) {
        return """
            <!DOCTYPE html>
            <html lang="es">
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
                <div style="max-width:600px; margin:40px auto; background:#fff;
                            border-radius:8px; overflow:hidden;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <div style="background:#d93025; padding:30px; text-align:center;">
                        <h1 style="color:#fff; margin:0; font-size:22px;">
                             Recuperación de Contraseña
                        </h1>
                        <p style="color:#ffd0cc; margin:8px 0 0 0; font-size:14px;">
                            Sistema de Buses Inteligentes
                        </p>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding:30px; color:#333;">
                        <p>Hola <b>%s</b>,</p>
                        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                           Tu código de recuperación es:</p>

                        <div style="font-size:36px; font-weight:bold; letter-spacing:10px;
                                    color:#d93025; text-align:center; padding:25px;
                                    background:#fff5f5; border:2px dashed #d93025;
                                    border-radius:8px; margin:20px 0;">
                            %s
                        </div>

                        <p>Este código expira en <b>5 minutos</b>.</p>

                        <div style="background:#fff3cd; border-left:4px solid #ffc107;
                                    padding:12px; border-radius:4px; margin:20px 0;">
                            ⚠️ <b>Si no solicitaste este cambio</b>, ignora este correo.
                            Tu contraseña actual seguirá siendo la misma.
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background:#f4f4f4; padding:20px; text-align:center;
                                font-size:12px; color:#888;">
                        <p>Este es un correo automático, por favor no respondas.</p>
                        <p>&copy; 2025 Sistema de Buses Inteligentes.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, codigo);
    }

    // HTML del correo de notificación de cambio de rol
    public String buildRoleChangeEmailHtml(String userName, String roleName, String action) {
        String actionColor = action.equals("asignado") ? "#1a73e8" : "#d93025";
        String actionIcon = action.equals("asignado") ? "✅" : "🔄";
        String actionVerb = action.equals("asignado") ? "se te ha asignado" : "se te ha removido";
        String actionPrep = action.equals("asignado") ? "" : " de";

        return """
            <!DOCTYPE html>
            <html lang="es">
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
                <div style="max-width:600px; margin:40px auto; background:#fff;
                            border-radius:8px; overflow:hidden;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <div style="background:%s; padding:30px; text-align:center;">
                        <h1 style="color:#fff; margin:0; font-size:22px;">
                            %s Cambio de Rol
                        </h1>
                        <p style="color:rgba(255,255,255,0.8); margin:8px 0 0 0; font-size:14px;">
                            Sistema de Buses Inteligentes
                        </p>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding:30px; color:#333;">
                        <p>Hola <b>%s</b>,</p>
                        <p>Te informamos que %s el rol%s:</p>

                        <div style="font-size:24px; font-weight:bold;
                                    color:%s; text-align:center; padding:20px;
                                    background:#f0f4ff; border-radius:8px; margin:20px 0;">
                            %s
                        </div>

                        <p>Este cambio ya está activo en tu cuenta. La próxima vez que inicies sesión,
                           tus permisos reflejarán esta actualización.</p>

                        <div style="background:#e8f5e9; border-left:4px solid #4caf50;
                                    padding:12px; border-radius:4px; margin:20px 0;">
                            💡 Si no esperabas este cambio, contacta al administrador del sistema.
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background:#f4f4f4; padding:20px; text-align:center;
                                font-size:12px; color:#888;">
                        <p>Este es un correo automático, por favor no respondas.</p>
                        <p>&copy; 2025 Sistema de Buses Inteligentes.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(actionColor, actionIcon, userName, actionVerb, actionPrep, actionColor, roleName);
    }
}
