## Running the Project with Docker

This project is composed of two main services: a Node.js backend and a Next.js frontend, each with its own Dockerfile. Both services are orchestrated using Docker Compose for easy setup and management.

### Project-Specific Docker Requirements

- **Node.js Version:** Both backend and frontend use `node:22.13.1-slim` (set via `NODE_VERSION` build argument).
- **Dependencies:**
  - Backend installs only production dependencies (`npm ci --production`).
  - Frontend builds with all dependencies, then prunes to production dependencies for the final image.

### Environment Variables

- **Backend:**
  - Expects a `.env` file in `./backend/` (referenced in `docker-compose.yml` as `env_file`).
- **Frontend:**
  - Expects a `.env` file in `./frontend/` (referenced in `docker-compose.yml` as `env_file`).

> **Note:** You must create and configure these `.env` files with the required environment variables for each service before building the containers.

### Build and Run Instructions

1. **Ensure Docker and Docker Compose are installed.**
2. **Prepare environment files:**
   - Create `./backend/.env` and `./frontend/.env` as needed for your environment.
3. **Build and start the services:**
   ```sh
   docker compose up --build
   ```
   This will build both the backend and frontend images and start the containers.

### Service Ports

- **Backend:**
  - Exposed on host port **4000** (container port 3000)
- **Frontend:**
  - Exposed on host port **3000** (container port 3000)

### Special Configuration

- Both services run as non-root users inside their containers for improved security.
- The frontend service depends on the backend and will wait for it to be available before starting.
- Both services are connected via a custom Docker network (`app-network`).

---

_If you have additional project-specific setup or configuration, please refer to the respective service documentation or codebase for further details._