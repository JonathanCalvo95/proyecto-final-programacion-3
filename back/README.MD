# 🧩 Backend - API Coworking

API REST desarrollada en **Node.js + Express + TypeScript** conectada a **MongoDB** mediante Mongoose.  
Gestiona usuarios, espacios y reservas con autenticación JWT y roles.

---

## 🚀 Iniciar el servidor

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

Servidor disponible en: [http://localhost:4000](http://localhost:4000)

---

## ⚙️ Variables de entorno

Archivo `.env`:

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/coworking
JWT_SECRET=clave_ultra_segura
JWT_EXPIRES=7d
LOG_PATH=./logs/errors.log
```

---

## 🧱 Estructura del proyecto

```
src/
 ├─ routes/          → rutas (auth, users, spaces, bookings)
 ├─ schemas/         → modelos Mongoose
 ├─ middlewares/     → autenticación, manejo de errores, validaciones
 ├─ utils/           → conexión a MongoDB, logger, helpers
 ├─ app.ts           → configuración Express
 └─ bin/www.ts       → arranque del servidor
```

---

## 🧮 Endpoints principales

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

## 🧾 Migración inicial (seed)

Crea usuarios y espacios base:

```bash
npm run seed
```

**Usuarios iniciales:**

- `admin@cowork.com` / `Admin123!`
- `cliente@cowork.com` (si está habilitado en el seed)

---

## 🧰 Scripts útiles

| Comando         | Descripción                      |
| --------------- | -------------------------------- |
| `npm run dev`   | Ejecuta el servidor con nodemon  |
| `npm run build` | Compila TypeScript a JavaScript  |
| `npm start`     | Inicia el servidor en producción |
| `npm run seed`  | Ejecuta la migración inicial     |

---

## 🧠 Características

- JWT en cookie httpOnly
- Manejo centralizado de errores
- Logs en archivo `logs/errors.log`
- Validación de solapamiento de reservas
- Estructura clara y mantenible

---

## 🧾 Licencia

Uso educativo – Programación 3 (2025)
