FROM node:20-alpine

WORKDIR /app

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm install --production

COPY . .

# Adjust permissions for uploads
RUN mkdir -p uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001
CMD ["node", "src/server.js"]
