# MarketCore: Documento de Diseño Técnico

**Fecha:** 2026-03-18  
**Estado:** Propuesta Final  
**Objetivo:** Establecer la arquitectura base para el desarrollo paralelo de Frontend (Angular) y Backend (Flask).

---

## 1. El Puente: Estrategia API-First
Se ha definido una especificación **OpenAPI 3.0** en `docs/api/openapi.yaml`. Este documento es la "Verdad Única".

- **Backend:** Debe implementar validación estricta basada en este esquema (usando Marshmallow).
- **Frontend:** Debe utilizar un generador de clientes de API para asegurar que los modelos de datos de TypeScript coincidan exactamente con la respuesta del servidor.

---

## 2. Frontend: Arquitectura Angular 17+ (Mejores Prácticas)

### Estructura de Carpetas (Feature-Driven)
```text
src/app/
├── core/               # Singleton services, AuthGuard, Interceptors
├── shared/             # Reusable UI components (Dumb), Pipes, Directives
│   └── components/     # Botones, Cards, Inputs personalizados
├── features/           # Módulos de negocio independientes
│   ├── auth/           # Login/Register
│   ├── catalog/        # Browsing & Search
│   └── seller/         # Dashboard del vendedor
│       ├── pages/      # Smart Components (Rutas)
│       ├── containers/ # Lógica de conexión (Smart)
│       └── ui/         # Presentación pura (Dumb)
└── assets/             # Imágenes, Iconos, Estilos globales
```

### Principios de Implementación
1. **Smart & Dumb Components:**
   - Los componentes en `ui/` NO inyectan servicios. Solo reciben `@Input` y emiten `@Output`.
   - Los componentes en `pages/` y `containers/` gestionan la suscripción a datos y eventos de servicios.
2. **Estado Reactivo:** Uso de **Angular Signals** para el manejo de estado reactivo y eficiente.
3. **Change Detection:** Uso obligatorio de `ChangeDetectionStrategy.OnPush` para optimizar el rendimiento.
4. **Angular Material:** Sistema de diseño base para todos los componentes de la UI.

---

## 3. Backend: Arquitectura Flask (Modular Clean Architecture)

### Estructura de Carpetas
```text
backend/
├── app/
│   ├── api/v1/         # Blueprints (Rutas y Controladores)
│   ├── core/           # Dominio: Entidades y lógica pura
│   ├── services/       # Casos de Uso (Business Logic)
│   ├── repositories/   # Persistencia (SQLAlchemy, Queries)
│   ├── schemas/        # Validación Marshmallow (OpenAPI Match)
│   └── models/         # Modelos de base de datos ORM
├── migrations/         # Flask-Migrate (Alembic)
└── tests/              # Pytest
```

### Principios de Implementación
1. **Repository Pattern:** Desacopla la lógica de negocio del acceso a datos. Los servicios llaman a repositorios, no a la base de datos directamente.
2. **Service Layer:** La validación de negocio (ej. "Un usuario solo edita sus propios productos") reside aquí.
3. **App Factory:** Uso estricto de `create_app()` para facilitar el testing y escalabilidad.

---

## 4. Guía para Agentes Autónomos

### Flujo de Trabajo del Agente Backend
1. Leer `docs/api/openapi.yaml`.
2. Crear modelos de datos en `models/`.
3. Implementar el esquema Marshmallow en `schemas/`.
4. Crear la lógica en `services/` y el repositorio en `repositories/`.
5. Exponer el endpoint en `api/v1/`.

### Flujo de Trabajo del Agente Frontend
1. Generar modelos e interfaces de TS desde `docs/api/openapi.yaml`.
2. Crear componentes "Dumb" en `shared/` o `features/X/ui/`.
3. Crear el servicio de Angular para la característica.
4. Conectar todo en el componente "Smart" (`pages/` o `containers/`).

---

## 5. Decisiones Tecnológicas Clave
- **Autenticación:** JWT (Bearer Token). El frontend almacena el token de forma segura.
- **Base de Datos:** PostgreSQL (Relacional) para asegurar integridad.
- **Contenedores:** Docker Compose con 3 servicios: `web` (Angular), `api` (Flask), `db` (Postgres).
