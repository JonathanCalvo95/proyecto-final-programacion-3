# 💻 Frontend - Coworking App

Aplicación web construida con **React + Vite + TypeScript + Ant Design**.  
Permite a los clientes reservar espacios y a los administradores gestionar y visualizar métricas.

---

## 🚀 Iniciar la aplicación

```bash
npm install
cp .env.example .env
npm run dev
```

Aplicación disponible en [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Variables de entorno

Archivo `.env`:

```
VITE_API_URL=http://localhost:4000/api
```

---

## 🧱 Estructura del proyecto

```
src/
 ├─ modules/
 │   ├─ auth/        → Login y registro
 │   ├─ spaces/      → Listado y detalle de espacios
 │   ├─ bookings/    → Reservas e historial
 │   └─ admin/       → Panel de métricas y top espacios
 ├─ components/      → Header, PrivateRoute, etc.
 ├─ services/        → Llamadas a la API (fetch/axios)
 ├─ utils/           → Helpers y manejo de storage
 ├─ App.tsx          → Ruteo principal
 └─ main.tsx         → Entrada del proyecto
```

---

## 🧮 Rutas principales

| Ruta        | Descripción             |
| ----------- | ----------------------- |
| `/login`    | Inicio de sesión        |
| `/register` | Registro                |
| `/`         | Listado de espacios     |
| `/bookings` | Mis reservas            |
| `/admin`    | Panel de administración |

---

## 🎨 UI / Librerías usadas

- **Ant Design** (componentes y layout)
- **React Router v6** (ruteo)
- **Fetch API / Axios** (comunicación con backend)
- **TypeScript** (tipado estricto)
- **Vite** (build y servidor de desarrollo)

---

## 🧰 Scripts útiles

| Comando           | Descripción            |
| ----------------- | ---------------------- |
| `npm run dev`     | Modo desarrollo        |
| `npm run build`   | Build de producción    |
| `npm run preview` | Vista previa del build |

---

## 👥 Roles

- **Administrador:**  
  Gestiona espacios y accede a métricas.

- **Cliente:**  
  Puede reservar, cancelar y ver historial.

---

## 🧾 Licencia

Uso educativo – Programación 3 (2025)
