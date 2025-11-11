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

# Production stage with HTTPS support
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy HTTPS nginx configuration
COPY nginx-https.conf /etc/nginx/conf.d/default.conf

# Create directory for SSL certificates (will be mounted from k8s secret)
RUN mkdir -p /etc/nginx/ssl

# Expose ports 80 and 443
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
