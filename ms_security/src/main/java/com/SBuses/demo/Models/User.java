package com.SBuses.demo.Models;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.Date;
import java.util.List;

@Data
@Document
public class User {
    @Id
    private String id;

    private String name;
    private String lastName;

    @Indexed(unique = true)
    private String email;

    private String password;
    private String phone;
    private String address;
    private String photo;
    private Date registrationDate;
    private Date lastTime;
    private boolean activo;

    private List<String> roles;  // referencia

    private List<AuthExterna> authExternas;  // embebido

    public User(){

    }

    public User(String name, String lastName, String email, String password, String phone, String address, String photo, Date registrationDate, Date lastTime, boolean activo, List<String> roles, List<AuthExterna> authExternas) {
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.address = address;
        this.photo = photo;
        this.registrationDate = registrationDate;
        this.lastTime = lastTime;
        this.activo = activo;
        this.roles = roles;
        this.authExternas = authExternas;
    }
}
