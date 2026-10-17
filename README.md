# RecetasApp — Documentación Técnica y Manual de Usuario

Aplicación móvil multiplataforma para la gestión y descubrimiento de recetas culinarias con soporte de grupos, desarrollada con **React Native (Expo)** en el frontend y una **API REST (Node.js + Express + MongoDB)** en el backend.

---

# Tabla de Contenidos

- [PARTE 1: ARQUITECTURA DEL SISTEMA, INGENIERÍA Y TECNOLOGÍAS](#parte-1-arquitectura-del-sistema-ingeniería-y-tecnologías)
  - [1. Visión General](#1-visión-general)
  - [2. Stack Tecnológico & Herramientas](#2-stack-tecnológico--herramientas)
  - [3. Arquitectura del Backend (Clean Layered Pattern)](#3-arquitectura-del-backend-clean-layered-pattern)
  - [4. Reglas de Negocio Implementadas](#4-reglas-de-negocio-implementadas)
  - [5. Arquitectura del Frontend (React Native & Expo)](#5-arquitectura-del-frontend-react-native--expo)
  - [6. Guía de Instalación y Ejecución Local](#6-guía-de-instalación-y-ejecución-local)
- [PARTE 2: MANUAL DE USUARIO / CÓMO MANEJAR EL FRONT](#parte-2-manual-de-usuario--cómo-manejar-el-front)
  - [1. Registro e Inicio de Sesión](#1-registro-e-inicio-de-sesión)
  - [2. Navegación Principal](#2-navegación-principal)
  - [3. Gestión de Recetas](#3-gestión-de-recetas)
  - [4. Gestión de Grupos / Carpetas](#4-gestión-de-grupos--carpetas)
  - [5. Búsqueda y Exploración](#5-búsqueda-y-exploración)
  - [6. Perfil de Usuario y Ajustes](#6-perfil-de-usuario-y-ajustes)

---

# PARTE 1: ARQUITECTURA DEL SISTEMA, INGENIERÍA Y TECNOLOGÍAS

## 1. Visión General

El sistema se compone de dos aplicaciones desacopladas comunicadas mediante HTTP/REST con formato JSON:
1. **Backend (`recetas-moviles-main`)**: Servidor API REST que implementa autenticación basada en tokens JWT, lógica de negocio con validaciones estrictas y persistencia sobre base de datos NoSQL MongoDB.
2. **Frontend (`RecetasApp`)**: Aplicación móvil compilada con Expo (SDK 57) y React Native, con interfaz moderna en modo oscuro, navegación declarativa por archivos y soporte responsivo para dispositivos Android, iOS y navegadores web.

```
┌─────────────────────────────────┐           HTTP / REST (JSON)          ┌──────────────────────────────────┐
│           RecetasApp            │  <─────────────────────────────────>  │        recetas-backend           │
│   (React Native + Expo SDK 57)  │         Authorization: Bearer         │     (Express + Node.js 18+)      │
└─────────────────────────────────┘                                       └─────────────────┬────────────────┘
                                                                                            │ Mongoose ODM
                                                                                            ▼
                                                                                  ┌────────────────────┐
                                                                                  │      MongoDB       │
                                                                                  │ (Local / Atlas DB) │
                                                                                  └────────────────────┘
```

---

## 2. Stack Tecnológico & Herramientas

### Backend
- **Entorno de Ejecución**: Node.js (`>=18`, compatible con Node 24).
- **Framework Web**: Express 4.21.2.
- **Base de Datos & ODM**: MongoDB Server con Mongoose 8.9.0.
- **Seguridad & Autenticación**:
  - `jsonwebtoken` (v9.0.2) para generación y verificación de tokens JWT.
  - `bcryptjs` (v2.4.3) para el cifrado unidireccional (*hash con salt*) de contraseñas de usuarios.
- **Utilidades & Configuración**:
  - `dotenv` para gestión de variables de entorno.
  - `cors` para políticas de intercambio de recursos entre orígenes.
  - `nodemon` para reinicio en caliente durante desarrollo.

### Frontend
- **Framework & Motor**: React Native 0.86.3 con React 19.2.3.
- **Plataforma**: Expo SDK 57.0.0.
- **Sistema de Enrutamiento**: Expo Router (`expo-router` ~57.0.28) basado en estructura de archivos.
- **Almacenamiento Local**: `@react-native-async-storage/async-storage` para persistir la sesión (token JWT y datos del usuario).
- **Componentes & UI**:
  - `expo-linear-gradient` para fondos y botones con degradados cálidos.
  - `@expo/vector-icons` (Ionicons) para iconografía vectorial escalable.
  - `react-native-safe-area-context` y `react-native-screens` para control de muescas (*notches*) y transiciones de pantalla nativas.
- **Conectividad**: `fetch` API con `AbortController` y timeouts integrados, con detección automática de la IP del host de desarrollo en redes locales.

### Herramientas de Desarrollo y Testing
- **MongoDB Compass**: Visualización e inspección gráfica de colecciones y documentos de la base de datos.
- **Postman**: Suite de pruebas con colección completa de endpoints organizada por fases.
- **Expo Go**: Cliente de prueba en tiempo real en dispositivos móviles Android e iOS.

---

## 3. Arquitectura del Backend (Clean Layered Pattern)

El backend implementa un patrón de arquitectura en capas desacopladas donde cada clase tiene una única responsabilidad:

```
[ Petición HTTP ]
       │
       ▼
 [ Middlewares ] ─── (authMiddleware, notFoundMiddleware, errorMiddleware)
       │
       ▼
 [ Controller ]  ─── Valida el input HTTP, deserializa req.body/params y delega
       │
       ▼
  [ Service ]    ─── Reglas de negocio puras, validación lógica, unicidad y seguridad
       │
       ▼
 [ Repository ]  ─── CRUD puro contra MongoDB. Es la ÚNICA capa que conoce Mongoose
       │
       ▼
   [ Model ]     ─── Esquemas de Mongoose con tipos y validaciones de campo
```

### Descripción de las Capas

1. **Modelos (`src/models/`)**:
   - `User.js`: Almacena `name`, `email` (único, normalizado en minúsculas), `password` cifrado con bcrypt, y método `toPublicJSON()` que excluye la contraseña de las respuestas.
   - `Recipe.js`: Define título, `titleNormalized` (para unicidad global y ordenamiento alfabético), descripción, ingredientes estructurados (`name`, `quantity`, `unit`), pasos ordenados, categoría, tiempo de preparación, porciones, bandera `isPublic`, autor referenciado (`User`), y grupos asociados (`[Group]`).
   - `Group.js`: Define el nombre, descripción y el propietario (`owner`).

2. **Repositorios (`src/repositories/`)**:
   - `UserRepository.js`, `RecipeRepository.js`, `GroupRepository.js`.
   - Aíslan completamente las consultas Mongoose (`find`, `create`, `updateById`, `deleteMany`, etc.). Si en el futuro se reemplaza el motor de base de datos, únicamente se reescribe esta capa sin tocar los servicios.

3. **Servicios (`src/services/`)**:
   - `UserService.js`: Registro con detección de email duplicado, login con verificación de contraseña segura, actualización de perfil y borrado en cascada de cuentas.
   - `RecipeService.js`: Creación y edición con chequeo de unicidad de título, validación de autoría, asociación de grupos y consultas ordenadas.
   - `GroupService.js`: Creación de grupos, cálculo de recetas en peligro antes de eliminar (`delete-preview`), y desasociación en cascada de recetas.

4. **Controladores (`src/controllers/`)**:
   - Reciben las peticiones Express (`req`), extraen parámetros y retornan respuestas con códigos de estado semánticos (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`).

5. **Middlewares (`src/middlewares/`)**:
   - `authMiddleware.js`: Valida el encabezado `Authorization: Bearer <token>`, decodifica el JWT e inyecta `req.userId`.
   - `errorMiddleware.js`: Centraliza el manejo de excepciones mediante la clase de error personalizada `AppError`.

---

## 4. Reglas de Negocio Implementadas

- **Unicidad global de títulos de recetas**: Los títulos no pueden repetirse a nivel global en toda la plataforma. La comparación es agnóstica a mayúsculas, minúsculas y tildes mediante la función utilitaria `normalizeText()` (ejemplo: *"Árroz con Pollo"* = *"arroz con pollo"* = *"ARROZ CON POLLO"*).
- **Ordenamiento alfabético con Collation en español**: Todas las listas de recetas (`GET /recipes` y `GET /recipes/mine`) se ordenan alfabéticamente considerando acentos y la letra Ñ.
- **Relación Receta-Grupos**:
  - La relación muchos a muchos vive dentro del arreglo `Recipe.groups`.
  - Solo el autor de una receta puede modificar sus grupos asignados, y solo puede añadirla a grupos que le pertenezcan a él.
- **Eliminación en Cascada Inteligente**:
  - **Borrado de una Receta**: Se elimina de la base de datos y deja de aparecer en los grupos a los que estaba vinculada.
  - **Borrado de un Grupo**: Las recetas que pertenecían **únicamente** a ese grupo son eliminadas de la base de datos. Aquellas recetas que también estén presentes en otros grupos se conservan intactas y solo se desvinculan del grupo eliminado.
  - **Borrado de una Cuenta de Usuario**: Elimina en cascada todas las recetas creadas por el usuario y todos sus grupos.

---

## 5. Arquitectura del Frontend (React Native & Expo)

### Estructura de Enrutamiento Declarativo (Expo Router)

```
RecetasApp/
├── app/
│   ├── _layout.js               # Layout raíz: provee AuthContext, temas y protección de rutas
│   ├── (auth)/                  # Grupo de pantallas de autenticación
│   │   ├── _layout.js
│   │   ├── login.js             # Inicio de sesión
│   │   └── register.js          # Registro de nuevos usuarios
│   ├── (tabs)/                  # Grupo con barra de navegación inferior (Bottom Tabs)
│   │   ├── _layout.js           # Configuración de iconos, colores y badges de la barra
│   │   ├── my-recipes.js        # Pestaña "Mis Recetas"
│   │   ├── groups.js            # Pestaña "Grupos"
│   │   ├── explore.js           # Pestaña "Explorar" (recetas públicas globales)
│   │   └── profile.js           # Pestaña "Perfil"
│   ├── recipe/
│   │   ├── create.js            # Formulario de creación de receta
│   │   ├── [id].js              # Vista detallada de una receta específica
│   │   └── edit/[id].js         # Formulario de edición de receta
│   └── group/
│       └── [id].js              # Vista de grupo: recetas contenidas y gestión de miembros
└── src/
    ├── api/                     # Clientes HTTP modularizados (client.js, auth.js, recipes.js, groups.js, users.js)
    ├── components/              # Componentes visuales reutilizables (Button, Input, RecipeCard, GroupCard, EmptyState, ScreenHeader)
    ├── context/                 # Estado global: AuthContext.js
    └── theme/                   # Tokens de diseño: colors.js, typography.js
```

### Gestión de Sesión y Contexto (`AuthContext`)
- Mantiene el estado en memoria de `user`, `token` y `loading`.
- Al iniciar la aplicación, lee de forma asíncrona de `AsyncStorage`. Si hay una sesión válida, redirige automáticamente a `(tabs)/my-recipes`; en caso contrario, a `(auth)/login`.
- Ofrece métodos `register()`, `login()`, `logout()` y `updateLocalUser()`.

### Cliente de Red Resiliente (`client.js`)
- Agrega automáticamente el encabezado `Authorization: Bearer <token>` si la petición requiere autenticación.
- Resuelve la dirección URL base (`BASE_URL`) adaptándose al entorno:
  - En navegador web: `http://localhost:3000/api`.
  - En dispositivos móviles físicos con Expo Go: utiliza la IP privada de la máquina de desarrollo (`http://192.168.10.19:3000/api`).
- Incluye control de tiempo de espera (`AbortController` con timeout de 8 segundos) para evitar bloqueos indefinidos por cortes de red.

---

## 6. Guía de Instalación y Ejecución Local

### Prerrequisitos
- **Node.js** (versión 18 o superior).
- **MongoDB** en ejecución local en el puerto `27017` o una cuenta de MongoDB Atlas.
- Dispositivo móvil con la app **Expo Go** instalada (Android o iOS) o emulador de Android Studio / navegador web en la PC.

### Paso 1: Configurar el Backend
1. Navega a la carpeta del backend y verifica el archivo `.env`:
   ```bash
   cd recetas-moviles-main
   ```
2. El archivo `.env` debe contener:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/recetas
   JWT_SECRET=tu_clave_secreta_jwt_super_segura
   JWT_EXPIRES_IN=7d
   ```
3. Instala dependencias y enciende el servidor:
   ```bash
   npm install
   npm run dev
   ```
   *(Verificarás en consola: `MongoDB conectado: recetas` y `Servidor escuchando en el puerto 3000`)*.

### Paso 2: Iniciar la App Móvil
En una **segunda terminal**:
```bash
cd RecetasApp
npx expo start
```
- **En celular**: Abre **Expo Go** y escanea el código QR que se dibuja en la consola.
- **En PC (Web)**: Presiona la tecla <kbd>w</kbd> para abrir la aplicación directamente en tu navegador en `http://localhost:8081`.

---

# PARTE 2: MANUAL DE USUARIO / CÓMO MANEJAR EL FRONT

Este manual describe el funcionamiento de cada pantalla, flujo y funcionalidad de la aplicación móvil **RecetasApp**.

---

## 1. Registro e Inicio de Sesión

### Pantalla de Bienvenida y Login
Al abrir la aplicación por primera vez o con la sesión cerrada, se presentará la pantalla de inicio de sesión:
1. **Iniciar Sesión**:
   - Ingresa tu correo electrónico registrado.
   - Ingresa tu contraseña (puedes tocar el ícono del ojo para ver u ocultar los caracteres).
   - Presiona el botón **"Iniciar sesión"**.
   - Si los datos son correctos, entrarás de inmediato a la pantalla principal. Si hay algún error en las credenciales, aparecerá un aviso explicativo.
2. **Crear una cuenta nueva**:
   - Si no tienes cuenta, toca el enlace inferior **"¿No tienes cuenta? Regístrate"**.

### Registro de Usuario
1. Completa los cuatro campos del formulario:
   - **Nombre**: Tu nombre o alias (mínimo 2 caracteres).
   - **Email**: Correo electrónico válido (ej: `usuario@correo.com`).
   - **Contraseña**: Mínimo 6 caracteres.
   - **Confirmar contraseña**: Debe coincidir exactamente con la contraseña anterior.
2. Presiona **"Crear cuenta"**.
3. El sistema creará tu perfil, iniciará sesión automáticamente y te dirigirá a tu recetario personal.

---

## 2. Navegación Principal

La aplicación cuenta con una barra de navegación inferior con cuatro pestañas:

| Pestaña | Ícono | Descripción |
| :--- | :---: | :--- |
| **Mis Recetas** | 📖 | Tu recetario personal. Muestra todas las recetas creadas por tu cuenta (tanto públicas como privadas). |
| **Grupos** | 📁 | Carpetas temáticas (ej: "Postres", "Cenas rápidas") para clasificar tus recetas. |
| **Explorar** | 🧭 | Descubre recetas públicas compartidas por toda la comunidad de usuarios. |
| **Perfil** | 👤 | Consulta tus datos, estadísticas personales, edita tu información o cierra sesión. |

---

## 3. Gestión de Recetas

### Cómo Crear una Receta
1. En la pestaña **"Mis Recetas"**, presiona el botón circular naranja con el símbolo **`+`** ubicado en la esquina superior derecha.
2. Se abrirá el formulario de creación:
   - **Título**: Escribe el nombre del platillo (debe ser único en el sistema).
   - **Descripción**: Breve reseña o información destacada del plato.
   - **Categoría**: Selecciona una categoría con un toque (*Desayuno, Almuerzo, Cena, Postre, Bebida, Snack, Sopa, Ensalada*).
   - **Tiempo de preparación**: Número en minutos (ej: `30`).
   - **Porciones**: Cantidad de porciones que rinde la preparación (ej: `4`).
   - **Ingredientes (Dinámicos)**:
     - Escribe el nombre del ingrediente (ej: `Harina de trigo`), cantidad (`200`) y unidad (`g` o `tazas`).
     - Presiona **"Añadir ingrediente"**. Se sumará a la lista visual inferior. Puedes presionar el ícono de basura roja junto a un ingrediente para eliminarlo.
   - **Pasos de preparación (Dinámicos)**:
     - Escribe la instrucción del paso (ej: `Precalentar el horno a 180°C`) y presiona **"Añadir paso"**.
     - Los pasos se enumerarán automáticamente en orden secuencial (Paso 1, Paso 2, etc.).
   - **Asignar a Grupos (Opcional)**:
     - Si ya tienes grupos creados, puedes marcar las casillas de los grupos donde deseas incluir esta receta desde el primer momento.
   - **Visibilidad Pública**:
     - Activa el interruptor **"Hacer pública esta receta"** si deseas que cualquier usuario de la aplicación pueda verla en la pestaña **Explorar**. Si lo dejas apagado, solo tú podrás verla.
3. Presiona el botón final **"Crear Receta"**.

---

### Ver el Detalle de una Receta
Al tocar cualquier tarjeta de receta en las listas, ingresarás a su vista detallada:
- **Resumen**: Observa tiempo estimado, porciones e indicador de receta pública o privada.
- **Checklist interactivo de ingredientes**:
  - Puedes tocar cada ingrediente mientras estás cocinando para marcarlo con un tilde verde y tacharlo, facilitando el control de lo que ya has añadido.
- **Guía paso a paso**: Lista clara y ordenada con cada una de las instrucciones de preparación.
- **Grupos a los que pertenece**: Etiquetas visuales con los grupos donde está clasificada.

---

### Editar una Receta
1. Abre una receta que tú hayas creado.
2. En la barra superior, presiona el botón **"Editar"** (ícono de lápiz).
3. Modifica cualquiera de sus datos (puedes cambiarla de privada a pública, agregar más ingredientes, quitar pasos o cambiar sus grupos).
4. Presiona **"Guardar Cambios"**.

---

### Eliminar una Receta
1. Abre la receta que deseas borrar.
2. Presiona el botón rojo **"Eliminar receta"** al final de la pantalla.
3. Confirma la acción en la ventana emergente. La receta desaparecerá permanentemente de tu cuenta y de todos los grupos donde estaba asignada.

---

## 4. Gestión de Grupos / Carpetas

Los grupos te permiten organizar tus recetas por ocasiones, tipos de menú o listas de preparación.

### Crear un Grupo
1. Ve a la pestaña **"Grupos"**.
2. Presiona el botón circular **`+`** en la esquina superior derecha.
3. En la ventana emergente que se desliza desde la parte inferior:
   - Ingresa el **Nombre del grupo** (ej: *"Navidad"*, *"Almuerzos Fitness"*).
   - Ingresa una **Descripción opcional**.
4. Presiona **"Crear"** (o *"Cancelar"* para descartar).

---

### Administrar Recetas Dentro de un Grupo
Toca sobre cualquier tarjeta de grupo para ver su interior:
1. **Añadir recetas al grupo**:
   - Toca el botón **"Añadir Recetas"**.
   - Se abrirá una lista con tus recetas que aún no están en este grupo.
   - Marca las recetas que desees incorporar y presiona **"Guardar"**.
2. **Quitar una receta del grupo (Desvincular)**:
   - Junto a cada receta dentro del grupo verás un botón para quitarla.
   - Al tocarlo, el sistema te preguntará si deseas quitarla del grupo.
   - **Nota importante**: Esta acción **solo retira la receta del grupo**. Tu receta NO se borrará de tu cuenta y continuará intacta en *"Mis Recetas"*.

---

### Eliminar un Grupo y Advertencia de Cascada
1. Dentro de la pantalla del grupo, presiona el botón **"Borrar Grupo"**.
2. **Aviso de eliminación inteligente**:
   - Si el grupo contiene recetas que **solo existen en este grupo**, el sistema te informará cuántas recetas se eliminarán de forma permanente.
   - Si contiene recetas que también están en otros grupos, te confirmará cuántas se conservarán sanas y salvas.
3. Si estás de acuerdo, confirma para proceder.

---

## 5. Búsqueda y Exploración

Tanto en la pestaña **"Mis Recetas"** como en **"Explorar"**, dispones de herramientas de localización rápida:

1. **Buscador en tiempo real**:
   - Escribe en la barra de texto superior. La lista se filtrará al instante buscando coincidencias en el título de la receta, en su categoría o en su descripción.
2. **Recargar datos (Pull to Refresh)**:
   - Si creaste una receta desde otro dispositivo o deseas actualizar la lista con las últimas recetas públicas publicadas por otros usuarios, simplemente **desliza la pantalla hacia abajo con el dedo** y suéltala para refrescar.

---

## 6. Perfil de Usuario y Ajustes

En la cuarta pestaña (**"Perfil"**), encontrarás:
- Tu tarjeta de usuario con tu nombre, correo y fecha de ingreso.
- Contador de recetas creadas y grupos administrados.
- **Editar Perfil**: Te permite cambiar tu nombre mostrado o actualizar tu correo electrónico.
- **Cambiar Contraseña**: Permite actualizar tu clave de acceso ingresando una nueva clave de al menos 6 caracteres.
- **Cerrar Sesión**: Elimina de forma segura el token JWT de tu dispositivo y te devuelve a la pantalla de bienvenida.
- **Zona de Peligro (Eliminar Cuenta)**:
  - Opción para dar de baja tu usuario de forma definitiva.
  - Al ejecutar esta acción, el sistema borrará en cascada tu perfil, todas tus recetas y todos tus grupos de la base de datos.
