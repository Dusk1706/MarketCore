# MarketCore Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real interaction features replacing mock data: simulated purchasing (Orders), asynchronous messaging (Inbox), and verified reviews (Trust Signals).

**Architecture:** We will build backend models and endpoints for Orders, Conversations, Messages, and Reviews. The frontend will integrate these via generated API clients, adding dialogs for messaging/purchasing and a new Inbox view.

**Tech Stack:** Python (Flask, SQLAlchemy, Alembic, Pytest), TypeScript (Angular 19, Angular Material, RxJS, Jasmine/Karma).

---

### Task 1: Backend Database Models & Schemas

**Files:**
- Create: `backend/app/models/interaction.py`
- Modify: `backend/app/models/__init__.py`
- Create: `backend/app/schemas/interaction.py`
- Create: `backend/tests/test_interaction_models.py`

- [ ] **Step 1: Write tests for Interaction Models**
Write tests in `backend/tests/test_interaction_models.py` to assert that Order, Conversation, Message, and Review can be instantiated and saved.
Run: `docker-compose exec backend pytest tests/test_interaction_models.py`
Expected: FAIL (models not imported)

- [ ] **Step 2: Create the Order and Review models**
Implement `OrderStatus` enum, `Order` model (ensure `total_amount` and `payment_gateway_id` are included), and `Review` model in `backend/app/models/interaction.py`. Enforce unique constraint on `order_id` in `Review`.

- [ ] **Step 3: Create the Conversation and Message models**
Implement `Conversation` and `Message` models in the same file. Ensure `Message` has `is_read` boolean defaulting to False.

- [ ] **Step 4: Export new models in `__init__.py`**
Ensure models are imported in `backend/app/models/__init__.py`.

- [ ] **Step 5: Create Marshmallow schemas**
Implement `OrderSchema`, `ReviewSchema` (validate rating is 1-5), `MessageSchema`, and `ConversationSchema` (including nested basic user data for sender) in `backend/app/schemas/interaction.py`. Include input validation schemas (e.g. `OrderCreateSchema`, `ReviewCreateSchema`).

- [ ] **Step 6: Generate and apply database migrations**
Run: `docker-compose exec backend flask db migrate -m "add interactions models"`
Run: `docker-compose exec backend flask db upgrade`

- [ ] **Step 7: Run model tests**
Run: `docker-compose exec backend pytest tests/test_interaction_models.py`
Expected: PASS

- [ ] **Step 8: Commit**
Commit message: `feat(backend): add models and schemas for orders, messaging, and reviews`

---

### Task 2: Backend API Endpoints (Orders & Reviews)

**Files:**
- Create: `backend/app/api/v1/interactions.py`
- Modify: `backend/app/__init__.py`
- Create: `backend/tests/test_api_interactions.py`

- [ ] **Step 1: Write tests for Orders and Reviews API**
Write tests asserting order creation logic (buyer != seller, product is available, `total_amount` is calculated from product price), the `GET /orders/me` endpoint, review creation logic (1 per order, buyer only, order is PAID/COMPLETED), and the `GET /users/<id>/reviews` endpoint.
Run: `docker-compose exec backend pytest tests/test_api_interactions.py::TestOrdersAndReviews`
Expected: FAIL (404 Not Found)

- [ ] **Step 2: Implement Order creation (Simulated Payment)**
Endpoint `POST /api/v1/orders`. Body requires `product_id`. Verify product exists and `is_sold == False`. Verify buyer is not seller. Create Order with status `PAID`, copying the product's `price` into `total_amount`. Update Product `is_sold = True`.

- [ ] **Step 3: Implement List User Orders**
Endpoint `GET /api/v1/orders/me`. Returns list of orders where user is `buyer_id` or `seller_id`.

- [ ] **Step 4: Implement Review endpoints**
Endpoint `POST /api/v1/orders/<id>/reviews`. Verify user is buyer and order is PAID/COMPLETED. Ensure only 1 review exists per order.
Endpoint `GET /api/v1/users/<id>/reviews`. Returns `{ average_rating: 4.5, total_sales: 120, reviews: [...] }`.

