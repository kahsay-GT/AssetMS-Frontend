# AssetMS Frontend

RARAS Technologies — Organization Asset Management System  
Angular 18 · Angular Material · Tailwind CSS · Standalone Components

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- Angular CLI 18: `npm install -g @angular/cli@18`

---

## Install Dependencies

```bash
npm install
```

---

## Configure API URL

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'   // change if API runs on a different port
};
```

---

## Start Development Server

```bash
npm start
# or
ng serve
```

App runs at **http://localhost:4200**

---

## Build for Production

```bash
ng build
```

Output is in `dist/asset-ms-frontend/`.

---

## Run Tests

```bash
npm test
```

---

## Application Structure

```
src/app/
├── core/
│   ├── auth/           # AuthService (login, logout, token management)
│   ├── guards/         # authGuard, roleGuard
│   ├── interceptors/   # authInterceptor (attaches JWT, handles 401)
│   ├── models/         # TypeScript interfaces for all entities
│   └── services/       # API services (asset, organization, category, user, dashboard)
│
├── shared/
│   └── components/
│       ├── confirm-dialog/    # Reusable confirmation dialog
│       ├── loading-spinner/   # Loading indicator
│       ├── page-header/       # Standard page heading with icon + actions slot
│       └── status-chip/       # Coloured asset status badge
│
├── features/
│   ├── auth/login/       # Login page
│   ├── dashboard/        # Summary cards + recent assets + charts
│   ├── organization/     # Hierarchy tree, CRUD, move dialog
│   ├── assets/
│   │   ├── asset-list/   # Searchable, filterable, paginated table
│   │   ├── asset-form/   # Create / edit form
│   │   └── asset-detail/ # Tabbed: Overview | Documents | History
│   ├── users/            # User management (Admin only)
│   ├── categories/       # Category management (Admin only)
│   └── audit/            # Audit log viewer (Admin only)
│
└── layout/
    └── shell/            # Material sidenav shell with top toolbar
```

---

## Authentication

- Token stored in `sessionStorage` (cleared on tab close)
- `authInterceptor` attaches `Authorization: Bearer <token>` to every API request
- `authGuard` redirects unauthenticated users to `/login`
- `roleGuard(roles)` redirects insufficient-permission users to `/403`

---

## Sample Credentials

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@raras.com | Admin@1234 |
| Manager | manager@raras.com | Manager@1234 |
| Viewer | viewer@raras.com | Viewer@1234 |

---

## Key Features

- **Dashboard** — summary cards, assets by status/category bar charts, recent activity
- **Organization Tree** — expandable/collapsible nested tree; create, edit, move, archive units
- **Asset List** — search by name/number/serial, filter by category/status/org unit, sortable columns, pagination
- **Asset Detail** — full asset info with tabbed Documents (upload/download/delete) and History (timeline)
- **Users** (Admin) — create, edit, assign roles, deactivate/reactivate
- **Categories** (Admin) — create, edit, archive
- **Audit Logs** (Admin) — searchable, filterable audit trail

## UI/UX

- Angular Material components throughout
- Tailwind CSS utilities for layout and spacing
- Confirmation dialogs before destructive actions
- Snackbar notifications (success/error)
- Loading spinners and empty states
- Role-based navigation — menu items hidden for unauthorized roles
- Responsive layout suitable for desktop and tablet
