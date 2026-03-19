# MarketCore Initial Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundations of Backend (Flask) and Frontend (Angular 17+) following the design spec, including Docker orchestration and a base authentication flow.

**Architecture:** Feature-Driven Angular (Signals + Standalone) and Modular Clean Architecture Flask (Repository Pattern + Service Layer). Communication via OpenAPI-defined contract.

**Tech Stack:** Python 3.11, Flask, SQLAlchemy, Marshmallow, Angular 17.2+, Angular Material, Docker, PostgreSQL.

---

## Part 1: Infrastructure & API Contract

### Task 1: Docker Orchestration Setup

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`
- Create: `frontend/Dockerfile`
- Create: `.dockerignore`
- Create: `backend/wait-for-it.sh`

- [ ] **Step 1: Create `backend/requirements.txt` with flask, flask-sqlalchemy, flask-migrate, flask-jwt-extended, flask-cors, marshmallow-sqlalchemy, psycopg2-binary**
- [ ] **Step 2: Create docker-compose.yml with postgres (healthcheck), backend (depends_on db), and frontend services**
- [ ] **Step 3: Create backend/Dockerfile (Python 3.11-slim) including `wait-for-it.sh`**
- [ ] **Step 4: Create frontend/Dockerfile (Node 20 + Nginx for production)**
- [ ] **Step 5: Verify orchestration with `docker-compose config`**
- [ ] **Step 6: Commit initial infra**

### Task 2: API Contract Validation Tooling

**Files:**
- Modify: `docs/api/openapi.yaml` (Verify content)
- Create: `scripts/validate-api.sh`

- [ ] **Step 1: Install spectral or similar OpenAPI linter**
- [ ] **Step 2: Run linter against `docs/api/openapi.yaml`**
- [ ] **Step 3: Fix any syntax or semantic errors in the spec**
- [ ] **Step 4: Commit validated spec**

---

## Part 2: Backend Core (Agent Backend)

### Task 3: Flask App Factory & Configuration

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/extensions.py` (SQLAlchemy, Migrate, JWT, CORS)
- Create: `backend/.env.example`

- [ ] **Step 1: Implement `create_app()` factory function with error handling**
- [ ] **Step 2: Define `Config` class with env variables (DATABASE_URL, JWT_SECRET_KEY)**
- [ ] **Step 3: Initialize extensions (db, jwt, cors) and create `.env.example`**
- [ ] **Step 4: Commit backend foundation**

### Task 4: Base Domain Models & Migrations

**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/category.py`
- Create: `backend/app/models/product.py`

- [ ] **Step 1: Define SQLAlchemy models for User, Category, and Product (with relationships)**
- [ ] **Step 2: Initialize migrations: `flask db init`, `flask db migrate -m "initial"`, `flask db upgrade`**
- [ ] **Step 3: Verify table creation in Postgres using `docker-compose exec db psql`**
- [ ] **Step 4: Commit models and migrations**

### Task 5: Authentication Flow (JWT)

**Files:**
- Create: `backend/app/repositories/user_repository.py`
- Create: `backend/app/services/auth_service.py`
- Create: `backend/app/api/v1/auth.py`
- Create: `backend/app/schemas/user.py`

- [ ] **Step 1: Implement `UserRepository` for finding users by email and saving new users**
- [ ] **Step 2: Implement User schemas with Marshmallow (matching OpenAPI)**
- [ ] **Step 3: Implement registration and login logic in `AuthService` using the repository**
- [ ] **Step 4: Create Auth Blueprint and register it in `create_app`**
- [ ] **Step 5: Commit Auth flow**

### Task 6: Catalog Backend (Products & Categories)

**Files:**
- Create: `backend/app/repositories/product_repository.py`
- Create: `backend/app/services/product_service.py`
- Create: `backend/app/api/v1/products.py`
- Create: `backend/app/api/v1/categories.py`
- Create: `backend/app/schemas/product.py`
- Create: `backend/app/schemas/category.py`

- [ ] **Step 1: Implement Product and Category schemas (Marshmallow)**
- [ ] **Step 2: Implement `ProductRepository` for filtered queries (search, category, price)**
- [ ] **Step 3: Implement `ProductService` and Blueprints for `GET /products` and `GET /categories`**
- [ ] **Step 4: Register Blueprints in `create_app` and verify with Postman/Curl**
- [ ] **Step 5: Commit Catalog backend**

---

## Part 3: Frontend Foundation (Agent Frontend)

### Task 7: Angular Standalone Project Scaffold

**Files:**
- Create: `frontend/` (via `ng new`)
- Modify: `frontend/angular.json`

- [ ] **Step 1: Ensure `frontend/` directory exists and is empty, then run `ng new frontend --standalone --routing --style scss --skip-git`**
- [ ] **Step 2: Add Angular Material and basic theme configuration**
- [ ] **Step 3: Scaffold folders: `core/`, `shared/components`, `features/auth`, `features/catalog`**
- [ ] **Step 4: Commit scaffold**

### Task 8: Core Services & Interceptors

**Files:**
- Create: `frontend/src/app/core/services/auth.service.ts`
- Create: `frontend/src/app/core/interceptors/jwt.interceptor.ts`
- Create: `frontend/src/app/core/models/` (generated)

- [ ] **Step 1: Generate TS models from `docs/api/openapi.yaml` using `openapi-generator-cli`**
- [ ] **Step 2: Implement `JwtInterceptor` to attach Bearer tokens automatically**
- [ ] **Step 3: Implement `AuthService` using Angular Signals for user state management**
- [ ] **Step 4: Commit Frontend core**

### Task 9: Catalog Feature - UI (Dumb Components)

**Files:**
- Create: `frontend/src/app/features/catalog/ui/product-card/product-card.component.ts`
- Create: `frontend/src/app/features/catalog/ui/search-bar/search-bar.component.ts`

- [ ] **Step 1: Implement `ProductCardComponent` with `ChangeDetectionStrategy.OnPush`**
- [ ] **Step 2: Implement `SearchBarComponent` with `ChangeDetectionStrategy.OnPush` and Debounce**
- [ ] **Step 3: Add basic styles using Angular Material components**
- [ ] **Step 4: Commit Catalog UI**

---

## Part 4: Integration & E2E

### Task 10: Catalog Page Integration (Smart Container)

**Files:**
- Create: `frontend/src/app/features/catalog/pages/catalog-page/catalog-page.component.ts`

- [ ] **Step 1: Implement `CatalogPageComponent` (Smart) connecting to `ProductService`**
- [ ] **Step 2: Use Signals for managing the product list and filter state reactively**
- [ ] **Step 3: Run full Docker stack and verify `GET /api/v1/products` displays in Frontend**
- [ ] **Step 4: Commit E2E integration**
