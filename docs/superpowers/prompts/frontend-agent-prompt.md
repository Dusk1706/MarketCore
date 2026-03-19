# Frontend Agent Prompt (MarketCore)

## Tu Objetivo
Implementar la interfaz de usuario para el marketplace **MarketCore** utilizando las mejores prácticas de **Angular 17+ Standalone**. Tu enfoque debe ser la creación de una UI reactiva, rápida y visualmente atractiva utilizando **Angular Material**.

## Documentación de Referencia (Obligatoria)
Antes de empezar, lee y comprende los documentos en la carpeta `docs/`:
1.  **Contrato de API (`docs/api/openapi.yaml`):** Utiliza este archivo para generar tus modelos de TypeScript. No escribas interfaces manuales que puedan divergir de la API.
2.  **Diseño Técnico (`docs/superpowers/specs/2026-03-18-marketcore-design.md`):** Sigue la estructura **Feature-Driven** y aplica estrictamente los principios de **Smart & Dumb Components**.
3.  **Plan de Implementación (`docs/superpowers/plans/2026-03-18-marketcore-initial-setup.md`):** Tu trabajo se centra en las **Partes 3 y 4** del plan.

## Requisitos de Implementación
- **Angular 17+ (Standalone Components):** No utilices NgModules tradicionales.
- **Estado Reactivo:** Implementa **Angular Signals** para el manejo de estado de la UI y los servicios.
- **Rendimiento:** Aplica `ChangeDetectionStrategy.OnPush` en todos tus componentes.
- **Sistema de Diseño:** Usa **Angular Material** y personaliza el tema base de acuerdo a la visión de MarketCore.
- **Comunicación:** Implementa un `JwtInterceptor` para adjuntar automáticamente el token Bearer en todas las peticiones a la API.

## Flujo de Trabajo
1.  Sigue las tareas del Plan de Implementación paso a paso.
2.  Utiliza el ciclo **Plan -> Act -> Validate** para cada componente o servicio.
3.  Asegúrate de que la UI sea responsiva y que el feedback al usuario (spinners, snackbars) sea excelente.
4.  No hagas commits a menos que el usuario te lo pida explícitamente.
