# ─── Stage 1: Base ────────────────────────────────────────
# WHY node:20-alpine:
#   alpine = minimal Linux image (~5MB vs ~900MB full)
#   node 20 = LTS, matches Firebase Cloud Functions support
#   smaller image = faster deploy on Render free tier
FROM node:20-alpine

# WHY: some npm packages need build tools (bcrypt, sharp etc)
#      apk = alpine package manager
#      --no-cache = don't store cache = smaller image
RUN apk add --no-cache python3 make g++

# ─── Working directory ────────────────────────────────────
# WHY /app: standard convention for Node apps in Docker
WORKDIR /app

# ─── Install dependencies ─────────────────────────────────
# WHY copy package.json FIRST before source code:
#   Docker caches each layer
#   If only source code changes → dependency layer is cached
#   → npm install skipped on redeploy = much faster builds
COPY package.json package-lock.json ./

# WHY --omit=dev:
#   production build doesn't need jest, nodemon etc
#   smaller final image, faster startup
RUN npm ci --omit=dev

# ─── Copy source code ─────────────────────────────────────
# WHY after npm install:
#   source changes are frequent
#   dependency changes are rare
#   this order maximizes Docker layer cache hits
COPY . .

# ─── Port ─────────────────────────────────────────────────
# WHY EXPOSE 5000: documents which port the app uses
#     Render reads this automatically
#     Must match PORT in your index.js
EXPOSE 5000

# ─── Health check ─────────────────────────────────────────
# WHY: Render pings this to know container is ready
#      without it Render may route traffic before app is ready
#      interval 30s = check every 30 seconds
#      timeout 10s  = fail if no response in 10s
#      retries 3    = mark unhealthy after 3 failures
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- https://gitroast-latest.onrender.com/health || exit 1

# ─── Start ────────────────────────────────────────────────
# WHY node directly not npm start:
#   node = one process, receives signals properly
#   npm start = spawns a child process
#   Docker SIGTERM for graceful shutdown goes to npm not node
#   → app doesn't shut down cleanly with npm start
CMD ["node", "index.js"]