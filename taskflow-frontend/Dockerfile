# Build the React app, then serve the finished static files with nginx.
# Two stages: node is only needed to build — the image that runs is just nginx.
FROM node:22-alpine AS build
WORKDIR /web

# Same caching trick as the backend: dependencies first, code after.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The app calls the API on its own address under /api; nginx forwards it to FastAPI.
ENV VITE_API_BASE_URL=/api
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /web/dist /usr/share/nginx/html