- [ ] **Step 5: Register blueprint in `__init__.py`**
Register `interactions_bp`.

- [ ] **Step 6: Run tests**
Run: `docker-compose exec backend pytest tests/test_api_interactions.py::TestOrdersAndReviews`
Expected: PASS

- [ ] **Step 7: Commit**
Commit message: `feat(backend): implement order and review endpoints with security constraints`

---

### Task 3: Backend API Endpoints (Messaging)

**Files:**
- Modify: `backend/app/api/v1/interactions.py`
- Modify: `backend/tests/test_api_interactions.py`

- [ ] **Step 1: Write tests for Messaging API**
Write tests for conversation creation, listing conversations, retrieving messages (enforcing privacy so only buyer/seller can read), and sending replies.
Run: `docker-compose exec backend pytest tests/test_api_interactions.py::TestMessaging`
Expected: FAIL (404 Not Found)

- [ ] **Step 2: Implement Conversation endpoints**
`POST /api/v1/conversations`: Accepts `product_id` and initial `content`. Creates conversation and first message in a single transaction.
`GET /api/v1/conversations`: Lists conversations where user is buyer or seller.

- [ ] **Step 3: Implement Message endpoints with Security Constraints**
`GET /api/v1/conversations/<id>/messages`: Lists messages. Enforce that `current_user.id` is either `conversation.buyer_id` or `conversation.seller_id`.
`POST /api/v1/conversations/<id>/messages`: Appends message to thread. Enforce same privacy constraint.

- [ ] **Step 4: Run tests**
Run: `docker-compose exec backend pytest tests/test_api_interactions.py::TestMessaging`
Expected: PASS

- [ ] **Step 5: Commit**
Commit message: `feat(backend): implement async messaging endpoints with privacy constraints`

---

### Task 4: Frontend API Sync & Models

**Files:**
- Modify: `docs/api/openapi.yaml`
- Command: Regenerate Angular API client

- [ ] **Step 1: Update OpenAPI spec**
Add the new paths and schemas defined in Tasks 2 and 3 to `docs/api/openapi.yaml`. Update the `Product` schema to include `trust_signals` object.

- [ ] **Step 2: Run openapi-generator**
Run `npx @openapitools/openapi-generator-cli generate -i docs/api/openapi.yaml -g typescript-angular -o frontend/src/app/core/api`

- [ ] **Step 3: Verify Angular Compilation**
Run: `cd frontend && npm run build`
Expected: PASS (or minor warnings, no errors related to new models)

- [ ] **Step 4: Commit**
Commit message: `chore(frontend): synchronize api client with interaction endpoints`

---

### Task 5: Frontend - Integrate Trust Signals & Buy Flow

**Files:**
- Modify: `frontend/src/app/features/catalog/pages/product-detail/product-detail.component.ts`
- Modify: `frontend/src/app/features/catalog/pages/product-detail/product-detail.component.html`
- Modify: `frontend/src/app/features/catalog/pages/product-detail/product-detail.component.spec.ts`
- Create: `frontend/src/app/features/catalog/ui/purchase-dialog/purchase-dialog.component.ts`
- Create: `frontend/src/app/features/catalog/ui/purchase-dialog/purchase-dialog.component.html`
- Create: `frontend/src/app/features/catalog/ui/purchase-dialog/purchase-dialog.component.spec.ts`

- [ ] **Step 1: Write tests for Purchase Dialog**
Write tests in `purchase-dialog.component.spec.ts` to ensure it renders product details and emits true on confirmation.
Run: `cd frontend && npm test -- --include=**/purchase-dialog.component.spec.ts --watch=false`
Expected: FAIL (Component not implemented)

- [ ] **Step 2: Implement Purchase Confirmation Dialog**
Create `PurchaseDialogComponent` using `MatDialogModule` to confirm "Are you sure you want to buy this item for $X?".

- [ ] **Step 3: Run Purchase Dialog tests**
Run: `cd frontend && npm test -- --include=**/purchase-dialog.component.spec.ts --watch=false`
Expected: PASS

