# 1. Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
COPY packages/ui/package*.json ./packages/ui/

# Install all dependencies (including devDependencies)
RUN cd packages/api && npm install
RUN cd packages/ui && npm install

# Copy all source code
COPY . .

# Build the frontend
RUN cd packages/ui && npm run build

# 2. Production stage
FROM node:20-alpine AS prod

WORKDIR /app

# Copy only production node_modules for API
COPY --from=build /app/packages/api/node_modules ./packages/api/node_modules

# Copy built UI
COPY --from=build /app/packages/ui/dist ./packages/ui/dist

# Copy API source
COPY packages/api ./packages/api

# Copy any root files needed (env, etc.)
COPY package*.json ./

# Expose the port
EXPOSE 8987

# Start the API
WORKDIR /app/packages/api
CMD ["npm", "start"]