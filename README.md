# 🏢 Sistema de Gestión de Espacios de Coworking (MERN + TypeScript)

Monorepo que contiene **backend (back)** y **frontend (front)** de un sistema de reservas de espacios de coworking.  
Proyecto realizado para la materia **Programación 3 - 2025**.

---

## 🧩 Tecnologías principales

- **Backend (back):** Node.js · Express · TypeScript · MongoDB (Mongoose)
- **Frontend (front):** React · Vite · TypeScript · Ant Design
- **Autenticación:** JWT almacenado en cookie httpOnly
- **Roles:** administrador y cliente

---

## ⚙️ Requisitos previos

- Node.js 18 o superior
- MongoDB 6 o superior
- npm o pnpm

---

## 📁 Estructura del proyecto

```
.
├─ back/       → API (Express + TypeScript + MongoDB)
└─ front/      → Aplicación web (React + Vite + TypeScript)
```

Cada carpeta tiene su propio **README.md** con instrucciones específicas:

- 👉 [back/README.md](back/README.md)
- 👉 [front/README.md](front/README.md)

---

## 🧾 Variables de entorno

1. Copiar los archivos `.env.example` de `back` y `front`.
2. Renombrarlos a `.env`.
3. Ajustar los valores según tu entorno.

---

## 🚀 Instalación de dependencias

En la raíz del proyecto:

```bash
cd back && npm install
cd ../front && npm install
```

---

## 🧱 Migración inicial (seed)

Carga datos base (usuarios y espacios).

```bash
cd back
npm run seed
```

**Credenciales iniciales:**

- admin: `admin@cowork.com` / `Admin123!`
- cliente demo (opcional según seed)

---

## ▶️ Ejecución en desarrollo

Abrir **dos terminales**:

**Terminal 1 – Backend**

```bash
cd back
npm run dev
```

**Terminal 2 – Frontend**

```bash
cd front
npm run dev
```

**URLs**

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:4000](http://localhost:4000)

---

## 🧮 Funcionalidades principales

- Login y registro con JWT
- Roles: administrador / cliente
- CRUD de espacios (admin)
- Reservas con validación de disponibilidad
- Cancelación antes de la fecha
- Métricas y top espacios más reservados
- Log de errores (en `back/logs/`)
- Ruteo con mínimo 5 páginas en el frontend

---

## 🧰 Modo producción (básico)

**Backend**

```bash
cd back
npm run build
npm start
```

**Frontend**

```bash
cd front
npm run build
```

Luego servir el contenido de `front/dist` con un servidor estático o configurar un proxy.

---

## 👨‍💻 Autor

**Jonathan Calvo**  
Proyecto académico - Universidad 2025
