# Microservicio Business (ms-business)

Este microservicio se encarga de gestionar la logica principal de la plataforma, abarcando multiples dominios como usuarios, mensajeria, transporte, operacion y pagos. A continuacion se detalla la estructura base de los dominios y entidades correspondientes.

## Estructura de Dominios y Modulos

### 1. Usuarios
- Persona
- Conductor
- Ciudadano
- Direccion
- Historial

### 2. Mensajeria
- Mensaje
- DestinatarioPersona
- DestinatarioGrupo
- Grupo
- GrupoPersona

### 3. Transporte
- Bus
- Ruta
- Paradero
- Nodo
- Programacion
- Gps
- Empresa

### 4. Operacion
- Turno
- Incidente
- IncidenteBus
- Foto

### 5. Pagos
- MetodoPago
- MetodoPagoCiudadano

### 6. Otros
- Boleto

## Relaciones del Modelo de Negocio

### Herencias
- Persona hereda a Conductor y Ciudadano (Conductor y Ciudadano extienden de Persona).

### Relaciones 1:1
- Bus 1:1 Gps
- Ciudadano 1:1 Direccion

### Relaciones 1:N (y su inverso N:1)
- Persona 1:N Mensaje (Emisor)
- Mensaje 1:N DestinatarioPersona
- Mensaje 1:N DestinatarioGrupo
- Ruta 1:N Programacion
- Programacion 1:N Bus
- Empresa 1:N Bus
- Ciudadano 1:N Boleto
- Programacion 1:N Boleto
- Ruta 1:N Paradero
- Bus 1:N Incidente
- Bus 1:N IncidenteBus
- IncidenteBus 1:N Foto

### Relaciones N:N (por revisar su tabla intermedia si es requerida por TypeORM)
- Ruta 1:N Nodo (Aclarar validacion de relacion)
- Paradero 1:N Nodo (Aclarar validacion)

### Relaciones con Entidad Intermedia (Roles o Tiempos)
- Conductor 1:N Turno / Bus 1:N Turno (Turno actua como entidad intermedia entre Conductor y Bus).
- Incidente 1:N IncidenteBus / Bus 1:N IncidenteBus (IncidenteBus es la entidad intermedia con detalles extra, que luego se relaciona a Fotos 1:N).

### Relaciones N:N con Tablas Intermedias Definidas
- Persona N:N Grupo -> GrupoPersona
- Mensaje N:N Persona -> DestinatarioPersona (Atributo adicional: leido)
- Mensaje N:N Grupo -> DestinatarioGrupo
- Ciudadano N:N MetodoPago -> MetodoPagoCiudadano

### Notas Adicionales
- Historial y Nodo: Relaciones de historial por definirse a detalle (si es 1:N o N:N segun logica). 
- Todas estas entidades han sido incializadas a nivel estructural en NestJS con su respectivo Controller, Service, Module y DTO.

## Instalacion y Ejecucion
1. Configurar variables de entorno copiando el `.env` correspondiente.
2. Usar `npm install` para dependencias.
3. El proyecto hace uso de base de datos MySQL gestionada a traves de TypeORM y validadores definidos en `class-validator`.
