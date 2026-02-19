# Deploy to Render

Follow these steps to deploy the Financial Crime Detection Engine on [Render](https://render.com).

## Prerequisites

- A [Render](https://render.com) account (free tier works)
- Your code in a Git repo (GitHub, GitLab, or Bitbucket)

---

## Option A: Deploy with Dashboard (recommended)

### 1. Push your code

Ensure your project is pushed to GitHub/GitLab/Bitbucket and that the repo is connected to Render (or you’ll connect it in the next step).

### 2. Create a new Web Service

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
2. Connect your Git provider if needed, then select this repository and branch.

### 3. Configure the service

Use these settings:

| Field | Value |
|-------|--------|
| **Name** | `financial-crime-engine` (or any name) |
| **Region** | Choose one (e.g. Oregon) |
| **Runtime** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm run start-server` |
| **Instance Type** | Free (or paid if you prefer) |

### 4. Environment (optional)

- Render sets `NODE_ENV=production` in production.
- If your app needs env vars (e.g. API keys), add them under **Environment** in the dashboard.

### 5. Deploy

Click **Create Web Service**. Render will:

1. Run `npm run build` (installs server + client deps, builds the React app).
2. Run `npm run start-server` (starts the Express server).
3. Serve the app and API at your Render URL (e.g. `https://financial-crime-engine.onrender.com`).

---

## Option B: Deploy with Blueprint (`render.yaml`)

1. Ensure `render.yaml` is in the root of your repo (it’s already there).
2. In Render: **New** → **Blueprint**.
3. Connect the repo; Render will read `render.yaml` and create the Web Service with the same build/start commands.

You can then adjust **Build Command** and **Start Command** in the dashboard if needed.

---

## What the app does on Render

- **Build**: `npm run build` runs `install-all` (server + client) and `build-client` (Vite build → `client/dist`).
- **Start**: `npm run start-server` runs `cd server && npm start` (Express on `PORT` from Render).
- The server serves the React app from `client/dist` and the API under `/api` on the same URL.

---

## Troubleshooting

- **Build fails**: Check the build logs. Ensure both `server` and `client` have valid `package.json` and that `npm run build` completes locally.
- **Blank page**: Confirm the **Start Command** is `npm run start-server` and that the server is reading `client/dist` (only in production).
- **API 404**: The client uses `/api/upload` (relative). Don’t use `localhost` in production; the same Render URL serves both UI and API.

---

## Free tier notes

- Free web services spin down after ~15 minutes of no traffic; the first request after that may be slow (cold start).
- For always-on uptime, use a paid instance.
