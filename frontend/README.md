# 🎓 EduFlow AI

**Plataforma inteligente de gestión educativa**

EduFlow AI es una plataforma web desarrollada para gestionar información académica de estudiantes, docentes, cursos, matrículas, calificaciones y asistencias.

El proyecto está diseñado con una arquitectura basada en **React + Laravel + PostgreSQL**, con una futura integración de **Python, FastAPI y Machine Learning** para funcionalidades de inteligencia artificial y predicción del riesgo académico.

---

## 🚀 Tecnologías

### Frontend

* React
* Vite
* JavaScript
* Axios
* React Router
* CSS

### Backend

* Laravel 13
* PHP 8.5
* Laravel Sanctum
* API REST

### Base de datos

* PostgreSQL 17

### Inteligencia artificial

* Python
* FastAPI
* Machine Learning

### Herramientas

* Git
* GitHub
* Visual Studio Code
* PowerShell

---

## 🏗️ Arquitectura

```text
┌──────────────────────┐
│      React + Vite    │
│       Frontend       │
└──────────┬───────────┘
           │
           │ HTTP / REST API
           ▼
┌──────────────────────┐
│       Laravel        │
│       Backend        │
└──────────┬───────────┘
           │
           │ Eloquent ORM
           ▼
┌──────────────────────┐
│      PostgreSQL      │
│       Database       │
└──────────────────────┘

           │
           │ Integración IA
           ▼
┌──────────────────────┐
│    FastAPI + Python  │
│   Machine Learning   │
└──────────────────────┘
```

---

# 📚 Funcionalidades

## 🔐 Autenticación

El sistema cuenta con autenticación mediante Laravel Sanctum.

Los usuarios pueden:

* Iniciar sesión.
* Cerrar sesión.
* Consultar su información.
* Mantener una sesión autenticada mediante token.
* Acceder a funcionalidades según su rol.

---

# 👨‍💼 Administrador

El administrador puede gestionar la información general de la plataforma.

### Gestión de usuarios

* Crear usuarios.
* Consultar usuarios.
* Gestionar estudiantes.
* Gestionar docentes.

### Gestión académica

* Crear cursos.
* Consultar cursos.
* Actualizar cursos.
* Eliminar cursos.
* Gestionar matrículas.
* Consultar calificaciones.
* Gestionar asistencias.

---

# 👨‍🏫 Docente

El docente puede trabajar con los cursos que tiene asignados.

### Funcionalidades

* Consultar sus cursos.
* Consultar estudiantes matriculados.
* Registrar calificaciones.
* Consultar calificaciones.
* Registrar asistencias.
* Consultar asistencias.
* Gestionar información académica de sus estudiantes.

El sistema aplica restricciones para evitar que un docente pueda modificar información perteneciente a cursos que no le corresponden.

---

# 👨‍🎓 Estudiante

El estudiante dispone de un panel personalizado donde puede consultar únicamente su información académica.

### Mi panel

El dashboard muestra:

* 📚 Cursos matriculados.
* 📝 Cantidad de calificaciones.
* 📅 Porcentaje de asistencia.
* ⭐ Promedio académico.

### Mis cursos

El estudiante puede consultar los cursos en los que está matriculado.

La información se obtiene mediante:

```text
GET /api/my/enrollments
```

### Mis calificaciones

El estudiante puede consultar únicamente sus propias calificaciones.

```text
GET /api/my/grades
```

### Mis asistencias

El estudiante puede consultar únicamente sus registros de asistencia.

```text
GET /api/my/attendances
```

---

# 🔒 Seguridad

El backend implementa control de acceso basado en roles.

Los principales roles son:

```text
admin
docente
estudiante
```

Las rutas y controladores verifican el usuario autenticado antes de permitir determinadas operaciones.

Por ejemplo:

* Un estudiante no puede modificar una matrícula.
* Un estudiante solo puede consultar sus propios registros.
* Un docente no puede modificar información de cursos que no le pertenecen.
* El administrador tiene acceso a la gestión general del sistema.

---

# 📡 API

Las principales rutas disponibles son:

## Autenticación

```text
POST /api/login
POST /api/logout
GET  /api/me
```

## Estudiantes

```text
GET    /api/students
POST   /api/students
GET    /api/students/{id}
PUT    /api/students/{id}
DELETE /api/students/{id}
```

## Docentes

```text
GET    /api/teachers
POST   /api/teachers
GET    /api/teachers/{id}
PUT    /api/teachers/{id}
DELETE /api/teachers/{id}
```

## Cursos

```text
GET    /api/courses
POST   /api/courses
GET    /api/courses/{id}
PUT    /api/courses/{id}
DELETE /api/courses/{id}
```

## Matrículas

```text
GET    /api/enrollments
POST   /api/enrollments
GET    /api/enrollments/{id}
PUT    /api/enrollments/{id}
DELETE /api/enrollments/{id}
```

