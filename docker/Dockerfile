
FROM node:20-alpine

WORKDIR /app

# Install backend
COPY backend /app/backend
RUN cd /app/backend && npm init -y && npm install express

# Copy frontend
COPY frontend /app/frontend

EXPOSE 3000
CMD ["node", "backend/server.js"]