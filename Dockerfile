FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and react-is for Vite bundling
RUN npm install --legacy-peer-deps && npm install react-is --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Cloud Run port configuration
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

# Start server
CMD ["npm", "start"]
