# build stage
FROM node:25.3.0-alpine AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# run stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# OpenShift compatibility:
# 1. Support running as arbitrary user (random UID) in root group (GID 0)
# 2. Grant group write permissions to necessary directories
RUN chmod -R g+rwx /var/cache/nginx /var/run /var/log/nginx && \
    chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx && \
    sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf

EXPOSE 8080