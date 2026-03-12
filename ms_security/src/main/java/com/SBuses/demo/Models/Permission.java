package com.SBuses.demo.Models;

import lombok.Data;

@Data
public class Permission {

    private String modulo;
    private boolean escribir;
    private boolean leer;
    private boolean editar;
    private boolean eliminar;

    public Permission(String modulo, boolean escribir, boolean leer, boolean editar, boolean eliminar) {
        this.modulo = modulo;
        this.escribir = escribir;
        this.leer = leer;
        this.editar = editar;
        this.eliminar = eliminar;
    }

    public Permission() {

    }
}
