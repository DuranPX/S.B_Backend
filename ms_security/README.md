# Documentación de MS_Security y Configuración OAuth2

## Añadir un Nuevo Proveedor OAuth2 (Ej: Linkedin, Facebook)

El módulo de seguridad de OAuth2 ha sido refactorizado aplicando el Principio de Inversión de Dependencias (DIP). Esto significa que la lógica dura de `SegurityConfig` ha sido abstraída y ahora escalar la app para aceptar nuevos proveedores está desconectado del núcleo de seguridad principal.

Para añadir un nuevo proveedor, por favor sigue estos pasos:

### 1. Crear el objeto `UserInfo` del Proveedor
Crea una nueva clase (ej: `LinkedInOAuth2UserInfo`) en el paquete `com.SBuses.demo.Security.Oauth2.Provider` que implemente la abstracción base `OAuth2UserInfo`:

```java
public class LinkedInOAuth2UserInfo extends OAuth2UserInfo {
    
    public LinkedInOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
    }
    // Implementa getId(), getName(), getLastName(), getEmail()
    // leyendo del map respectivo.
}
```

### 2. Registrar en la Factoría
Abre la clase `OAuth2UserInfoFactory` y añade una nueva sentencia en el `if/else` usando el identificador (registrationId) con el que se haya registrado en Spring Security (fichero `.properties` o `.yml`).

```java
if (registrationId.equalsIgnoreCase("linkedin")) {
    return new LinkedInOAuth2UserInfo(attributes);
}
```

### 3. Agregar credenciales de Spring Security
Configura en tu fichero `.env` o `.properties` el Client ID y Client Secret tal como haces normalmente con las propiedades de OAuth2 de Spring Security. 
¡Y listo! El resto de flujos, el POLP sobre JWT en `JwtFilter`, los arreglos de 2FA y validaciones en DB se ejecutarán automáticamente gracias al `OAuth2AuthenticationSuccessHandler`.

---
## Opciones de Redirección (Variables de Entorno .env)

Para definir el comportamiento al finalizar OAuth, modifica estas variables:
- `oauth2.redirect.enabled=true` (activa la redirección hacia el frontend)
- `oauth2.redirect.url=http://tusitio.com/auth/success` (url donde recibe el token o 2fa_request)
- `oauth2.use2fa=false` (decide si exigir 2FA tras completarse OAuth. Si es `true`, la app enviará un código al correo y redirigirá al frontend pidiéndolo en la UI).

---

## ¿Cómo conectar desde el Frontend?

El flujo OAuth2 en Spring Security funciona mediante **redirecciones del navegador** (no se debe hacer con llamadas AJAX tipo `fetch` o `axios`).

### 1. El Botón de Login en tu Frontend
Agrega un simple enlace o botón que redirija al inicio del flujo que provee Spring Security nativamente apuntando al backend `/oauth2/authorization/{proveedor}`:

```html
<!-- En React, Vue, Angular o HTML puro, es solo un link -->
<a href="http://localhost:8080/oauth2/authorization/google" class="btn">
    Iniciar sesión con Google
</a>

<a href="http://localhost:8080/oauth2/authorization/github" class="btn">
    Iniciar sesión con GitHub
</a>
```

### 2. Receptor en tu Frontend (`/auth/success`)
Una vez el usuario acepte permisos en Google, Google devuelve los datos a Spring Boot, y nuestro `OAuth2AuthenticationSuccessHandler` redirigirá automáticamente a la URL que hayas configurado en el `.env` (ej: `http://localhost:5000/auth/success`).

En tu vista/componente de esa ruta, captura la URL:

```javascript
// Si usas React Router, por ejemplo:
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const require2fa = searchParams.get('require2fa');
    const email = searchParams.get('email');

    if (token) {
      // 1. Caso: Login directo sin 2FA
      localStorage.setItem('token', token);
      navigate('/dashboard'); // Y listos para seleccionar el rol
    } else if (require2fa === 'true') {
      // 2. Caso: OAuth fue exitoso pero pedimos 2FA extra
      // Mandarlo a la pantalla del "Pin" y guardamos el email que nos vino
      navigate(`/verificar-2fa?email=${email}`);
    }
  }, [searchParams, navigate]);

  return <div>Procesando autenticación segura...</div>;
}

export default AuthSuccess;
```
