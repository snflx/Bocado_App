# Aplicativo de reseñas de restaurantes

Proyecto final de Desarrollo Web. La solución implementa un frontend en React, un backend en Node.js/Express y persistencia en MongoDB.

## Funcionalidades

- Registro e inicio de sesión de usuarios.
- El token JWT de sesión se almacena en `sessionStorage`.
- Visualización de reseñas de todos los usuarios autenticados.
- Creación, edición y eliminación de reseñas propias.
- Restricción de seguridad: un usuario no puede actualizar ni borrar reseñas de otros usuarios.

## Estructura

```text
backend/   API REST en Node.js, Express y MongoDB
frontend/  Aplicación React con Vite
```

## Usuarios de prueba

| Rol | Email | Contraseña |
| --- | --- | --- |
| **Administrador** | `juanpablo@bocado.app` | `Bocado2024!` |
| Usuario normal | `mateo@bocado.app` | `Bocado2024!` |

> El admin puede acceder al panel de administración (`/admin`) para gestionar usuarios y reseñas.
> Un usuario normal solo puede crear, editar y eliminar sus propias reseñas.

## Ejecución local

1. Iniciar MongoDB:

```bash
docker compose up -d
```

2. Configurar backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

3. Configurar frontend:

```bash
cd frontend
npm install
npm run dev
```

El frontend queda disponible normalmente en `http://localhost:5173` y el backend en `http://localhost:4000`.

## Variables de entorno

El backend usa:

- `PORT`: puerto de la API.
- `MONGODB_URI`: cadena de conexión de MongoDB.
- `JWT_SECRET`: secreto para firmar tokens.
- `JWT_EXPIRES_IN`: tiempo de expiración del token.
- `CLIENT_ORIGIN`: origen permitido por CORS.

## Endpoints principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Registrar usuario |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `GET` | `/api/auth/me` | Consultar usuario autenticado |
| `GET` | `/api/reviews` | Listar reseñas de todos los usuarios |
| `POST` | `/api/reviews` | Crear reseña propia |
| `GET` | `/api/reviews/:id` | Consultar reseña |
| `PUT` | `/api/reviews/:id` | Actualizar reseña propia |
| `DELETE` | `/api/reviews/:id` | Eliminar reseña propia |

## Stack frontend

- **React 18** con Vite 8
- **Phosphor Icons** (weight thin) en reemplazo de Lucide
- **Framer Motion** para animaciones de UI (transiciones, stagger, hover/tap)
- **Three.js + React Three Fiber** para fondo 3D decorativo en la página de autenticación
- Code splitting: `three` y `framer-motion` en chunks separados; el componente 3D se carga con `lazy`

## Consideraciones técnicas

### Fiabilidad

- Manejo centralizado de errores en el backend.
- Validación de datos de entrada antes de guardar o actualizar.
- Respuestas HTTP consistentes para errores de autenticación, autorización, validación y recursos inexistentes.
- Health check en `/health` para verificar disponibilidad de la API.

### Infraestructura

- MongoDB definido en `docker-compose.yml` para facilitar despliegue local.
- Separación clara entre frontend y backend.
- Variables de entorno fuera del código fuente.
- `.gitignore` evita subir `node_modules`, `.angular`, builds y archivos sensibles.

### Seguridad

- Contraseñas almacenadas con hash `bcrypt`.
- Autenticación con JWT.
- El token se guarda en `sessionStorage`, como pide la actividad.
- CORS limitado al origen configurado.
- `helmet` agrega cabeceras HTTP defensivas.
- Rate limit sobre rutas de autenticación para reducir intentos abusivos.
- Control de propiedad en backend: las operaciones `PUT` y `DELETE` verifican que la reseña pertenezca al usuario autenticado.

### Datos y sistemas

- Modelo `User` con nombre, correo único y contraseña hasheada.
- Modelo `Review` asociado a `user`, con restaurante, ciudad, calificación, comentario y fechas.
- Índices para consultas frecuentes por usuario, fecha y restaurante.
- La API devuelve datos del autor sin exponer contraseñas.

### Escala

- Listado de reseñas paginado con `page` y `limit`.
- Límite máximo de página para evitar respuestas excesivas.
- Ordenamiento por fecha descendente.
- Backend sin estado de sesión en memoria; el JWT permite escalar horizontalmente.

### Casos límite

- Correos duplicados.
- Credenciales inválidas.
- Token ausente, inválido o expirado.
- IDs de MongoDB mal formados.
- Reseña inexistente.
- Intento de editar o borrar reseñas de otro usuario.
- Calificaciones fuera del rango permitido.
- Comentarios demasiado largos o campos vacíos.

## Autores

- Juan Pablo Sanchez Florez
- Juan Esteban Seguro Herrera
- Mateo Cano Rendon

