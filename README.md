# Sistema Municipal de Transparencia

Aplicación full-stack para gestionar solicitudes de información y transparencia activa dentro de un marco municipal. El proyecto combina un backend en Node.js + Express para la lógica de negocio y seguridad, y un frontend en React + Vite para la experiencia de usuario.

## Índice

- [Descripción general](#descripción-general)
- [Características principales](#características-principales)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Configuración del entorno](#configuración-del-entorno)
- [Instalación](#instalación)
- [Base de datos](#base-de-datos)
- [Ejecución en desarrollo](#ejecución-en-desarrollo)
- [Compilación para producción](#compilación-para-producción)
- [Roles y permisos](#roles-y-permisos)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Endpoints principales](#endpoints-principales)
- [Notas importantes](#notas-importantes)
- [Flujo de trabajo recomendado](#flujo-de-trabajo-recomendado)
- [Créditos](#créditos)

## Descripción general

Este sistema está orientado a apoyar la gestión interna de:

- Solicitudes de información y atención (módulo SIA)
- Transparencia activa y cargas documentales
- Tareas, comentarios, documentos y auditorías
- Dashboard ejecutivo para monitoreo de indicadores
- Notificaciones automáticas por vencimiento y estado
- Control de acceso por roles y permisos

La plataforma está diseñada para entornos municipales o institucionales donde existen varios perfiles con responsabilidades distintas, como administración, enlace municipal, dirección de área y funcionarios operativos.

## Características principales

### Módulo SIA
- Registro de solicitudes con folio único
- Asignación a departamentos y responsables
- Control de estados de trámite
- Tareas y subtareas asociadas
- Comentarios internos
- Documentos y archivos adjuntos
- Historial de auditoría
- Prórrogas y seguimiento de vencimientos

### Módulo de Transparencia Activa
- Catálogo de ítems de transparencia
- Cargas mensuales por periodo
- Carga y validación de archivos
- Aprobación, rechazo y publicación
- Gestión por responsable y validador
- Periodicidad configurable por ítem

### Dashboard y monitoreo
- Resumen de solicitudes por estado
- Resumen de transparencia por estado
- Indicadores por departamento
- Tasa de cumplimiento
- Tiempo promedio de respuesta

### Seguridad y autenticación
- Login mediante JWT
- Middleware de autenticación
- Control de permisos por rol
- Acceso restringido a rutas según perfil

### Notificaciones
- Alertas automáticas por solicitudes vencidas o próximas a vencer
- Recordatorios para transparencia activa
- Marcado de notificaciones como leídas
- Conteo de no leídas

## Arquitectura del proyecto

El proyecto está organizado en dos partes principales:

- Backend: API REST con Express y PostgreSQL
- Frontend: aplicación web con React, Vite y React Router

### Diagrama general

```text
Frontend (React + Vite)
        |
        v
API REST (Node.js + Express)
        |
        v
PostgreSQL
        |
        +--> archivos/subidas (uploads / documentos / transparencia)
```

## Tecnologías

### Backend
- Node.js
- TypeScript
- Express
- PostgreSQL + pg
- JWT para autenticación
- bcrypt para hashes
- Multer para carga de archivos
- node-cron para automatizaciones
- dotenv para variables de entorno

### Frontend
- React 19
- Vite
- TypeScript
- React Router DOM
- Axios-like fetch wrapper dentro de la capa API del frontend

## Requisitos previos

Asegúrate de tener instalado:

- Node.js 18 o superior
- npm o pnpm
- PostgreSQL 14+ o compatible
- Git
- Un cliente para PostgreSQL, como psql o pgAdmin

## Configuración del entorno

### Backend
El proyecto backend usa variables de entorno a partir del archivo `.env` dentro de la carpeta `backend`.

Ejemplo base:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transparencia_municipal
DB_USER=postgres
DB_PASSWORD=admin
JWT_SECRET=transparencia_municipal_secret
RUN_AUTOMATIONS_ON_START=false
```

También existe un archivo `.env.example` con una plantilla mínima en `backend/.env.example`.

### Frontend
El frontend requiere la URL base de la API:

```env
VITE_API_URL=http://localhost:3000/api
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd transparencia-municipal
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

## Base de datos

La base de datos se encuentra en la carpeta `database` con scripts SQL:

- `schema.sql`: estructura principal del sistema
- `seed.sql`: datos base de roles, departamentos y estados
- `001_auditoria_inmutable.sql`
- `002_tareas_subtareas.sql`
- `003_prorrogas.sql`
- `004_comentarios_sia.sql`
- `005_documentos_sia.sql`
- `006_transparencia_activa.sql`
- `007_folio_sia_sequence.sql`
- `008_actualizar_tipos_notificacion.sql`
- `009_actualizar_tipo_tarea_notificacion.sql`

### Crear la base de datos

Ejemplo de creación con PostgreSQL:

```sql
CREATE DATABASE transparencia_municipal;
```

Luego ejecuta los scripts en orden recomendado:

```bash
psql -U postgres -d transparencia_municipal -f database/schema.sql
psql -U postgres -d transparencia_municipal -f database/seed.sql
```

> Si usas la versión con migraciones, revisa los archivos numerados en la carpeta `database` y ejecútalos según el orden indicado por el proyecto.

## Ejecución en desarrollo

### Backend

Desde `backend`:

```bash
npm run dev
```

Esto arrancará la API en modo watch con `tsx` y estará disponible normalmente en:

```text
http://localhost:3000
```

### Frontend

Desde `frontend`:

```bash
npm run dev
```

La app se sirve usualmente en:

```text
http://localhost:5173
```

## Compilación para producción

### Backend

```bash
cd backend
npm run build
npm run start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## Roles y permisos

El sistema está pensado para perfiles jerárquicos con permisos específicos:

- `ADMINISTRADOR_MUNICIPAL`
  - Acceso global
  - Administrar usuarios
  - Supervisión completa de SIA y Transparencia Activa

- `ENLACE_MUNICIPAL`
  - Supervisión operativa
  - Asignación y seguimiento de solicitudes
  - Validación de trámites y cargas

- `DIRECTOR_AREA`
  - Seguimiento de solicitudes y tareas por departamento
  - Validación de documentos y cargas

- `FUNCIONARIO_OPERATIVO`
  - Gestión diaria de tareas, documentos y cargas

Los permisos se validan con middleware de autenticación y autorización en el backend.

## Estructura de carpetas

```text
transparencia-municipal/
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.*
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── *.sql
├── docs/
├── README.md
└── ...
```

## Endpoints principales

### Autenticación
- `POST /api/auth/login`
- `GET /api/auth/me`

### Usuarios
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`
- `PATCH /api/users/:id/deactivate`
- `PATCH /api/users/:id/activate`

### SIA
- `GET /api/sia`
- `POST /api/sia`
- `GET /api/sia/:id`
- `PATCH /api/sia/:id/assign`
- `PATCH /api/sia/:id/status`
- `POST /api/sia/:id/extensions`
- `GET /api/sia/:id/history`

### Tareas, comentarios y documentos
- `POST /api/sia/:id/tasks`
- `GET /api/sia/:id/tasks`
- `POST /api/sia/:id/comments`
- `GET /api/sia/:id/comments`
- `POST /api/sia/:id/documents`
- `GET /api/sia/:id/documents`

### Transparencia Activa
- `GET /api/transparency/items`
- `POST /api/transparency/items`
- `GET /api/transparency/loads`
- `POST /api/transparency/loads`
- `POST /api/transparency/loads/:id/file`
- `GET /api/transparency/loads/:id/file`
- `PATCH /api/transparency/loads/:id/validate`
- `PATCH /api/transparency/loads/:id/publish`

### Dashboard
- `GET /api/dashboard/summary`

### Notificaciones
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

## Notas importantes

### Archivos y uploads
El backend permite subir archivos para solicitudes SIA y cargas de transparencia. Asegúrate de que la carpeta de almacenamiento tenga permisos de escritura.

### Automatizaciones
En `backend/src/server.ts` se activa el job de notificaciones y, si `RUN_AUTOMATIONS_ON_START=true`, se ejecutan automatizaciones al arrancar. Esto es útil para pruebas y entornos de desarrollo.

### Seguridad
- La autenticación depende de JWT_SECRET.
- Revisa que nunca se suban credenciales reales al repositorio.
- Usa un entorno de prueba antes de llegar a producción.

## Flujo de trabajo recomendado

1. Crear la base de datos PostgreSQL.
2. Ejecutar `schema.sql` y `seed.sql`.
3. Configurar `.env` del backend y `.env` del frontend.
4. Instalar dependencias.
5. Iniciar backend y frontend en modo desarrollo.
6. Ingresar con un usuario configurado o crear uno desde la interfaz/SQL.
7. Realizar pruebas del flujo SIA y Transparencia Activa.
8. Verificar notificaciones y dashboard.

## Créditos

Proyecto desarrollado para gestión municipal de solicitudes y transparencia activa. La estructura y la lógica de negocio están pensadas para un entorno institucional con roles y procesos de validación.

---
