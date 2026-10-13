# Recetas

App de recetas con grupos. Backend en Node + Express + MongoDB (Atlas), front en React Native (Expo) con TypeScript.

## Estructura

```
recetas/
├── backend/   API REST (Node, Express, Mongoose)
│   └── src/
│       ├── config/        Conexión a MongoDB
│       ├── models/        Esquemas Mongoose (User, Recipe, Group)
│       ├── repositories/  Acceso a datos (único lugar que importa Mongoose)
│       ├── services/      Reglas de negocio (título único, permisos, etc.)
│       ├── controllers/   Reciben la petición HTTP y llaman al service
│       ├── routes/        Definición de endpoints
│       ├── middlewares/   Auth (obligatoria/opcional) y manejo de errores
│       └── utils/         AppError, TokenService, normalizeText
├── front/     App React Native (se crea en la Fase 4)
└── postman/   Colección y entorno de Postman
```

## Arquitectura del backend

Cada entidad se organiza en capas, todas como clases:

```
Controller → Service → Repository → Model (Mongoose)
```

- **Repository**: CRUD puro contra MongoDB. Es el único lugar que conoce Mongoose.
- **Service**: reglas de negocio (ej. título de receta único, permisos de autor).
- **Controller**: traduce HTTP ↔ Service. No contiene lógica de negocio.

Así, si un día cambia el motor de base de datos, solo se reescribe la capa Repository.

## Backend: puesta en marcha

1. Crear un cluster en MongoDB Atlas, un usuario de base de datos y permitir tu IP en Network Access.
2. Copiar `backend/.env.example` a `backend/.env` y completar `MONGO_URI` y `JWT_SECRET`.
3. Instalar y arrancar:

```bash
cd backend
npm install
npm run dev
```

4. Probar `GET http://localhost:3000/api/health` y luego importar la colección de `postman/`.

Generar un `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Rutas implementadas

### Auth
- `POST /api/auth/register` — name, email, password
- `POST /api/auth/login` — email, password

### Users (requieren `Authorization: Bearer <token>`)
- `GET /api/users/me`
- `PUT /api/users/me` — name, email, password (parcial)
- `DELETE /api/users/me` — borra la cuenta y, en cascada, todas sus recetas

### Recipes
- `POST /api/recipes` — requiere token. title, description, ingredients[], steps[], prepTime, servings, category, image, isPublic
- `GET /api/recipes/mine` — requiere token. Todas las recetas del usuario (públicas y privadas), ordenadas alfabéticamente
- `GET /api/recipes` — pública, sin token. Solo recetas con `isPublic: true`, ordenadas alfabéticamente
- `GET /api/recipes/:id` — token opcional. Si la receta es privada, solo la ve su autor
- `PUT /api/recipes/:id` — requiere token y ser el autor
- `DELETE /api/recipes/:id` — requiere token y ser el autor

## Reglas de trabajo

- Cada fase del backend se cierra probando todas sus rutas en Postman (caso feliz y al menos un error).
- Cada fase del front se cierra con `npx tsc --noEmit` y compilando el proyecto sin errores.
- Despliegue del backend en Railway (usa `process.env.PORT`).

## Reglas de negocio

- Título de receta único a nivel **global** (sin distinguir mayúsculas ni tildes): "Arepas" = "árepas" = "AREPAS".
- Recetas ordenadas alfabéticamente (collation en español, respeta tildes y Ñ).
- Vistas: "Mis recetas" (`GET /recipes/mine`, personales) y "Recetas generales" (`GET /recipes`, públicas).
- Borrar una receta: se borra y desaparece de todos sus grupos (la relación vive en `Recipe.groups`, así que no hace falta tocar los grupos).
- Borrar un grupo (Fase 3): se borran las recetas que **solo** están en ese grupo; las que están también en otros grupos se conservan y solo salen de este.
- Borrar la cuenta de un usuario: se borran en cascada todas sus recetas (y en la Fase 3, sus grupos).
