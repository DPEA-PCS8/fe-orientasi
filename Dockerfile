FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built static files
COPY dist /usr/share/nginx/html

# OpenShift compatibility (Ini sudah benar):
# Permission fix agar bisa write ke folder cache/log saat running sebagai non-root
RUN chmod -R g+rwx /var/cache/nginx /var/run /var/log/nginx && \
    chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx && \
    sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf

# Expose port yang sama dengan 'listen' di nginx.conf
EXPOSE 8080

# Gunakan non-root user secara eksplisit
USER 1001

CMD ["nginx", "-g", "daemon off;"]