# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Caddy for automatic HTTPS
FROM caddy:2-alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/caddy

# Copy Caddyfile configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Create directory for SSL certificates (will be mounted from k8s secret for now)
RUN mkdir -p /etc/caddy/ssl

# Expose ports 80 and 443
EXPOSE 80 443

# Caddy will start automatically with the default entrypoint
# Using Caddyfile at /etc/caddy/Caddyfile
