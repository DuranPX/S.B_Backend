package com.SBuses.demo.Models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.List;

@Data
@Document(collection = "Role")
public class Role {
    @Id
    private String id;

    @Indexed(unique = true)
    private String name;

    private String description;
    private boolean activo;
    private List<Permission> permisos;

    public Role(String name, String description, boolean activo, List<Permission> permisos) {
        this.name = name;
        this.description = description;
        this.activo = activo;
        this.permisos = permisos;
    }
}
