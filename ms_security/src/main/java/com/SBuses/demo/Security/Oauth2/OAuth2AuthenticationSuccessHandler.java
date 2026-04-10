package com.SBuses.demo.Security.Oauth2;

import com.SBuses.demo.Models.AuthExternal;
import com.SBuses.demo.Models.Role;
import com.SBuses.demo.Models.User;
import com.SBuses.demo.Repository.RoleRepository;
import com.SBuses.demo.Repository.UserRepository;
import com.SBuses.demo.Security.JWT.JwtUtil;
import com.SBuses.demo.Security.Oauth2.Provider.OAuth2UserInfo;
import com.SBuses.demo.Security.Oauth2.Provider.OAuth2UserInfoFactory;
import com.SBuses.demo.Service.TwoFactorService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;


@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TwoFactorService twoFactorService;

    @Value("${oauth2.redirect.url:http://localhost:5000/auth/success}")
    private String redirectUrl;

    @Value("${oauth2.use2fa:false}")
    private boolean use2fa;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
                                            
        OAuth2AuthenticationToken authToken = (OAuth2AuthenticationToken) authentication;
        String provider = authToken.getAuthorizedClientRegistrationId();
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(provider, oAuth2User.getAttributes());

        String email = userInfo.getEmail();
        String name = userInfo.getName();
        String lastName = userInfo.getLastName();
        String providerId = userInfo.getId();

        if (email == null) {
            // Manejo de error si el email no es provisto
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not found from OAuth2 provider");
            return;
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Crear nuevo usuario ciudadano
            Role rolCiudadano = roleRepository.findByNombre("Ciudadano")
                    .orElseThrow(() -> new RuntimeException("Rol Ciudadano no encontrado"));

            user = new User();
            user.setName(name != null ? name : "Unknown");
            user.setLastName(lastName != null ? lastName : "");
            user.setEmail(email);
            user.setPassword(null);
            user.setActivo(true);
            user.setRegistrationDate(new Date());
            user.setRoles(new ArrayList<>(List.of(rolCiudadano.getNombre())));
            user.setAuthExternals(new ArrayList<>());
        }

        // Revisar y asociar AuthExternal si no existe para este proveedor
        boolean providerExists = false;
        if (user.getAuthExternals() != null) {
            for (AuthExternal external : user.getAuthExternals()) {
                if (external.getProveedor().equalsIgnoreCase(provider)) {
                    providerExists = true;
                    break;
                }
            }
        } else {
            user.setAuthExternals(new ArrayList<>());
        }

        if (!providerExists) {
            AuthExternal authExternal = new AuthExternal();
            authExternal.setProveedor(provider);
            authExternal.setIdExterno(providerId);
            authExternal.setEmail(email);
            authExternal.setFechaVinculacion(new Date());
            user.getAuthExternals().add(authExternal);
        }

        userRepository.save(user);

        String targetUrl;
        
        if (use2fa) {
            twoFactorService.sendCode(email, "LOGIN");
            targetUrl = redirectUrl + "?email=" + email + "&require2fa=true";
        } else {
            String token = jwtUtil.generateToken(user.getId(), email, user.getRoles());
            targetUrl = redirectUrl + "?token=" + token;
        }

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
