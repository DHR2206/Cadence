# Backend Deployment & Production Guide

This guide details the steps to deploy the FastAPI backend of Cadence to production.

## Configuration & Environment Variables

The backend application is configured using environment variables.

| Variable | Description | Default | Example |
|---|---|---|---|
| `ALLOWED_ORIGINS` | Comma-separated list of origins allowed to make CORS requests. | `http://localhost:3000,http://127.0.0.1:3000` | `https://cadence-app.vercel.app` |
| `PORT` | The port on which Uvicorn will listen (handled by the hosting platform). | `8080` | `8000` |

## Frontend Secret Configuration

Set `ENCRYPTION_KEY` in the frontend runtime environment before enabling Google or Moodle credential storage. It must decode to exactly 32 bytes and should be generated with:

```bash
openssl rand -base64 32
```

Keep the value stable across deployments. Rotating it requires decrypting existing `integrations` credentials with the old key and re-encrypting them with the new key.

For Google Classroom and Google Calendar sync, also set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to the same OAuth client configured for Supabase Google auth. The app stores Google refresh tokens encrypted and uses these server-side credentials to mint short-lived access tokens during sync.

## Docker Deployment

To package and run the backend as a container, use the Dockerfile located at `backend/Dockerfile`.

### Build Image
Run the following command from the **repository root directory**:
```bash
docker build -f backend/Dockerfile -t cadence-planner-api .
```

### Run Container Locally
To test the Docker container locally:
```bash
docker run -p 8080:8080 -e ALLOWED_ORIGINS="http://localhost:3000" cadence-planner-api
```
The health check will then be available at `http://localhost:8080/health`.

## Remote Deployments (Render / Fly.io / GCP)

### Render (Web Service)
1. Create a new **Web Service** on Render pointing to your git repository.
2. Select **Docker** as the environment.
3. In the advanced settings, set the Dockerfile path to `backend/Dockerfile` and Build Context to `.`.
4. Add the `ALLOWED_ORIGINS` environment variable pointing to your frontend URL.

### GCP Cloud Run
Deploy directly from source:
```bash
gcloud run deploy cadence-planner-api \
  --source . \
  --port 8080 \
  --set-env-vars ALLOWED_ORIGINS="https://your-frontend-domain.com"
```
Cloud Run will automatically build the image using the specified `backend/Dockerfile`.
