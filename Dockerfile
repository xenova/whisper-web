# --- STAGE 1: Compilation (Node Environment) ---
FROM alpine:latest AS builder

# Install Node.js and npm to enable compilation
RUN apk update && \
    apk add --no-cache nodejs npm

WORKDIR /app

# Copy dependency configuration files and install everything
COPY package*.json ./
RUN npm install

# Copy the rest of the files and generate the production 'dist' folder
COPY . .
RUN npm run build

# --- STAGE 2: Final Production Server (Nginx Environment) ---
FROM nginx:alpine

# Copy the compiled static files from the previous stage to the Nginx directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80, which is used by Nginx by default
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]