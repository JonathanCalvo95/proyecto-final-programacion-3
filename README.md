# Sistema de Gestión de Espacios de Coworking (MERN + TypeScript)

Monorepo que contiene **backend (back)** y **frontend (front)** de un sistema de reservas de espacios de coworking.  
Proyecto realizado para la materia **Programación 3 - 2025**.

---

## Tecnologías principales

- **Backend (back):** Node.js · Express · TypeScript · MongoDB (Mongoose)
- **Frontend (front):** React · Vite · TypeScript · MUI Design
- **Autenticación:** JWT almacenado en cookie httpOnly
- **Roles:** administrador y cliente

---

## Requisitos previos

- Node.js 18 o superior
- MongoDB 6 o superior
- npm o pnpm

---

## Estructura del proyecto

```
.
├─ back/       → API (Express + TypeScript + MongoDB)
└─ front/      → Aplicación web (React + Vite + TypeScript)
```

---

## Variables de entorno

Ubicadas en archivo `.env`:

- [back/.env](back/.env)
- [front/.env](front/.env)

---

**Credenciales iniciales:**

- admin: `admin@cowork.com` / `Admin123!`
- cliente: `client@cowork.com` / `Client123!`

---

## ▶️ Ejecución en desarrollo

Abrir **dos terminales**:

**Terminal 1 – Backend**

```bash
cd back
npm install
npm run dev
```

**Terminal 2 – Frontend**

```bash
cd front
npm install
npm run dev
```

**URLs**

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:4000](http://localhost:4000)

---

## Endpoints principales (BACK)

| Método | Ruta                       | Descripción             |
| ------ | -------------------------- | ----------------------- |
| POST   | `/api/auth/register`       | Crear usuario nuevo     |
| POST   | `/api/auth/login`          | Login y JWT             |
| GET    | `/api/users/me`            | Perfil del usuario      |
| GET    | `/api/spaces`              | Listar espacios activos |
| POST   | `/api/spaces`              | Crear espacio (admin)   |
| POST   | `/api/bookings`            | Reservar un espacio     |
| PATCH  | `/api/bookings/:id/cancel` | Cancelar reserva        |
| GET    | `/api/admin/metrics`       | Métricas (admin)        |

---

## Rutas principales (FRONT)

| Ruta        | Descripción             |
| ----------- | ----------------------- |
| `/login`    | Inicio de sesión        |
| `/register` | Registro                |
| `/`         | Listado de espacios     |
| `/bookings` | Mis reservas            |
| `/admin`    | Panel de administración |

---

## Funcionalidades principales

- Login y registro con JWT
- Roles: administrador / cliente
- CRUD de espacios (admin)
- Reservas con validación de disponibilidad
- Cancelación antes de la fecha
- Métricas y top espacios más reservados
- Log de errores (en `back/logs/`)
- Ruteo con mínimo 5 páginas en el frontend

---

## Migración inicial (seed)

Se ejecuta al correr la aplicacion si no existen datos en las colecciones.

---

## Autor

**Jonathan Calvo**  
Proyecto académico - Universidad 2025
