FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_MODE=vps
ENV VITE_API_MODE=$VITE_API_MODE
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
EXPOSE 3000
CMD ["node", "server/index.js"]
