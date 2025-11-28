# 🧭 Sistema de Gestión de Espacios de Coworking (MERN + TypeScript)

Monorepo que contiene **backend (back)** y **frontend (front)** de un sistema de reservas de espacios de coworking.  
Proyecto realizado para la materia **Programación 3 - 2025**.

---

## 🚀 Tecnologías principales

- **Backend (back):** Node.js · Express · TypeScript · MongoDB (Mongoose)
- **Frontend (front):** React · Vite · TypeScript · MUI Design
- **Autenticación:** JWT almacenado en cookie httpOnly

---

## 📦 Requisitos previos

- Node.js 18 o superior
- MongoDB 6 o superior
- npm o pnpm

---

## 🗂️ Estructura del proyecto

```
.
├─ back/       → API (Express + TypeScript + MongoDB)
└─ front/      → Aplicación web (React + Vite + TypeScript)
```

---

## 🔧 Variables de entorno

Ubicadas en archivos `.env`:

- [back/.env](back/.env)
- [front/.env](front/.env)

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

- Frontend: [http://localhost:5174](http://localhost:5174)
- Backend: [http://localhost:4000](http://localhost:4000)

---

**🔐 Credenciales iniciales:**

- admin: `admin@cowork.com` / `Admin123!`
- cliente1: `client1@cowork.com` / `Client123!`
- cliente2: `client2@cowork.com` / `Client123!`

---

## 🔌 Endpoints principales (BACK)

| Método | Ruta                           | Descripción                   |
| ------ | ------------------------------ | ----------------------------- |
| POST   | `/api/auth/login`              | Login y JWT                   |
| GET    | `/api/auth/me`                 | Perfil del usuario            |
| POST   | `/api/auth/logout`             | Cerrar sesion                 |
| GET    | `/api/spaces`                  | Listar espacios activos       |
| GET    | `/api/spaces/availability`     | IDs disponibles               |
| POST   | `/api/spaces`                  | Crear espacio (admin)         |
| PUT    | `/api/spaces`                  | Modifica espacio (admin)      |
| DELETE | `/api/spaces`                  | Eliminar espacio (admin)      |
| GET    | `/api/bookings`                | Listar reservas (admin)       |
| GET    | `/api/bookings/my`             | Listar mis reservas           |
| POST   | `/api/bookings`                | Reservar un espacio           |
| PATCH  | `/api/bookings/:id/confirm`    | Confirmar reserva             |
| PATCH  | `/api/bookings/:id/reschedule` | Reprogramar reserva           |
| PATCH  | `/api/bookings/:id/cancel`     | Cancelar reserva              |
| GET    | `/api/admin/metrics`           | Métricas (admin)              |
| GET    | `/api/admin/top-spaces`        | Top reservas (admin)          |
| GET    | `/api/ratings`                 | Listar calificaciones         |
| POST   | `/api/ratings`                 | Crear/actualizar calificación |

---

## 🧭 Rutas principales (FRONT)

| Ruta              | Descripción                 |
| ----------------- | --------------------------- |
| `/login`          | Inicio de sesión            |
| `/`               | Métricas (admin)            |
| `/admin`          | Métricas (admin)            |
| `/admin/spaces`   | Géstion de espacios (admin) |
| `/admin/bookings` | Géstion de reservas (admin) |
| `/spaces`         | Listar espacios             |
| `/bookings`       | Listar mis reservas         |
| `/ratings`        | Calificaciones              |

---

## ✨ Funcionalidades principales

- Login con JWT
- Roles: administrador / cliente
- CRUD de espacios (admin)
- Reservas por día con validación de disponibilidad y bloqueo inmediato del espacio
- Pago de reservas (módulo de tarjeta con validaciones básicas y confirmación automática)
- Cancelación antes de la fecha
- Métricas y top espacios más reservados
- Calificaciones con promedio por espacio
- Log de errores (en `back/logs/`)
- Ruteo con mínimo 5 páginas en el frontend

---

## 🌱 Migración inicial (seed)

Se ejecuta al correr la aplicacion si no existen datos en las colecciones.

---

## 👤 Autor

**Jonathan Calvo**
