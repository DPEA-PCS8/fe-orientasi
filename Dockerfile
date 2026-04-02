FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html

RUN chmod -R g+rwx /var/cache/nginx /var/run /var/log/nginx && \
    chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx && \
    sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf

EXPOSE 8080
USER 1001

CMD ["nginx", "-g", "daemon off;"]