# Project Context Information

## 🚨 **LIVING DOCUMENT: KEEP UPDATED!** 🚨
*   **Purpose:** This file is Sage's primary context and memory between sessions. It contains critical rules, configurations, and procedures.
*   **Responsibility:** Both Chef and Sage are responsible for ensuring this document remains accurate and reflects the current state of the project plan, infrastructure, and agreed-upon workflows.
*   **Updates:** Any changes to deployment procedures, server configurations, critical environment variables, or operational rules MUST be reflected here immediately.
*   **Review:** Review this file periodically, especially before complex operations or after significant changes.

## ⚠️ CRITICAL BUILD & DEPLOYMENT RULES (aka Sage's Law) ⚠️
### 1. BUILD RESPONSIBILITY
   - Sage (AI) NEVER performs builds
   - Chef (user) ALWAYS handles all builds
   - Sage must REQUEST builds from Chef when needed
   - NO EXCEPTIONS to this rule
   - IMPORTANT: Builds take over 4 minutes and often timeout in remote sessions
   - DO NOT attempt builds through SSH/remote connection

### 2. DEPLOYMENT WORKFLOW
   - Sage: Makes code changes
   - We attempt to use primarily the local dev environment for development and testing.
   - If we need to test something on the PROD instance:
    - Sage: STOPS here and REQUESTS build from Chef
    - Chef: Handles all build/rebuild operations locally to avoid timeouts
    - Chef: updates the files on the server
    - IMPORTANT: Docker containers DO NOT support hot-reload
    - Simply copying files to the server is NOT sufficient
    - Container rebuilds are REQUIRED for changes to take effect
    - This applies to BOTH frontend and backend services

### 3. SERVER OPERATIONS
   - Sage NEVER restarts servers or services
   - Chef ALWAYS handles all server restarts
   - Sage must REQUEST server restarts from Chef when needed
   - NO EXCEPTIONS to this rule

### 4. ⚠️ GIT VERSION CONTROL RULES ⚠️
- Sage (AI) NEVER COMMITS TO GIT, ONLY CHEF
- Sage NEVER uses git add, git commit, git push, or any other git commands
- Sage should act as if git does not exist
- Chef handles ALL version control operations
- NO EXCEPTIONS to this rule

### 5. NODE.JS VERSION REQUIREMENTS ⚠️
- ALWAYS use Node.js LTS version (v18.x or newer)
- System default Node.js v14 WILL NOT WORK with this application
- Run `nvm use --lts` before starting any server or client or installing a dependency
- Chef manages the servers in a terminal window running Node.js LTS
- Do NOT attempt to fix Node.js compatibility issues in the code
- If Node.js errors appear (e.g., `Unexpected token '||='`), this indicates the wrong Node version
- NEVER try to restart servers or clients without the correct Node.js version

### 6. CRITICAL CONFIGURATION NOTES
**IMPORTANT: THE DEV SERVER IS ON PORT 5001, NOT 5000. DO NOT ARGUE THIS POINT.**

---

Dev servers should run locally for frontend and backend
MongoDB server runs in Docker on the production server (192.168.1.17)
Local development backend server will connect to the MongoDB container running inside Docker on the server using the `MONGODB_URI` specified in `packages/api/.env`.

---

## Server Access & Services

### Server Connection
- SSH Command: `ssh server`, this is an SSH alias and will not require a password
- Project Path: `/mnt/Media/Docker/BaseGeek/`
- Server IP: 192.168.1.17

### Frontend Service Port (Host)
*   The frontend Nginx container exposes its internal port 80 on host port **`9989`**.
*   Chef's external reverse proxy should connect to this port (`9989`) on the host (`192.168.1.17`).

## Database Configuration
### Shared MongoDB Instance
- BaseGeek provides the shared MongoDB instance for all GeekSuite applications
- MongoDB instance runs in Docker on the server (192.168.1.17:27018)
- The database name is "geek_suite" and uses shared authentication across all GeekSuite apps
- Connections are made directly to the server IP, not via Docker container names
- Database credentials are shared across GeekSuite applications

### Shared Redis Instance
- BaseGeek also provides a shared Redis instance for caching and real-time features
- Redis instance runs in Docker on the server (192.168.1.17:6380)
- Used for session management, caching, and real-time features across GeekSuite apps
- No authentication required for Redis (internal network only)

### MongoDB Credentials
# These credentials are used to connect to the shared MongoDB instance
# Server: 192.168.1.17:27018
MONGO_INITDB_ROOT_USERNAME=ngeek_usr_f8z3k9b1
MONGO_INITDB_ROOT_PASSWORD=NotePass_ngk_7Hq-pLm5sRzYtW2_K

---

## Special Notes
1. Always check `.env` (production) or `.env.local` (development) file for current credentials and configuration.
2. Use `docker compose` commands from within `/mnt/Media/Docker/BaseGeek` on the server
3. Frontend container needs to be rebuilt after most changes due to static file serving
4. Development is done on macOS machine with deployment to Linux server
5. BaseGeek provides the shared MongoDB instance for all GeekSuite applications
6. The development backend connects directly to the server MongoDB instance, just like the production backend

## Project Documentation
- **Project Plan**: `DOCS/PLAN.md` - Contains the complete development roadmap, phases, and implementation details
- **Features Documentation**: `DOCS/FEATURES.md` - Detailed feature specifications, technical implementation details, and usage examples
- **Context File**: `CURSOR-CONTEXT.md` - Current file containing operational rules and configurations

## GeekSuite Overview
- GeekSuite is a collection of custom applications designed to replace commonly used programs
- All apps share consistent design patterns and tech stack:
  - Frontend: React (PWA), Material-UI (MUI)
  - Backend: Node.js/Express
  - Database: MongoDB (shared instance provided by BaseGeek)
  - Cache: Redis (shared instance provided by BaseGeek)
  - Deployment: Docker/Docker Compose
- Known Apps in Suite:
  - NoteGeek (Reference): Markdown-based note-taking app
  - BuJoGeek (Current): Digital Bullet Journal
  - BaseGeek (Current): Database management and shared services
  - Future apps will follow same patterns and infrastructure

## Project Status
- Currently in initial setup phase
- Recent completions:
  - Project plan created
  - Tech stack defined
  - Development environment configured
  - Shared MongoDB instance configured
- Next priorities:
  - Set up MongoDB container on server
  - Initialize project structure
  - Implement core database management features