FROM node:22-alpine AS build

WORKDIR /app
RUN apk add --no-cache ca-certificates ffmpeg
COPY server/certs/*.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
RUN apk add --no-cache ca-certificates ffmpeg
COPY server/certs/*.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-ssr ./dist-ssr
COPY --from=build /app/src/data ./src/data
COPY server ./server
COPY shared ./shared
RUN mkdir -p public/uploads
EXPOSE 3000
CMD ["node", "server/index.js"]
