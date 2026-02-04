# build stage
FROM node:25.3.0-alpine AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# run stage
FROM nginx:alpine

# Copy config yang sudah diperbaiki tadi
COPY nginx.conf /etc/nginx/conf.d/default.conf

# PENTING: Destinasi ini (/usr/share/nginx/html) harus sama dengan 'root' di nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

# OpenShift compatibility (Ini sudah benar):
# Permission fix agar bisa write ke folder cache/log saat running sebagai non-root
RUN chmod -R g+rwx /var/cache/nginx /var/run /var/log/nginx && \
    chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx && \
    sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf

# Expose port yang sama dengan 'listen' di nginx.conf
EXPOSE 8080

# (Optional tapi disarankan) Gunakan non-root user secara eksplisit
USER 1001

CMD ["nginx", "-g", "daemon off;"]