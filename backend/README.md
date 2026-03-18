# MarketCore Backend - API REST

Este es el núcleo de **MarketCore**, un marketplace de artículos usados construido con **Flask** siguiendo los principios de **Clean Architecture**.

## 🚀 Tecnologías
- **Python 3.11+**
- **Flask** (Application Factory Pattern)
- **PostgreSQL** (Producción) / **SQLite** (Testing)
- **SQLAlchemy** (ORM & Repository Pattern)
- **JWT** (Autenticación segura)
- **Marshmallow** (Validación de esquemas)
- **Pytest** (Pruebas unitarias e integración)

## 🛠️ Configuración Local

1.  **Crear entorno virtual:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # En Windows: .\venv\Scripts\activate
    ```

2.  **Instalar dependencias:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Variables de Entorno:**
    Crea un archivo `.env` basado en `.env.example`.

4.  **Base de Datos:**
    ```bash
    flask db upgrade
    python seed.py  # Poblar con datos de prueba
    ```

5.  **Ejecutar Servidor:**
    ```bash
    flask run
    ```

## 🧪 Testing
Para ejecutar las pruebas:
```bash
pytest
```

## 📡 Endpoints Principales (v1)

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Obtener token JWT

### Catálogo
- `GET /api/v1/categories` - Listar categorías
- `GET /api/v1/products` - Listar productos (soporta filtros `search`, `category_slug`, `min_price`, `max_price`)
- `GET /api/v1/products/<id>` - Detalle de producto
- `POST /api/v1/products` - Crear producto (Requiere JWT)
- `PUT /api/v1/products/<id>` - Editar producto (Sólo dueño + JWT)
- `DELETE /api/v1/products/<id>` - Eliminar producto (Sólo dueño + JWT)

## 🐳 Docker
El proyecto está listo para `docker-compose`. 
```bash
docker-compose up --build
```
