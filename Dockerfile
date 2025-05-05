# 1. Base image
FROM node:20-alpine AS base

WORKDIR /app

# 2. Copy root files and install root dependencies (if any)
COPY package*.json ./

# 3. Install dependencies for API and UI
COPY packages/api/package*.json ./packages/api/
COPY packages/ui/package*.json ./packages/ui/
RUN cd packages/api && npm install --production
RUN cd packages/ui && npm install --production

# 4. Copy all source code
COPY . .

# 5. Build the frontend
RUN cd packages/ui && npm run build

# 6. Expose the port
EXPOSE 8987

# 7. Start the API (which should serve the built UI)
WORKDIR /app/packages/api
CMD ["npm", "start"]