Para el estudiante autenticado:

```text
GET /api/my/enrollments
```

## Calificaciones

```text
GET    /api/grades
POST   /api/grades
GET    /api/grades/{id}
PUT    /api/grades/{id}
DELETE /api/grades/{id}
```

Para el estudiante:

```text
GET /api/my/grades
GET /api/my/grades/summary
```

## Asistencias

```text
GET    /api/attendances
POST   /api/attendances
GET    /api/attendances/{id}
PUT    /api/attendances/{id}
DELETE /api/attendances/{id}
```

Para el estudiante:

```text
GET /api/my/attendances
```

---

# 📁 Estructura del proyecto

```text
eduflow-ai/
│
├── backend/
│   │
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │
│   │   └── Models/
│   │
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   │
│   ├── routes/
│   │   ├── api.php
│   │   └── web.php
│   │
│   ├── .env
│   ├── artisan
│   └── composer.json
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── docente/
│   │   │   └── estudiante/
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# ⚙️ Instalación

## 1. Clonar el proyecto

```bash
git clone <URL_DEL_REPOSITORIO>
cd eduflow-ai
```

---

# 🖥️ Configuración del Backend

Entrar a la carpeta:

```bash
cd backend
```

Instalar dependencias:

```bash
composer install
```

Copiar el archivo de configuración:

```bash
cp .env.example .env
```

En Windows PowerShell también puede utilizarse:

```powershell
Copy-Item .env.example .env
```

Generar la clave:

```bash
php artisan key:generate
```

---

# 🗄️ Configuración de PostgreSQL

Configurar el archivo `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=eduflow_ai
DB_USERNAME=postgres
DB_PASSWORD=TU_CONTRASEÑA
```

Después ejecutar:

```bash
php artisan migrate
```

Si existen seeders:

```bash
php artisan db:seed
```

---

# ▶️ Ejecutar Backend

Desde `backend`:

```bash
php artisan serve
```

La API estará disponible normalmente en:

```text
http://127.0.0.1:8000
```

---

# 🌐 Configuración del Frontend

Entrar a:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Ejecutar Vite:

```bash
npm run dev
```

El frontend estará disponible normalmente en:

```text
http://localhost:5173
```

---

# 🔌 Conexión con la API

El frontend utiliza Axios para comunicarse con Laravel.

Archivo:

```text
frontend/src/services/api.js
```

Configuración:

```javascript
const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});
```

El token de autenticación se utiliza para acceder a las rutas protegidas.

---

# 🤖 Inteligencia Artificial

Una de las funcionalidades principales proyectadas para EduFlow AI es la utilización de inteligencia artificial para analizar el rendimiento académico.

La arquitectura prevista es:

```text
React
   │
   ▼
Laravel API
   │
   ▼
FastAPI
   │
   ▼
Machine Learning
   │
   ▼
Predicción de riesgo académico
```

El modelo podrá utilizar información como:

* Calificaciones.
* Asistencia.
* Cursos matriculados.
* Historial académico.
* Otros indicadores educativos.

El objetivo es identificar estudiantes que podrían presentar riesgo académico y proporcionar información útil para la toma de decisiones.

---

# 📊 Módulos del sistema

| Módulo                  | Estado |
| ----------------------- | ------ |
| Autenticación           | ✅      |
| Usuarios                | ✅      |
| Estudiantes             | ✅      |
| Docentes                | ✅      |
| Cursos                  | ✅      |
| Matrículas              | ✅      |
| Calificaciones          | ✅      |
| Asistencias             | ✅      |
| Dashboard estudiante    | ✅      |
| Dashboard docente       | 🚧     |
| Dashboard administrador | 🚧     |
| Predicción de riesgo    | 🚧     |
| Asistente IA            | 🚧     |

---

# 🧪 Desarrollo

Para verificar las rutas disponibles del backend:

```bash
php artisan route:list
```

Para limpiar las cachés de Laravel:

```bash
php artisan optimize:clear
```

Para ejecutar nuevamente el frontend:

```bash
npm run dev
```

---

# 👥 Roles del sistema

| Rol           | Acceso                         |
| ------------- | ------------------------------ |
| Administrador | Gestión general                |
| Docente       | Cursos y estudiantes asignados |
| Estudiante    | Información académica propia   |

---

# 🎯 Objetivo

EduFlow AI busca centralizar la gestión académica y utilizar herramientas de inteligencia artificial para transformar los datos educativos en información útil para estudiantes, docentes y administradores.

El proyecto combina:

**Gestión educativa + APIs + bases de datos + análisis de datos + inteligencia artificial.**

---

# 👨‍💻 Proyecto

**EduFlow AI**

Plataforma inteligente de gestión educativa.

Desarrollado como proyecto académico utilizando tecnologías web modernas y arquitectura de servicios.
