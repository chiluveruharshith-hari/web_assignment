# Use official Node.js Long Term Support (LTS) slim image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Set production environment variable
ENV NODE_ENV=production
ENV PORT=5000

# Install dependencies (cached if package files unchanged)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose the API and Web server port
EXPOSE 5000

# Health check to ensure service is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application server
CMD ["node", "server.js"]
