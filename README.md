# MarketCore

Bienvenido a **MarketCore**. Este documento proporciona las instrucciones necesarias para configurar, ejecutar y desarrollar el proyecto de manera local.

## 📋 Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu sistema antes de comenzar:

- [Docker](https://www.docker.com/products/docker-desktop/) y [Docker Compose](https://docs.docker.com/compose/install/) (Recomendado para la ejecución más sencilla).
- [Node.js](https://nodejs.org/) y npm (para desarrollo local del frontend en Angular).
- [Python 3.x](https://www.python.org/) (para desarrollo local del backend en Flask).

---

## 🚀 Ejecución Rápida (con Docker Compose)

La forma más rápida y recomendada de levantar todo el ecosistema del proyecto (Base de Datos, Backend y Frontend) es utilizando Docker Compose.

1. Abre una terminal en el directorio raíz del proyecto.
2. Ejecuta el siguiente comando para construir y levantar los contenedores:

   ```bash
   docker-compose up --build
   ```
   *(Agrega la bandera `-d` al final si deseas ejecutar los contenedores en segundo plano)*

3. **Acceso a los servicios:**
   - **Frontend (Web):** [http://localhost](http://localhost)
   - **Backend (API):** [http://localhost:5000](http://localhost:5000)
   - **Base de Datos (PostgreSQL):** Disponible en `localhost:5432` con usuario `marketcore` y contraseña `marketcore_pass`.

Para detener los contenedores, presiona `Ctrl + C` en la terminal o ejecuta:
```bash
docker-compose down
```

---

## 🛠 Desarrollo Local (Sin Docker)

Si prefieres ejecutar los servicios directamente en tu máquina para propósitos de desarrollo, sigue estos pasos:

### 1. Backend (API en Python/Flask)

1. Navega a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Crea y activa un entorno virtual:
   ```bash
   # En Windows:
   python -m venv venv
   .\venv\Scripts\activate
   
   # En macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Aplica las migraciones de la base de datos (asegúrate de tener una instancia de Postgres corriendo):
   ```bash
   alembic upgrade head
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   flask --app app run --debug
   ```

### 2. Frontend (Angular)

1. Navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo de Angular:
   ```bash
   npm start
   ```
   *La aplicación estará disponible en [http://localhost:4200](http://localhost:4200).*

---

## 📂 Estructura del Proyecto

- `/backend`: Contiene el código fuente de la API (Python, Flask, SQLAlchemy, Alembic).
- `/frontend`: Contiene la aplicación web desarrollada con Angular y SCSS.
- `docker-compose.yml`: Archivo de configuración para orquestar los servicios con Docker.
