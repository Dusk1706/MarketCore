# MarketCore: Módulos de Interacción (Mensajería, Órdenes y Reseñas)

**Fecha:** 2026-03-18  
**Estado:** Aprobado  
**Objetivo:** Reemplazar los datos estáticos (mock data) del sistema de confianza en el Frontend mediante la implementación de un backend robusto para órdenes de compra simuladas, mensajería asíncrona entre usuarios, y un sistema de calificaciones de vendedores basado en compras reales.

---

## 1. Arquitectura de Base de Datos (SQLAlchemy)

El sistema requiere tres nuevos dominios principales de datos:

### 1.1 Módulo de Órdenes (Agnóstico a Pasarela)
Diseñado para permitir integración futura con Stripe/PayPal sin cambiar el core.
*   **Tabla `orders`**:
    *   `id` (PK)
    *   `buyer_id` (FK -> users)
    *   `product_id` (FK -> products)
    *   `status` (Enum: PENDING, PAID, SHIPPED, COMPLETED, CANCELLED)
    *   `total_amount` (Numeric)
    *   `payment_gateway_id` (String, nullable, para ref externa futura)
    *   `created_at`, `updated_at`
*   *Nota de Lógica:* Al pasar a estado `PAID` o `COMPLETED`, un trigger/evento en el servicio de órdenes actualizará automáticamente `products.is_sold = True`.

### 1.2 Módulo de Mensajería Asíncrona
Sistema basado en Hilos (Conversaciones) para organizar los mensajes por producto y participante.
*   **Tabla `conversations`**:
    *   `id` (PK)
    *   `product_id` (FK -> products)
    *   `buyer_id` (FK -> users)
    *   `seller_id` (FK -> users)
    *   `created_at`, `updated_at`
*   **Tabla `messages`**:
    *   `id` (PK)
    *   `conversation_id` (FK -> conversations)
    *   `sender_id` (FK -> users)
    *   `content` (Text)
    *   `is_read` (Boolean, default False)
    *   `created_at`

### 1.3 Módulo de Reseñas (Trust Signals)
Solo los compradores que hayan completado una orden pueden dejar una reseña.
*   **Tabla `reviews`**:
    *   `id` (PK)
    *   `order_id` (FK -> orders, unique)
    *   `reviewer_id` (FK -> users)
    *   `reviewed_user_id` (FK -> users - El vendedor)
    *   `rating` (Integer, 1-5)
    *   `comment` (Text)
    *   `created_at`

---

## 2. API Endpoints (Flask)

Se expandirá el API v1 para exponer estas funcionalidades. Todas las rutas estarán protegidas por JWT.

*   **Orders:**
    *   `POST /api/v1/orders`: Crea una orden (simula el pago inmediato en fase 1).
    *   `GET /api/v1/orders/me`: Lista las órdenes del usuario (como comprador o vendedor).
*   **Conversations/Messages:**
    *   `GET /api/v1/conversations`: Lista la bandeja de entrada del usuario.
    *   `POST /api/v1/conversations`: Inicia un nuevo hilo desde un producto.
    *   `GET /api/v1/conversations/{id}/messages`: Carga los mensajes de un hilo.
    *   `POST /api/v1/conversations/{id}/messages`: Envía una respuesta.
*   **Reviews:**
    *   `POST /api/v1/orders/{id}/reviews`: Deja una reseña de una compra.
    *   `GET /api/v1/users/{id}/reviews`: Obtiene las reseñas públicas y el promedio de un vendedor.

---

## 3. Impacto en el Frontend (Angular 19)

### 3.1 Trust Signals Reales
*   El componente `ProductDetailComponent` deberá invocar el endpoint `/users/{seller_id}/reviews` para inyectar dinámicamente:
    *   Promedio de estrellas real.
    *   Total de reseñas y ventas confirmadas.

### 3.2 Flujo de Compra
*   El botón "COMPRAR AHORA" abrirá un diálogo de confirmación `MatDialog`.
*   Al confirmar, llamará a `POST /orders`, mostrará un snackbar de éxito y recargará la vista (el producto pasará a Vendido).

### 3.3 Bandeja de Mensajes
*   El botón "Contactar Vendedor" abrirá un `MatDialog` para el mensaje inicial.
*   Se creará una nueva pantalla `/seller/inbox` (Smart Component) donde los usuarios pueden ver sus `conversations` y responder mensajes en una UI tipo chat asíncrono.

---

## 4. Consideraciones de Seguridad
*   **Autorización:** Un usuario no puede comprar su propio producto.
*   **Privacidad:** Los mensajes de un hilo solo pueden ser leídos mediante la API por el `buyer_id` o `seller_id` especificado en la `conversation`.
*   **Integridad:** Un usuario no puede dejar más de una reseña por orden. Solo puede dejarla si la orden está pagada/completada y él es el `buyer_id`.