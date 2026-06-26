# Objetos Perdidos

Sistema web para publicar y buscar objetos perdidos/encontrados. Cualquier persona puede buscar y ver publicaciones sin necesidad de cuenta; se requiere una cuenta para publicar, editar o comentar.

## Stack

- Node.js + Express + EJS
- PostgreSQL (vía Docker)
- Tailwind CSS
- Multer (subida de fotos)
- Docker Compose (app + db + adminer)

## Requisitos

- Docker y Docker Compose instalados

## Configuración local / en el servidor

1. Clona el repositorio:
   ```bash
   git clone https://github.com/TevisEv/PROYECTO-OBJETOS-PERDIDOS.git
   cd PROYECTO-OBJETOS-PERDIDOS
   ```

2. Crea el archivo `.env` a partir del ejemplo y cambia las claves:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` y define valores reales y seguros para:
   - `POSTGRES_PASSWORD`
   - `SESSION_SECRET`
   - `DATABASE_URL` (debe usar el mismo usuario/clave/db que definiste arriba)

3. Levanta los contenedores:
   ```bash
   docker compose up -d --build
   ```

4. La app queda disponible en `http://<tu-servidor>:3000` y Adminer (gestor visual de la base de datos) en `http://<tu-servidor>:8080`.

## Despliegue en EC2 (resumen)

1. Instala Docker y Docker Compose en la instancia EC2.
2. Abre los puertos necesarios en el Security Group (3000 para la app; 8080 para Adminer si lo necesitas, o cierra ese acceso si no).
3. Clona el repo y crea el `.env` como se indica arriba (este archivo **no** se sube a git, debe crearse manualmente en cada entorno).
4. Ejecuta `docker compose up -d --build`.
5. Las imágenes subidas y los datos de Postgres persisten en volúmenes Docker (`uploads_data`, `pgdata`), por lo que sobreviven a reinicios y actualizaciones del contenedor.

## Estructura del proyecto

```
.
├── docker-compose.yml
├── db/init.sql           # esquema inicial + categorías (solo corre la primera vez)
└── app/
    ├── Dockerfile
    ├── src/
    │   ├── app.js
    │   ├── config/db.js
    │   ├── controllers/
    │   ├── middleware/
    │   ├── routes/
    │   ├── views/
    │   └── public/
    └── uploads/           # fotos subidas (montado como volumen)
```

## Funcionalidades

- Registro / inicio de sesión con sesiones persistidas en Postgres
- Publicar objetos perdidos o encontrados con hasta 4 fotos
- Búsqueda pública y filtros (categoría, tipo, estado, ubicación, palabra clave) sin necesidad de cuenta
- Edición y eliminación de publicaciones propias
- Marcar publicación como recuperada
- Comentarios/pistas en cada publicación (requiere cuenta para comentar, visible para todos)
