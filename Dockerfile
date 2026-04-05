FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build the frontend
RUN npm run build

# Expose port
EXPOSE 4001

# Start the server (which serves both backend and frontend)
CMD ["npm", "run", "dev:server"]
