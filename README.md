# Guardian Care Pro — Web App

Web client for **Guardian Care Pro**, a care-coordination platform that connects independent support workers with NDIS participants, their guardians and support organisations.

Companion API: [guardian-care-pro-api](https://github.com/timmyproofficial/guardian-care-pro-api)

## Features

- **Role-based dashboards** for admins, support workers, participants and guardians
- **Shifts & timesheets**: view, confirm and review shifts; submit and approve timesheets
- **Invoicing**: single and weekly batch invoices with detail views
- **Incident reporting**: create, track and resolve incidents
- **Organisations & invites**: manage organisations, invite and onboard support workers
- **Service catalogue**: manage service types and rate/time bands
- **Real-time chat** between admins and users (Socket.IO)
- **Auth flows**: registration, login, password reset, guided profile setup

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Zustand · React Hook Form + Zod · Axios · Socket.IO client

## Getting started

```bash
npm install
cp .env.example .env   # then point it at your API
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the REST API, e.g. `http://localhost:3000/api/v1/v1` |
| `VITE_SOCKET_URL` | *(optional)* Socket.IO server URL. Defaults to the API's origin. |
