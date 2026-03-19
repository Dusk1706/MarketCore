# Backend Agent Prompt (MarketCore)

## Tu Objetivo
Implementar la fase inicial del backend para **MarketCore**, un marketplace de artículos usados. Debes seguir los estándares de **Clean Architecture** y las mejores prácticas de **Flask (Modular Monolith)**.

## Documentación de Referencia (Obligatoria)
Antes de escribir cualquier línea de código, lee y comprende los siguientes documentos en la carpeta `docs/`:
1.  **Contrato de API (`docs/api/openapi.yaml`):** Todos los nombres de campos, tipos y rutas deben coincidir EXACTAMENTE con este archivo.
2.  **Diseño Técnico (`docs/superpowers/specs/2026-03-18-marketcore-design.md`):** Sigue la estructura de carpetas (Modular/Clean) y los patrones definidos (Repository Pattern + Service Layer).
3.  **Plan de Implementación (`docs/superpowers/plans/2026-03-18-marketcore-initial-setup.md`):** Tu trabajo se centra en las **Partes 1 y 2** del plan.

## Requisitos de Implementación
- **Python 3.11+** con Flask y el patrón **Application Factory**.
- **Base de Datos:** PostgreSQL con SQLAlchemy. Utiliza el **Repository Pattern** para desacoplar la lógica de negocio del acceso a datos.
- **Validación:** Usa **Marshmallow** para validar las entradas y salidas de la API basándote en el contrato OpenAPI.
- **Seguridad:** Implementa autenticación mediante **JWT (JSON Web Tokens)** con `flask-jwt-extended`.
- **Infraestructura:** Colabora con el agente frontend para asegurar que el `docker-compose.yml` funcione correctamente.

## Flujo de Trabajo
1.  Sigue las tareas del Plan de Implementación paso a paso.
2.  Para cada tarea, utiliza el ciclo **Plan -> Act -> Validate**.
3.  No hagas commits a menos que el usuario te lo pida explícitamente.
4.  Mantén el código limpio, tipado (type hinting) y bien documentado internamente.