- [ ] **Step 4: Write tests for ProductDetail logic**
Update `product-detail.component.spec.ts` to assert that it fetches user reviews upon loading and handles the "Comprar Ahora" button click (calling `ordersApi.createOrder`).
Run: `cd frontend && npm test -- --include=**/product-detail.component.spec.ts --watch=false`
Expected: FAIL

- [ ] **Step 5: Fetch and display real Trust Signals**
Update `ProductDetailComponent` to fetch `/users/{seller_id}/reviews`. Update HTML to use dynamic values for stars, rating, and total sales.

- [ ] **Step 6: Implement "Comprar Ahora" action**
Bind the buy button to open the `PurchaseDialogComponent`. Upon dialog confirmation (true), call `ordersApi.createOrder`. Show success snackbar, and set `product().is_sold = true`.

- [ ] **Step 7: Run Product Detail tests**
Run: `cd frontend && npm test -- --include=**/product-detail.component.spec.ts --watch=false`
Expected: PASS

- [ ] **Step 8: Commit**
Commit message: `feat(frontend): integrate real trust signals and TDD purchase confirmation flow`

---

### Task 6: Frontend - Messaging UI (Inbox)

**Files:**
- Create: `frontend/src/app/features/catalog/ui/contact-dialog/contact-dialog.component.ts`
- Create: `frontend/src/app/features/catalog/ui/contact-dialog/contact-dialog.component.html`
- Create: `frontend/src/app/features/catalog/ui/contact-dialog/contact-dialog.component.spec.ts`
- Create: `frontend/src/app/features/inbox/pages/inbox-page/inbox-page.component.ts`
- Create: `frontend/src/app/features/inbox/pages/inbox-page/inbox-page.component.html`
- Create: `frontend/src/app/features/inbox/pages/inbox-page/inbox-page.component.spec.ts`
- Modify: `frontend/src/app/app.routes.ts`
- Modify: `frontend/src/app/app.component.html`

- [ ] **Step 1: Write tests for Contact Dialog**
Write tests in `contact-dialog.component.spec.ts` to ensure it captures text input and emits it.
Run: `cd frontend && npm test -- --include=**/contact-dialog.component.spec.ts --watch=false`
Expected: FAIL (Component not implemented)

- [ ] **Step 2: Implement Contact Dialog**
Create `ContactDialogComponent` with a textarea to send the first message. Bind it to the "Contactar Vendedor" button in `ProductDetailComponent` to call `POST /api/v1/conversations`.

- [ ] **Step 3: Run Contact Dialog tests**
Run: `cd frontend && npm test -- --include=**/contact-dialog.component.spec.ts --watch=false`
Expected: PASS

- [ ] **Step 4: Write tests for Inbox Logic**
Write tests in `inbox-page.component.spec.ts` asserting it fetches conversations on init, fetches messages when a conversation is selected, and successfully calls the API to send a reply.
Run: `cd frontend && npm test -- --include=**/inbox-page.component.spec.ts --watch=false`
Expected: FAIL (Component not implemented)

- [ ] **Step 5: Create Inbox Page UI**
Scaffold `InboxPageComponent`. Create the layout: a list of conversations on the left, and a message thread view on the right.

- [ ] **Step 6: Implement Fetch Conversations**
Implement logic to call `GET /api/v1/conversations` on init and display them in the left pane.

- [ ] **Step 7: Implement Select Conversation & View Messages**
Implement logic so clicking a conversation calls `GET /api/v1/conversations/{id}/messages` and displays the thread on the right.

- [ ] **Step 8: Implement Reply Form**
Implement the form to send a new message (`POST /api/v1/conversations/{id}/messages`) and append it to the thread.

- [ ] **Step 9: Run Inbox Page tests**
Run: `cd frontend && npm test -- --include=**/inbox-page.component.spec.ts --watch=false`
Expected: PASS

- [ ] **Step 10: Register `/seller/inbox` route**
Add route to `app.routes.ts` protected by `authGuard`. Add link in the User Menu (navbar) modifying `app.component.html`.

- [ ] **Step 11: Commit**
Commit message: `feat(frontend): implement TDD messaging inbox and contact dialog`