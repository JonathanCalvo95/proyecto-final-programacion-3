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
| POST   | `/api/auth/logout`             | Cerrar sesión                 |
| GET    | `/api/spaces`                  | Listar espacios activos       |
| GET    | `/api/spaces/availability`     | IDs disponibles               |
| POST   | `/api/spaces`                  | Crear espacio (admin)         |
| PUT    | `/api/spaces`                  | Modifica espacio (admin)      |
| DELETE | `/api/spaces`                  | Eliminar espacio (admin)      |
| GET    | `/api/bookings`                | Listar reservas (admin)       |
| GET    | `/api/bookings/my`             | Listar mis reservas           |
| GET    | `/api/bookings/:id`            | Detalle de reserva            |
| POST   | `/api/bookings`                | Reservar un espacio           |
| PATCH  | `/api/bookings/:id/confirm`    | Confirmar reserva             |
| PATCH  | `/api/bookings/:id/reschedule` | Reprogramar reserva (admin)   |
| PATCH  | `/api/bookings/:id/cancel`     | Cancelar reserva (cliente)    |
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
| `/admin/spaces`   | Gestión de espacios (admin) |
| `/admin/bookings` | Gestión de reservas (admin) |
| `/admin/users`    | Gestión de usuarios (admin) |
| `/spaces`         | Listar y reservar espacios  |
| `/bookings`       | Listar mis reservas         |
| `/bookings/:id`   | Detalle de reserva          |
| `/ratings`        | Calificaciones              |

---

---

## ✨ Funcionalidades principales

- Login con JWT y roles (admin/cliente)
- Gestión de usuarios (admin)
- CRUD de espacios (admin)
- Reservas por día
- Pago de reservas (tarjeta, validaciones y confirmación automática)
- Cancelación y reprogramación de reservas
- Métricas y ranking de espacios
- Calificaciones con promedio por espacio
- Log de errores (en `back/logs/`)
- Seeds automáticos para datos de ejemplo
- UI profesional y responsiva

---

## 🌱 Migración inicial (seed)

Se ejecuta automáticamente al iniciar la aplicación si no existen datos en las colecciones principales (usuarios, espacios, reservas, pagos, ratings).

---

## 👤 Autor

**Jonathan Calvo**
