
---

# 📑 Especificaciones Técnicas: MarketCore Marketplace

## 1. Visión General del Proyecto
**MarketCore** es una plataforma de anuncios clasificados para la compra y venta de artículos usados. El objetivo principal es demostrar solidez en la gestión de catálogos dinámicos, motores de búsqueda eficientes y una arquitectura escalable de extremo a extremo (End-to-End).

---

## 2. Definición del Stack Tecnológico
Para garantizar el cumplimiento de los requisitos técnicos, se utilizará el siguiente ecosistema:

*   **Core Backend:** Python 3.11 con **Flask** (App Factory Pattern).
*   **Persistencia de Datos:** **PostgreSQL** (Motor relacional para asegurar integridad).
*   **Capa de Mapeo (ORM):** **SQLAlchemy** con patrones de repositorio.
*   **Frontend SPA:** **Angular (Versión Standalone)** para una gestión de estado reactiva.
*   **Sistema de Diseño:** **Angular Material** (Basado en los lineamientos de Material Design).
*   **Contenerización:** **Docker & Docker Compose** (Aislamiento de servicios).
*   **Seguridad:** Autenticación vía **JWT (JSON Web Tokens)** y encripción de datos sensibles.

---

## 3. Requisitos Funcionales (Core Business)

### A. Gestión de Catálogo y Búsqueda (Foco del Ejercicio)
1.  **Explorador Público:** Vista principal con una cuadrícula (grid) de artículos disponibles.
2.  **Motor de Búsqueda:** Búsqueda por texto (nombre/descripción) que coincida parcialmente.
3.  **Filtros Avanzados:** Filtrado por categorías (Tecnología, Hogar, Ropa, etc.) y rangos de precio (Mín-Máx).
4.  **Ficha de Producto:** Detalle completo que incluye descripción, estado del artículo, precio y datos de contacto del vendedor.

### B. Gestión de Usuarios y Sesiones
1.  **Registro y Acceso:** Flujo de registro seguro e inicio de sesión.
2.  **Dashboard del Vendedor:** Área privada donde el usuario visualiza únicamente sus artículos publicados.

### C. Operaciones CRUD (Ciclo de Vida del Producto)
1.  **Publicación:** Formulario con validación para dar de alta nuevos artículos.
2.  **Edición:** Capacidad de actualizar datos o dar de baja (marcar como vendido/eliminar) los anuncios existentes.

---

## 4. Atributos de Calidad (Requisitos No Funcionales)

### Arquitectura de Software
*   **Clean Architecture:** Separación clara entre Rutas (Entrada), Servicios (Lógica) y Repositorios (Datos).
*   **RESTful Compliance:** Uso correcto de verbos HTTP (`GET`, `POST`, `PUT`, `DELETE`) y códigos de estado (`200`, `201`, `400`, `401`, `404`, `500`).

### Interfaz y Experiencia (UI/UX)
*   **Diseño Responsivo:** Adaptabilidad total a móviles, tablets y escritorio mediante Angular Material.
*   **Optimización de Búsqueda:** Implementación de *Debounce* en la barra de búsqueda para optimizar el consumo de la API.
*   **Feedback al Usuario:** Uso de componentes visuales (Spinners/Snackbars) para estados de carga y notificaciones.

### Seguridad
*   **Middleware de Protección:** Rutas privadas protegidas tanto en el backend como en los Guards de Angular.
*   **Capa de Validación:** Doble validación de esquemas (Backend con Marshmallow y Frontend con Reactive Forms).

---

## 5. Modelado Lógico de Datos (Estructura de la Base)

Se proponen las siguientes entidades principales para **MarketCore**:

*   **Users:** Identidad del vendedor (Credenciales y Perfil).
*   **Products:** Datos centrales del anuncio (Título, Precio, Categoría, Fecha de publicación).
*   **Categories:** Diccionario maestro para la clasificación de productos.

---

## 6. Plan de Ejecución (Roadmap 7 Días)

| Fase | Título | Meta Técnica |
| :--- | :--- | :--- |
| **Día 1** | **Escalamiento e Infra** | Configuración de Docker, Orquestación de servicios y base de Angular/Flask. |
| **Día 2** | **Persistencia (Backend)** | Definición de modelos de datos, migraciones y seeds (datos de prueba). |
| **Día 3** | **Seguridad (Backend)** | Endpoints de Auth, generación de Tokens JWT y hashing de passwords. |
| **Día 4** | **Consumo de API (Frontend)** | Servicios de Angular, interceptores de JWT y estructura del Layout Global. |
| **Día 5** | **UX de Búsqueda (Frontend)** | Catálogo dinámico, componentes de filtrado y lógica de búsqueda en tiempo real. |
| **Día 6** | **Gestión de Artículos** | Formularios reactivos para crear/editar anuncios y control de estados. |
| **Día 7** | **Cierre y Documentación** | Pruebas de integración, pulido visual de Material y README de ejecución final. |

---

## 7. Entregables Esperados
1.  Repositorio Git con historial de commits siguiendo **Conventional Commits**.
2.  Archivo **docker-compose.yml** funcional para levantar el sistema completo en un paso.
3.  Manual de usuario breve con capturas de pantalla (Opcional pero recomendado).

---

**Nota:** Este documento servirá como guía maestra durante el desarrollo. Cada decisión técnica tomada se justifica con la necesidad de entregar una plataforma eficiente, organizada y lista para producción.

