package com.SBuses.demo.Security.Oauth2.Provider;

import java.util.Map;

public class MicrosoftOAuth2UserInfo extends OAuth2UserInfo {

    public MicrosoftOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
    }

    @Override
    public String getId() {
        // En Azure AD el id es comúnmente llamado 'oid' o 'sub'
        if (attributes.containsKey("oid")) {
            return (String) attributes.get("oid");
        }
        return (String) attributes.get("sub");
    }

    @Override
    public String getName() {
        return (String) attributes.get("given_name");
    }

    @Override
    public String getLastName() {
        return (String) attributes.get("family_name");
    }

    @Override
    public String getEmail() {
        if (attributes.containsKey("email")) {
            return (String) attributes.get("email");
        }
        return (String) attributes.get("preferred_username");
    }
}
