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
    private String nombre;

    private String descripcion;
    private boolean activo;
    private List<Permission> permisos;

    public Role() {
    }

    public Role(String nombre, String descripcion, boolean activo, List<Permission> permisos) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.activo = activo;
        this.permisos = permisos;
    }
}
