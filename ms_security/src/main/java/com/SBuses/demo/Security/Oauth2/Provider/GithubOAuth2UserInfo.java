package com.SBuses.demo.Security.Oauth2.Provider;

import java.util.Map;

public class GithubOAuth2UserInfo extends OAuth2UserInfo {

    public GithubOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
    }

    @Override
    public String getId() {
        return ((Integer) attributes.get("id")).toString();
    }

    @Override
    public String getName() {
        return (String) attributes.get("login"); // Github might not always provide a name
    }

    @Override
    public String getLastName() {
        return ""; // Github does not provide last name reliably
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getPhoto() {
        return (String) attributes.get("avatar_url");
    }
}
