package com.SBuses.demo.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Service
public class RecaptchaService {

    @Value("${recaptcha.secret}")
    private String secretKey;

    @Value("${recaptcha.min-score}")
    private double minScore;

    private static final String RECAPTCHA_URL =
            "https://www.google.com/recaptcha/api/siteverify";

    /**
     * Valida el token reCAPTCHA v3 contra la API de Google.
     * Retorna true si el score supera el mínimo configurado.
     */
    public boolean validate(String token) {
        try {
            String requestBody = "secret=" + URLEncoder.encode(secretKey, StandardCharsets.UTF_8)
                    + "&response=" + URLEncoder.encode(token, StandardCharsets.UTF_8);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RECAPTCHA_URL))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request,
                    HttpResponse.BodyHandlers.ofString());

            ObjectMapper mapper = new ObjectMapper();
            JsonNode json = mapper.readTree(response.body());

            boolean success = json.get("success").asBoolean();

            // Si no tiene campo "score" (puede pasar con tokens de prueba),
            // asumimos score máximo si success es true
            double score = json.has("score") ? json.get("score").asDouble() : 1.0;

            return success && score >= minScore;

        } catch (IOException | InterruptedException e) {
            System.err.println("Error validando reCAPTCHA: " + e.getMessage());
            return false;
        }
    }
}
