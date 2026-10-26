# Kulture Compass PWA — Vite build served by nginx (04-deployment §1).
# docker build -t kompass-web . && docker run -p 5173:80 -e API_UPSTREAM=http://host.docker.internal:5206 kompass-web

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Public, non-secret build flags only (FE-01 §9; the build refuses secret-looking VITE_* names).
ARG VITE_ENABLE_EVALUATION=false
ENV VITE_ENABLE_EVALUATION=$VITE_ENABLE_EVALUATION
RUN npm run build

FROM nginx:1.27-alpine
# /api is proxied same-origin so the HttpOnly refresh cookie works (02-security §2).
ENV API_UPSTREAM=http://api:8080
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
