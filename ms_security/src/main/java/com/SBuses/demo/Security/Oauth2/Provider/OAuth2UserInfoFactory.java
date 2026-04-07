package com.SBuses.demo.Security.Oauth2.Provider;

import java.util.Map;

public class OAuth2UserInfoFactory {

    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        if (registrationId.equalsIgnoreCase("google")) {
            return new GoogleOAuth2UserInfo(attributes);
        } else if (registrationId.equalsIgnoreCase("github")) {
            return new GithubOAuth2UserInfo(attributes);
        } else if (registrationId.equalsIgnoreCase("microsoft") || registrationId.equalsIgnoreCase("azure")) {
            return new MicrosoftOAuth2UserInfo(attributes);
        } else {
            throw new RuntimeException("Sorry! Login with " + registrationId + " is not supported yet.");
        }
    }
}
