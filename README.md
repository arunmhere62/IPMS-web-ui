# PG Management - Admin Web (pg-web-app)

Admin web dashboard for the PG Management system.

## Prerequisites

- Node.js (LTS recommended)
- npm (or pnpm/yarn)

## Setup

From repository root:

```bash
cd pg-web-app
npm install
```

## Run (Development)

```bash
npm run dev
```

Vite will print the local URL (usually `http://localhost:5173`).

## Build

```bash
npm run build
```

## Preview production build

```bash
npm run preview
```

## Backend / API configuration

This app calls the backend API.

- Ensure the API server is running (see `api/` project).
- Configure the API base URL in the frontend API client (search for Axios baseURL / API config in `src/`).

### RTK Query (Redux Toolkit Query)

This app includes RTK Query for API calls.

- **Store**: `src/app/store.ts`
- **Base API**: `src/services/base-api.ts`
- **Example service**: `src/services/legal-documents-api.ts`

Set the API URL using:

- `VITE_API_BASE_URL` (example: `http://localhost:5000/api/v1`)

Example usage:

- `useGetLegalDocumentsQuery({ page: 1, limit: 10 })`


## Login behavior

This project currently bypasses the login page and routes directly to the dashboard.

- `/login` redirects to `/dashboard`
- Route protection is disabled in `src/App.tsx`

If you later re-enable auth, restore the `PrivateRoute` logic and bring back the login page.

## Template cleanup notes

This project was originally created from a dashboard template.

- Remove/replace template branding (title/meta tags, favicon, images) in `index.html` and `public/images/`.
- If you are not using Clerk-based auth, you can remove the Clerk routes under `src/routes/clerk/*` and remove `@clerk/clerk-react` dependency.

