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

WORKDIR /app/packages/api

# Copy API package files
COPY packages/api/package*.json ./

# Install only production dependencies for API
RUN npm install --production

# Copy API source
COPY packages/api .

# Copy built UI to the expected location
COPY --from=build /app/packages/ui/dist ./../ui/dist

# Expose the port
EXPOSE 8987

# Start the API
CMD ["npm", "start"]